use std::sync::Arc;

use axum::{
    body::Body,
    extract::State,
    http::{HeaderMap, StatusCode},
    response::Response,
    routing::{get, post},
    Json, Router,
};
use futures_util::StreamExt;
use nodeai_cloud::{
    fetch_gateway_models, merge_with_virtual, relay_gateway_chat, AuthStore, CloudUser,
};
use nodeai_core::{default_virtual_models, load_dotenv, resolve_request_model, GatewayConfig};
use serde::Deserialize;
use serde_json::{json, Value};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

#[derive(Clone)]
struct AppState {
    gateway: Option<GatewayConfig>,
    auth: Arc<AuthStore>,
}

fn session_from_headers(
    state: &AppState,
    headers: &HeaderMap,
) -> Result<CloudUser, (StatusCode, Json<Value>)> {
    let token = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|raw| {
            raw.trim()
                .strip_prefix("Bearer ")
                .or_else(|| raw.trim().strip_prefix("bearer "))
                .map(str::trim)
        });
    let Some(token) = token else {
        return Err(auth_err("NodeAI session required", "session_required"));
    };
    state.auth.validate_session(token).map_err(|err| {
        auth_err(&err.to_string(), "session_invalid")
    })
}

fn auth_err(message: &str, code: &str) -> (StatusCode, Json<Value>) {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({
            "error": {
                "message": message,
                "type": "nodeai_auth_required",
                "code": code
            }
        })),
    )
}

#[derive(Debug, Deserialize)]
struct AuthBody {
    email: Option<String>,
    password: Option<String>,
    name: Option<String>,
}

async fn health(State(state): State<AppState>) -> Json<Value> {
    Json(json!({
        "ok": true,
        "service": "nodeai-cloud",
        "gateway_registry": state.gateway.is_some(),
    }))
}

async fn auth_register(
    State(state): State<AppState>,
    Json(body): Json<AuthBody>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let email = body.email.as_deref().unwrap_or("").trim();
    let password = body.password.as_deref().unwrap_or("");
    if email.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": { "message": "email required" } })),
        ));
    }
    let user = state
        .auth
        .register(email, password, body.name.as_deref())
        .map_err(|err| {
            (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": { "message": err.to_string() } })),
            )
        })?;
    Ok(Json(json!({ "user": user })))
}

async fn auth_session(
    State(state): State<AppState>,
    Json(body): Json<AuthBody>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let email = body.email.as_deref().unwrap_or("").trim();
    let password = body.password.as_deref().unwrap_or("");
    if email.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": { "message": "email required" } })),
        ));
    }
    let (token, user) = state.auth.login(email, password).map_err(|err| {
        (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": { "message": err.to_string() } })),
        )
    })?;
    tracing::info!(email = %user.email, "cloud session issued");
    Ok(Json(json!({ "token": token, "user": user })))
}

async fn list_models(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let _user = session_from_headers(&state, &headers)?;
    let gw = state.gateway.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": {
                    "message": "Gateway registry not configured on cloud server",
                    "type": "nodeai_not_configured"
                }
            })),
        )
    })?;

    let remote = fetch_gateway_models(gw).await.map_err(|err| {
        (
            StatusCode::BAD_GATEWAY,
            Json(json!({
                "error": { "message": err, "type": "gateway_registry_error" }
            })),
        )
    })?;

    tracing::info!(count = remote.len(), "Vercel AI Gateway /v1/models registry loaded");
    let data = merge_with_virtual(default_virtual_models(), remote);
    Ok(Json(json!({ "object": "list", "data": data })))
}

async fn chat_completions(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(mut body): Json<Value>,
) -> Result<Response, (StatusCode, Json<Value>)> {
    let _user = session_from_headers(&state, &headers)?;
    let gw = state.gateway.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": { "message": "Gateway not configured" } })),
        )
    })?;
    let intent = headers
        .get("x-nodeai-intent")
        .and_then(|v| v.to_str().ok());
    let smart = headers
        .get("x-nodeai-smart-route")
        .and_then(|v| v.to_str().ok())
        == Some("1");
    resolve_request_model(&mut body, intent, smart);

    let app = headers
        .get("x-nodeai-app")
        .and_then(|v| v.to_str().ok())
        .map(str::to_string);

    let resp = relay_gateway_chat(gw, &body, app.as_deref())
        .await
        .map_err(|err| {
            (
                StatusCode::BAD_GATEWAY,
                Json(json!({ "error": { "message": err } })),
            )
        })?;

    let status = StatusCode::from_u16(resp.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);
    let content_type = resp
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("application/json")
        .to_string();

    if content_type.contains("text/event-stream") {
        let stream = resp.bytes_stream().map(|result| {
            result.map_err(|err| std::io::Error::new(std::io::ErrorKind::Other, err.to_string()))
        });
        return Response::builder()
            .status(status)
            .header("content-type", content_type)
            .header("x-nodeai-cloud", "1")
            .body(Body::from_stream(stream))
            .map_err(|err| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "error": { "message": err.to_string() } })),
                )
            });
    }

    let bytes = resp.bytes().await.map_err(|err| {
        (
            StatusCode::BAD_GATEWAY,
            Json(json!({ "error": { "message": err.to_string() } })),
        )
    })?;

    Response::builder()
        .status(status)
        .header("content-type", content_type)
        .header("x-nodeai-cloud", "1")
        .body(Body::from(bytes.to_vec()))
        .map_err(|err| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": { "message": err.to_string() } })),
            )
        })
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "nodeai_cloud=info".into()),
        )
        .init();

    load_dotenv();
    let gateway = GatewayConfig::from_env();
    if gateway.is_some() {
        tracing::info!("NodeAI Cloud dev server: Gateway registry enabled");
    } else {
        tracing::warn!("AI_GATEWAY_API_KEY not set — model registry will return 503");
    }

    let auth = Arc::new(AuthStore::open_default().expect("auth db"));
    let port: u16 = std::env::var("NODEAI_CLOUD_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(8788);

    let state = AppState { gateway, auth };
    let app = Router::new()
        .route("/health", get(health))
        .route("/v1/auth/register", post(auth_register))
        .route("/v1/auth/session", post(auth_session))
        .route("/v1/models", get(list_models))
        .route("/v1/chat/completions", post(chat_completions))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("127.0.0.1:{port}");
    tracing::info!(%addr, "NodeAI Cloud dev API listening");
    let listener = tokio::net::TcpListener::bind(&addr).await.expect("bind");
    axum::serve(listener, app).await.expect("serve");
}
