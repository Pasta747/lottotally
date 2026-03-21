import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Vantage — Your AI prediction market agent',
  description: 'Paper-only beta agent for Kalshi prediction markets.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
