# Vantage Deployment Instructions

## Prerequisites

1. Node.js 18+ installed
2. Vercel CLI installed (`npm install -g vercel`)
3. Vercel account with proper permissions

## Deployment Steps

### 1. Install Dependencies

```bash
cd /root/PastaOS/products/vantage
npm install
```

### 2. Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate with your Vercel account.

### 3. Deploy to Production

```bash
vercel --prod --yes
```

This will deploy the application to production with the current configuration.

## Environment Variables

Make sure the following environment variables are set in your Vercel project:

- `NEXTAUTH_URL` - Should be set to your deployed URL (e.g., https://your-vantage-app.vercel.app)
- `NEXTAUTH_SECRET` - A random string used to encrypt JWT tokens

You can set these in the Vercel dashboard under your project settings, or by running:

```bash
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
```

## Post-Deployment

1. Verify the landing page is accessible
2. Test the signup flow
3. Confirm dashboard access after authentication
4. Test API key input functionality

## Troubleshooting

If you encounter any issues:

1. Check that all dependencies are installed: `npm install`
2. Verify the build succeeds locally: `npm run build`
3. Ensure environment variables are properly set
4. Check Vercel logs for any deployment errors

The application should be fully functional once deployed with proper environment variables configured.