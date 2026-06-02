/// Default NodeAI Cloud API — local dev server (`nodeai-cloud-dev` on :8788).
/// Override with `NODEAI_CLOUD_BASE_URL` when staging/production exists.
pub const DEFAULT_CLOUD_BASE_URL: &str = "http://127.0.0.1:8788";

/// Resolve Cloud API base URL: env override → built-in localhost.
pub fn cloud_base_url_from_env() -> String {
    if let Some(url) = std::env::var("NODEAI_CLOUD_BASE_URL")
        .ok()
        .map(|s| s.trim().trim_end_matches('/').to_string())
        .filter(|s| !s.is_empty())
    {
        return url;
    }
    DEFAULT_CLOUD_BASE_URL.to_string()
}

pub fn cloud_is_dev_local(base_url: &str) -> bool {
    let u = base_url.to_lowercase();
    u.contains("127.0.0.1") || u.contains("localhost")
}

/// Quick TCP probe — Cloud dev API listening (default :8788).
pub fn cloud_api_reachable(base_url: &str) -> bool {
    cloud_socket_addr(base_url)
        .and_then(|addr| {
            use std::net::TcpStream;
            use std::time::Duration;
            TcpStream::connect_timeout(&addr, Duration::from_millis(500)).ok()
        })
        .is_some()
}

/// GET /health and expect `"ok":true` — stronger than TCP alone.
pub fn cloud_api_healthy(base_url: &str) -> bool {
    use std::io::{Read, Write};
    use std::net::TcpStream;
    use std::time::Duration;

    let Some(addr) = cloud_socket_addr(base_url) else {
        return false;
    };
    let mut stream = match TcpStream::connect_timeout(&addr, Duration::from_millis(800)) {
        Ok(s) => s,
        Err(_) => return false,
    };
    let _ = stream.set_read_timeout(Some(Duration::from_millis(800)));
    let host = match addr.ip() {
        std::net::IpAddr::V4(v4) => v4.to_string(),
        std::net::IpAddr::V6(v6) => format!("[{v6}]"),
    };
    let req = format!(
        "GET /health HTTP/1.1\r\nHost: {host}:{}\r\nConnection: close\r\n\r\n",
        addr.port()
    );
    if stream.write_all(req.as_bytes()).is_err() {
        return false;
    }
    let mut buf = [0u8; 768];
    let n = stream.read(&mut buf).unwrap_or(0);
    if n == 0 {
        return false;
    }
    let text = String::from_utf8_lossy(&buf[..n]);
    text.contains("\"ok\":true") || text.contains("\"ok\": true")
}

fn cloud_socket_addr(base_url: &str) -> Option<std::net::SocketAddr> {
    use std::net::SocketAddr;

    let url = base_url.trim().trim_end_matches('/');
    let host_port = url
        .strip_prefix("http://")
        .or_else(|| url.strip_prefix("https://"))
        .unwrap_or(url);
    let (host, port) = match host_port.rsplit_once(':') {
        Some((h, p)) => (h, p.parse::<u16>().unwrap_or(8788)),
        None => (host_port, 8788),
    };
    format!("{host}:{port}").parse::<SocketAddr>().ok()
}

/// True when nothing is listening on the Cloud dev port (safe to spawn).
pub fn cloud_dev_port_free(base_url: &str) -> bool {
    let Some(addr) = cloud_socket_addr(base_url) else {
        return false;
    };
    std::net::TcpListener::bind(addr).is_ok()
}

#[derive(Debug, Clone)]
pub struct CloudConfig {
    pub base_url: String,
}

impl CloudConfig {
    pub fn from_env() -> Self {
        Self {
            base_url: cloud_base_url_from_env(),
        }
    }

    pub fn dev_local(&self) -> bool {
        cloud_is_dev_local(&self.base_url)
    }
}

pub fn is_valid_session_token(token: &str) -> bool {
    let t = token.trim();
    !t.is_empty() && (t.starts_with("nodeai_session_") || t.starts_with("nsk_"))
}
