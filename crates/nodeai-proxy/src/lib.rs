mod auth;
mod routes;
mod usage;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::Router;
use nodeai_core::{default_virtual_models, ProxyConfig, ProxyStatus};
use tokio::sync::oneshot;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

#[derive(Clone)]
pub struct ProxyState {
    pub config: ProxyConfig,
    pub catalog: Arc<Vec<nodeai_core::ModelCatalogEntry>>,
    pub usage: usage::UsageStore,
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

pub async fn start(config: ProxyConfig) -> Result<ProxyHandle, std::io::Error> {
    let addr: SocketAddr = format!("{}:{}", config.host, config.port)
        .parse()
        .expect("valid listen address");

    let state = ProxyState {
        config: config.clone(),
        catalog: Arc::new(default_virtual_models()),
        usage: usage::UsageStore::default(),
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
