pub mod config;
pub mod models;

pub use config::{AppSettings, ProxyConfig, TrafficPath};
pub use models::{
    default_virtual_models, ModelCatalogEntry, ProxyStatus, VirtualModelAlias,
};

pub const DEFAULT_PROXY_PORT: u16 = 8787;
pub const DEFAULT_LISTEN_HOST: &str = "127.0.0.1";
