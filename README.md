# WhatsApp API

Links your personal WhatsApp account via [whatsapp-web.js](https://wwebjs.dev/) and exposes a small HTTP API for sending messages.

## Setup

```bash
npm install
npm start
```

On first run a QR code prints to the terminal. On your phone open
**WhatsApp → Settings → Linked Devices → Link a Device** and scan it.

The QR refreshes every ~20 seconds, so scan it from a live terminal.

After scanning, the session is saved to `./session/` and you won't need to scan
again on subsequent runs.

## Endpoints

Server listens on `http://localhost:3000` (override with `PORT`).

### `GET /status`

```json
{ "ready": true }
```

`ready` is false until the QR has been scanned and the client has finished loading.

### `POST /send`

```bash
curl -X POST http://localhost:3000/send \
  -H 'Content-Type: application/json' \
  -d '{"number": "919876543210", "message": "hello"}'
```

`number` is in international format with country code, no `+` and no leading
zeros. Response:

```json
{ "success": true, "id": "true_919876543210@c.us_3EB0..." }
```

Incoming messages are logged to the console. Hook into the `client.on('message')`
handler in `index.js` to do something with them.

## Notes

- This uses an unofficial library that drives WhatsApp Web in a headless Chrome
  instance. It is against WhatsApp's Terms of Service and accounts can be banned
  for automated use. Fine for personal projects; use the official
  [Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) for anything
  business-facing.
- `session/` holds your login credentials. Never commit it or share it — it grants
  full access to your WhatsApp account.
