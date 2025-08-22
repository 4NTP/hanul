'use server';

import { NextIntlClientProvider } from 'next-intl';

export async function ServerProviders({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
  );
}
