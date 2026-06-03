pub mod bonus;
pub mod cloud;
pub mod config;
pub mod env;
pub mod intent;
pub mod models;
pub mod sources;

pub use bonus::{
    apply_bonus_pipeline, apply_context_management, apply_context_trim, apply_input_bonus,
    build_prune_transcript, compress_rtk_text, estimate_tokens, guess_context_window,
    plan_context_trim, BonusApplyResult, CompressionProfile, ContextTrimPlan,
};
pub mod virtual_models;
pub use cloud::{
    cloud_api_reachable, cloud_api_healthy, cloud_auth_ready, cloud_base_url_from_env,
    cloud_dev_port_free, cloud_fully_ready, cloud_is_dev_local, cloud_listener_command,
    cloud_listener_is_foreign, is_valid_session_token, kill_dev_cloud_listener, CloudConfig,
    DEFAULT_CLOUD_BASE_URL,
};
pub use virtual_models::{resolve_request_model, resolve_virtual_model_id};
pub use config::{AppSettings, ProxyConfig, TrafficPath};
pub use env::{load_dotenv, nodeai_data_dir, GatewayConfig};
pub use intent::default_model_for_intent;
pub use models::{
    default_virtual_models, GatewayModelPricing, ModelCatalogEntry, ProxyStatus, VirtualModelAlias,
};
pub use sources::{load_sources_file, save_sources_file, ByokSourceRecord, SourcesFile};

pub const DEFAULT_PROXY_PORT: u16 = 8787;
pub const DEFAULT_LISTEN_HOST: &str = "127.0.0.1";
