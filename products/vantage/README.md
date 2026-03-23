# Vantage — Your AI Prediction Market Agent

Vantage is an AI-powered agent that scans Kalshi prediction markets, identifies actionable signals, and enables paper trading for fast feedback cycles.

## Features

- **Kalshi Market Scanning**: Comprehensive coverage of all major Kalshi categories
- **Signal Generation**: AI-powered analysis to identify potential opportunities
- **Paper Trading**: Risk-free simulation environment for testing strategies
- **Performance Analytics**: Track and optimize your trading approach

## Tech Stack

- Next.js 16
- NextAuth.js for authentication
- Tailwind CSS for styling
- Vercel for deployment

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd /root/PastaOS/products/vantage
npm install
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Building for Production

```bash
npm run build
```

### Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Project Structure

```
app/
  ├── components/          # Shared components
  ├── api/                 # API routes
  │   └── auth/            # Authentication routes
  ├── signup/              # Signup page
  ├── dashboard/           # User dashboard
  └── page.js              # Landing page
src/
  ├── scanner-kalshi-native.js  # Kalshi market scanner
  ├── executor.js               # Trade execution (paper-only)
  └── notifier.js               # Notification system
```

## Security

- All trades are paper-only (no real money involved)
- API keys are encrypted before storage
- User data is kept secure and private

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

## Disclaimer

This is a beta product for research and testing purposes only. All trading is simulated and does not involve real money or live market orders. Past performance is not indicative of future results. Use at your own risk.