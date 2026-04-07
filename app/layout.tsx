import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Content Guardian - Trust & Safety Platform',
  description: 'AI-Powered Content Moderation System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-[280px] min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}