import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { FileText, Database, Building2 } from 'lucide-react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MemTech — Générateur de Mémoires Techniques BTP',
  description: 'Transformez vos appels d\'offres en mémoires techniques exploitables',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased`}>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
              <FileText className="h-5 w-5 text-blue-600" />
              MemTech
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dossiers
              </Link>
              <Link
                href="/company"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5"
              >
                <Building2 className="h-3.5 w-3.5" />
                Mon entreprise
              </Link>
              <Link
                href="/knowledge"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5"
              >
                <Database className="h-3.5 w-3.5" />
                Base interne
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
