# Kalshi API Reference (for OddsTool v2)

## Docs
- Full docs: https://docs.kalshi.com/welcome
- Auth guide: https://docs.kalshi.com/getting_started/quick_start_authenticated_requests
- Order lifecycle: https://docs.kalshi.com/getting_started/quick_start_create_order
- API reference: https://docs.kalshi.com/api-reference
- OpenAPI spec: https://docs.kalshi.com/openapi.yaml

## Auth
- API Key ID: env var `KALSHI_API_KEY_ID`
- Private Key: env var `KALSHI_PRIVATE_KEY` (RSA PEM)
- Signature method: RSA-PSS with SHA256
- Message to sign: `{timestamp_ms}{HTTP_METHOD}{path_without_query_params}`
- Headers required on every authenticated request:
  - `KALSHI-ACCESS-KEY` — API Key ID
  - `KALSHI-ACCESS-TIMESTAMP` — current time in milliseconds
  - `KALSHI-ACCESS-SIGNATURE` — base64-encoded RSA-PSS signature

## Base URLs
- Production: `https://api.elections.kalshi.com/trade-api/v2`
- Demo: `https://demo-api.kalshi.co/trade-api/v2`

## Key Endpoints
- `GET /portfolio/balance` — account balance
- `GET /portfolio/positions` — current positions
- `GET /portfolio/orders` — order history
- `GET /markets` — browse markets
- `GET /events` — get events
- `POST /portfolio/orders` — place an order

## Node.js Signing Example
```javascript
const crypto = require('crypto');

function signRequest(privateKeyPem, timestampMs, method, path) {
  const pathWithoutQuery = path.split('?')[0];
  const message = `${timestampMs}${method}${pathWithoutQuery}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  
  const signature = sign.sign({
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
  });
  
  return signature.toString('base64');
}
```

## Phase 7 Implementation Notes
- Start with demo env for testing
- Validate signature works with GET /portfolio/balance first
- Order placement: POST /portfolio/orders
- Use $5 unit size, respect max daily exposure
- Paper trading validation must pass before enabling live
