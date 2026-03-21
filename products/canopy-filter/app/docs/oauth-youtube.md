# YouTube OAuth Flow

## Sequence
1. User clicks **Connect YouTube** (`/api/youtube/connect`)
2. App sets:
   - `canopy_creator_id` (1 year, httpOnly)
   - `canopy_youtube_oauth_state` (10 min, httpOnly)
3. User is redirected to Google OAuth consent with `youtube.readonly`
4. Google redirects back to `/api/youtube/callback?code=...&state=...`
5. Callback validates state cookie, exchanges code for tokens
6. App fetches:
   - channel summary
   - recent videos
   - recent channel comments
7. App classifies comments and persists by creator/channel
8. User redirected to dashboard with success query params

## Token handling
- Access token stored in `canopy_youtube_connections.access_token`
- Refresh token stored (when returned)
- Expiry stored in `token_expires_at`
- Dashboard refreshes expired access token via refresh token

## Security controls
- state cookie validation to mitigate CSRF in OAuth callback
- creator identity maintained in httpOnly cookie
- OAuth state cookie cleared after callback

## Required env
- `GOOGLE_CLIENT_ID` or `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` or `GOOGLE_OAUTH_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL` (or fallback app URL derivation)
