pub mod bonus;
pub mod config;
pub mod env;
pub mod intent;
pub mod models;

pub use bonus::{apply_bonus_pipeline, compress_rtk_text, estimate_tokens, BonusApplyResult, CompressionProfile};
pub use config::{AppSettings, ProxyConfig, TrafficPath};
pub use env::{load_dotenv, GatewayConfig};
pub use intent::default_model_for_intent;
pub use models::{
    default_virtual_models, GatewayModelPricing, ModelCatalogEntry, ProxyStatus, VirtualModelAlias,
};

pub const DEFAULT_PROXY_PORT: u16 = 8787;
pub const DEFAULT_LISTEN_HOST: &str = "127.0.0.1";
