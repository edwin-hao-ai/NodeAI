use std::sync::Arc;

use axum::Router;
use nodeai_core::{default_virtual_models, load_dotenv, CloudConfig, GatewayConfig, ProxyConfig, ProxyStatus};
use tokio::sync::oneshot;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

pub mod auth;
pub mod byok;
pub mod cloud;
pub mod gateway;
mod memory;
mod pipeline;
pub mod prune;
pub mod routes;
mod smart_route;
mod store;
mod usage;
mod usage_capture;

#[derive(Clone)]
pub struct ProxyState {
    pub config: ProxyConfig,
    /// Offline virtual aliases; live catalog fetched per-request via NodeAI Cloud.
    pub catalog: Arc<Vec<nodeai_core::ModelCatalogEntry>>,
    pub usage: usage::UsageStore,
    pub bonus: pipeline::BonusState,
    /// Dev-only escape hatch: desktop holds Gateway key (NODEAI_DEV_DIRECT_GATEWAY=1).
    pub gateway: Option<GatewayConfig>,
    pub cloud: CloudConfig,
    pub db: Arc<store::UsageDb>,
    pub memory: Arc<memory::MemoryDb>,
}

pub struct ProxyHandle {
    shutdown: Option<oneshot::Sender<()>>,
    pub status: ProxyStatus,
}

impl ProxyHandle {
    pub async fn stop(mut self) {
        if let Some(tx) = self.shutdown.take() {
            let _ = tx.send(());
        }
    }
}

fn dev_direct_gateway() -> bool {
    std::env::var("NODEAI_DEV_DIRECT_GATEWAY")
        .ok()
        .is_some_and(|v| v == "1" || v.eq_ignore_ascii_case("true"))
}

pub async fn start(config: ProxyConfig) -> Result<ProxyHandle, std::io::Error> {
    load_dotenv();
    let cloud = CloudConfig::from_env();
    let gateway = if dev_direct_gateway() {
        GatewayConfig::from_env()
    } else {
        None
    };

    tracing::info!(
        url = %cloud.base_url,
        dev_local = cloud.dev_local(),
        "NodeAI Cloud API configured"
    );
    if gateway.is_some() {
        tracing::warn!("NODEAI_DEV_DIRECT_GATEWAY=1: desktop holds Gateway key (dev only, not production)");
    }

    let catalog = Arc::new(default_virtual_models());

    let db = Arc::new(store::UsageDb::open_default());
    if let Err(err) = db.init() {
        tracing::warn!(%err, path = ?db.path(), "usage db init failed");
    }
    let memory_path = db.path().parent().unwrap_or(std::path::Path::new(".")).join("memory.db");
    let memory = Arc::new(
        memory::MemoryDb::open(memory_path).unwrap_or_else(|err| {
            tracing::warn!(%err, "memory db init failed");
            memory::MemoryDb::open(std::path::PathBuf::from(":memory:")).expect("in-memory db")
        }),
    );
    let usage = usage::UsageStore::default();
    if let Err(err) = db.hydrate(&usage) {
        tracing::warn!(%err, "usage db hydrate failed");
    }

    let addr: SocketAddr = format!("{}:{}", config.host, config.port)
        .parse()
        .expect("valid listen address");

    let state = ProxyState {
        config: config.clone(),
        catalog,
        usage,
        bonus: pipeline::BonusState::default(),
        gateway,
        cloud,
        db,
        memory,
    };

    let app = Router::new()
        .merge(routes::router())
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();

    tokio::spawn(async move {
        let server = axum::serve(listener, app).with_graceful_shutdown(async {
            let _ = shutdown_rx.await;
        });
        if let Err(err) = server.await {
            tracing::error!(%err, "proxy server stopped with error");
        }
    });

    Ok(ProxyHandle {
        shutdown: Some(shutdown_tx),
        status: ProxyStatus {
            running: true,
            listen_addr: addr.to_string(),
            base_url: config.base_url(),
        },
    })
}

use std::net::SocketAddr;

pub async fn status_from_config(config: &ProxyConfig) -> ProxyStatus {
    let addr: SocketAddr = format!("{}:{}", config.host, config.port)
        .parse()
        .expect("valid listen address");
    let running = tokio::net::TcpStream::connect(addr).await.is_ok();
    ProxyStatus {
        running,
        listen_addr: addr.to_string(),
        base_url: config.base_url(),
    }
}
