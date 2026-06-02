use nodeai_core::AppSettings;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "nodeai_proxy=info".into()),
        )
        .init();

    nodeai_core::load_dotenv();
    let config = AppSettings::default().proxy;
    let handle = nodeai_proxy::start(config)
        .await
        .expect("failed to start proxy");
    tracing::info!(addr = %handle.status.listen_addr, "NodeAI proxy running");
    tokio::signal::ctrl_c().await.ok();
    handle.stop().await;
}
