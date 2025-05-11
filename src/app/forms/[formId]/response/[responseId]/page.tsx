import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ResponseDetail } from '@/components/response-detail';
import { Navbar } from '@/components/navbar';
import { getServerSession } from 'next-auth';

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ formId: string; responseId: string }>;
}) {
  const awaitedParams = await params;
  const formId = parseInt(awaitedParams.formId);
  const responseId = parseInt(awaitedParams.responseId);
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect('/login');
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar session={session} />
      <div className="w-full py-8 flex flex-col items-center">
        <ResponseDetail formId={formId} responseId={responseId} />
      </div>
    </div>
  );
}
