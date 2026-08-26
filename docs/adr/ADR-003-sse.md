# ADR-003: Server-Sent Events (SSE) for Real-Time Streaming AI Responses

## Status
**Accepted**

## Context
When students ask questions to the AI tutor, waiting for a full 1,000-word response to finish generating introduces a 3-5 second delay. A streaming response UI improves user experience by rendering text incrementally as tokens are produced.

We evaluated two streaming protocols:
1. **WebSockets**: Full-duplex bidirectional persistent TCP socket connection.
2. **Server-Sent Events (SSE)**: Standard HTTP unidirectional server-to-client event stream.

## Decision
We selected **Server-Sent Events (SSE)** via Spring MVC `ResponseBodyEmitter` / `SseEmitter` and standard browser `EventSource` / `fetch` readable streams.

## Rationale & Trade-offs

### Advantages:
- **Lightweight Standard**: Operates over standard HTTP/1.1 and HTTP/2 connections without requiring protocol upgrades or custom WebSocket frames.
- **Native Browser Reconnection**: Browsers automatically manage connection dropouts.
- **Nginx Proxy Alignment**: Easy reverse proxy configuration with standard `proxy_buffering off`.

### Trade-offs & Consequences:
- **Unidirectional Only**: Student prompts are sent via POST; responses stream via SSE. This fits the tutor streaming model perfectly.
