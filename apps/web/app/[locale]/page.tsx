import { isServerLoggedIn } from '@/lib/auth/server-auth';
import { LandingPage } from '@/components/landing-page';
// import { redirect } from 'next/navigation';
import { redirect } from '@/i18n/navigation';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const isLoggedIn = await isServerLoggedIn();
  const { locale } = await params;

  if (isLoggedIn) {
    redirect({
      href: '/chat',
      locale,
    });
  }

  return <LandingPage />;
}
