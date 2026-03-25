import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MemTech — Mémoires Techniques & Chiffrage BTP',
  description: 'Mémoires techniques, chiffrage et comparatifs de devis pour le BTP',
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
            <div className="flex items-center gap-1">
              {/* Primary — le flow principal */}
              <Link
                href="/"
                className="text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors font-medium"
              >
                Mes projets
              </Link>

              {/* Separator */}
              <div className="w-px h-5 bg-gray-200 mx-2" />

              {/* Secondary — outils & config */}
              <Link
                href="/company"
                className="text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2.5 py-1.5 rounded-md transition-colors"
              >
                Entreprise
              </Link>
              <Link
                href="/knowledge"
                className="text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2.5 py-1.5 rounded-md transition-colors"
              >
                Base interne
              </Link>
              <Link
                href="/prices"
                className="text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2.5 py-1.5 rounded-md transition-colors"
              >
                Bible de prix
              </Link>
              <Link
                href="/quotes"
                className="text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2.5 py-1.5 rounded-md transition-colors"
              >
                Comparatifs
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
