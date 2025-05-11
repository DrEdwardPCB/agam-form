import { FormsList } from '@/components/forms-list';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { Navbar } from '@/components/navbar';
import { redirect } from 'next/navigation';
export default async function FormsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect('/login');
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar session={session} />
      <div className="w-full py-8 flex flex-col items-center">
        <FormsList
          session={session}
          allowDelete={true}
          allowEdit={true}
          allowViewResponses={true}
        />
      </div>
    </div>
  );
}
