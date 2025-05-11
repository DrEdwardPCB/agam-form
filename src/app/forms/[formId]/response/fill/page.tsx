import { authOptions } from '@/lib/auth';
import FormFiller from '@/components/form-filler';
import { getServerSession } from 'next-auth';
import { Navbar } from '@/components/navbar';
import { redirect } from 'next/navigation';

export default async function FormFillPage({ params }: { params: { formId: string } }) {
  const awaitedParams = await params;
  const formId = parseInt(awaitedParams.formId);
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect('/login');
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar session={session} />
      <div className="w-full py-8">
        <FormFiller formId={formId} onSubmitSuccessRedirect="/forms" />
      </div>
    </div>
  );
}
