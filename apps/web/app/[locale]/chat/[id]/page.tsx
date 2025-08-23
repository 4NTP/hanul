import { ChatPage } from '@/components/chat-page';
import { redirect } from '@/i18n/navigation';
import { isServerLoggedIn } from '@/lib/auth/server-auth';

export default async function ChatWithId({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  const isLoggedIn = await isServerLoggedIn();

  if (!isLoggedIn) {
    redirect({
      href: '/',
      locale,
    });
  }
  return <ChatPage chatId={id} />;
}
