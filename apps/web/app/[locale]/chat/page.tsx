import { ChatPage } from '@/components/chat-page';
import { redirect } from '@/i18n/navigation';
import { isServerLoggedIn } from '@/lib/auth/server-auth';

export default async function Chat() {
  return <ChatPage />;
}
