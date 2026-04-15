# Mind Recharge Frontend

## Vercel SPA Routing

This project uses `react-router-dom` with `BrowserRouter`, so direct refreshes on
paths like `/friends/chat/2` must be rewritten to `index.html`.

The Vercel rewrite is configured in [vercel.json](/D:/thi%20pe/mind-recharge/mind-recharge-fe/vercel.json).

## WebRTC / TURN

For production video calling, configure ICE servers through `VITE_WEBRTC_ICE_SERVERS`.

Example:

```env
VITE_WEBRTC_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:your-turn-host:3478","username":"turn-user","credential":"turn-password"}]
```
