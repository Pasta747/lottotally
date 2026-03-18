# TOOLS.md - Local Notes

## Key Paths

- **Pinger app:** `/root/PastaOS/products/pinger`
- **Canopy app:** `/root/PastaOS/products/canopy-filter`
- **Shared Google Workspace CLI:** `/root/PastaOS/tools/google-workspace`
- **Google OAuth client/token source:**
  - `/root/PastaOS/PA_Athena/credentials/google-oauth-client.json`
  - `/root/PastaOS/PA_Athena/credentials/google-token.json`

## Known Tooling Gaps / Misconfig

- `web_search` is intermittently unavailable here (Gemini/grounding key path issue). Use `web_fetch`/browser fallback when blocked.
- Google Workspace token currently misses some expanded scopes for Drive/Sheets/Docs/Contacts until re-consent flow is completed.

## Operational Notes

- Vercel deploy from Pinger root works with `npx vercel --prod --yes --token=$VERCEL_TOKEN`.
- Blog content path (Pinger): `apps/web/content/blog/*.md`.
