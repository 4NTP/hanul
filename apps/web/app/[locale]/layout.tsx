import '@hanul/ui/globals.css';

import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ClientProviders } from '@/components/client-providers';
import { ServerProviders } from '@/components/server-providers';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

const pretendard = localFont({
  src: '../../fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
});

export const metadata: Metadata = {
  title: 'Hanul - AI Agent Service',
  description:
    'Hanul is an intelligent AI agent service platform that automates tasks and provides smart assistance.',
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${pretendard.className}`}>
        <ServerProviders params={params}>
          <ClientProviders>
            <div className="flex min-h-svh flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              {/* <Footer /> */}
            </div>
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  );
}
