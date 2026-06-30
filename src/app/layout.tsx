// ─────────────────────────────────────────────────────────────
// CredVault – Root Layout
// ─────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/providers/WalletProvider';
import { ToastProvider } from './toast-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'CredVault — Stellar Skill Attestation & Micro-Payments',
  description:
    'Turn every XLM payment into a verifiable career credential. Send skill-tagged payments on Stellar Testnet and build your on-chain proof of work.',
  keywords: [
    'Stellar',
    'Blockchain',
    'Credentials',
    'Freelancer',
    'XLM',
    'dApp',
    'Web3',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased min-h-screen">
        <WalletProvider>
          <ToastProvider>{children}</ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
