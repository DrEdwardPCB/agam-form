import { FormBuilder } from '@/components/form-builder';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { Navbar } from '@/components/navbar';
export default async function NewFormPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar session={session} />
      <div className="w-full py-8">
        <FormBuilder onSubmitSuccessRedirection="/" />
      </div>
    </div>
  );
}
