import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChatInterface } from '@/components/ChatInterface';

export default async function ChatPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return <ChatInterface />;
}