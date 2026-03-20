import './globals.css';

export const metadata = {
  title: 'Vantage — Your AI prediction market agent',
  description: 'Paper-only beta agent for Kalshi prediction markets.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
