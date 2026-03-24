import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgentSentry — Memory-Aware Agent Safety',
  description:
    'Zero-dependency agent safety platform with hash-chained memory, secret detection, risk scoring, and progressive enablement. Your AI agents never forget — and never go rogue.',
  openGraph: {
    title: 'AgentSentry — Memory-Aware Agent Safety',
    description: 'Zero-dependency agent safety with hash-chained memory, secret detection, and progressive enablement.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
