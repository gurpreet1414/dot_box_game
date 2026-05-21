import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dots and Boxes',
  description: 'Real-time multiplayer Dots and Boxes game',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className + ' bg-gradient-to-br from-zinc-900 to-zinc-800 min-h-screen'}>
        {children}
      </body>
    </html>
  );
}
