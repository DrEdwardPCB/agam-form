import { FormEditor } from '@/components/form-editor';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
export default async function EditFormPage({ params }: { params: { formId: string } }) {
  const formId = parseInt((await params).formId);
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect('/login');
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar session={session} />
      <div className="w-full py-8 flex flex-col items-center">
        <FormEditor formId={formId} onSubmitSuccessRedirect="/forms" />
      </div>
    </div>
  );
}
