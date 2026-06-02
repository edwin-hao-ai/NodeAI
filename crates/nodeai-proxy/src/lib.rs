mod auth;
mod gateway;
mod pipeline;
mod routes;
mod smart_route;
mod store;
mod usage;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::Router;
use nodeai_core::{default_virtual_models, load_dotenv, GatewayConfig, ProxyConfig, ProxyStatus};
use tokio::sync::oneshot;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

#[derive(Clone)]
pub struct ProxyState {
    pub config: ProxyConfig,
    pub catalog: Arc<Vec<nodeai_core::ModelCatalogEntry>>,
    pub usage: usage::UsageStore,
    pub bonus: pipeline::BonusState,
    pub gateway: Option<GatewayConfig>,
    pub db: Arc<store::UsageDb>,
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

async fn bootstrap_catalog(gateway: &Option<GatewayConfig>) -> Vec<nodeai_core::ModelCatalogEntry> {
    if let Some(gw) = gateway {
        match gateway::fetch_models(gw).await {
            Ok(models) => {
                tracing::info!(count = models.len(), "loaded model catalog from AI Gateway");
                return models;
            }
            Err(err) => {
                tracing::warn!(%err, "AI Gateway model fetch failed; using fallback catalog");
            }
        }
    }
    default_virtual_models()
}

pub async fn start(config: ProxyConfig) -> Result<ProxyHandle, std::io::Error> {
    load_dotenv();
    let gateway = GatewayConfig::from_env();
    if gateway.is_some() {
        tracing::info!("AI Gateway configured for allowance path");
    } else {
        tracing::warn!("AI_GATEWAY_API_KEY not set — allowance chat will return 503");
    }

    let catalog = Arc::new(bootstrap_catalog(&gateway).await);

    let db = Arc::new(store::UsageDb::open_default());
    if let Err(err) = db.init() {
        tracing::warn!(%err, path = ?db.path(), "usage db init failed");
    }
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
        db,
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
