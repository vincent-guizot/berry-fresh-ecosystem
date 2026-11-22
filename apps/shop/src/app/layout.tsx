import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '../lib/cartContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Berry Fresh Shop — Freshness Connected',
  description: 'Premium fresh berries delivered in strict cold-chain from highland farms.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-berry-cream text-berry-charcoal">
        <CartProvider>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
