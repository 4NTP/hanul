import { ChatPage } from '@/components/chat-page';
import { redirect } from '@/i18n/navigation';
import { isServerLoggedIn } from '@/lib/auth/server-auth';

export default async function Chat({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const isLoggedIn = await isServerLoggedIn();

  if (!isLoggedIn) {
    redirect({
      href: '/',
      locale,
    });
  }

  return <ChatPage />;
}
