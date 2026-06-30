// ─────────────────────────────────────────────────────────────
// CredVault – Main Page
// ─────────────────────────────────────────────────────────────

'use client';

import Navbar from '@/components/Navbar';
import TestnetWorkbench from '@/components/TestnetWorkbench';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <TestnetWorkbench />
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-slate-800/50">
        <p className="text-xs text-slate-600">
          Built on{' '}
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            Stellar
          </a>{' '}
          Testnet • CredVault © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
