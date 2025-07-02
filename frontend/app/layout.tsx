import './globals-simple.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Thesaurus - Contextual Synonyms & Antonyms',
  description: 'Discover contextual synonyms, antonyms, and meanings powered by local AI models',
  keywords: ['thesaurus', 'synonyms', 'antonyms', 'AI', 'language', 'context', 'semantic'],
  authors: [{ name: 'AI Thesaurus Team' }],
  openGraph: {
    title: 'AI Thesaurus - Contextual Synonyms & Antonyms',
    description: 'Discover contextual synonyms, antonyms, and meanings powered by local AI models',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Thesaurus - Contextual Synonyms & Antonyms',
    description: 'Discover contextual synonyms, antonyms, and meanings powered by local AI models',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <Providers>
          <div className="min-h-full">
            <main className="pb-8">
              {children}
            </main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}