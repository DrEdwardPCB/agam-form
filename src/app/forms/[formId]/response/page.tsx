import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { Navbar } from '@/components/navbar';
import { redirect } from 'next/navigation';
import { ResponseList } from '@/components/response-list';
import { AggregateResponse } from '@/components/aggregate-response';
import { ResponseTable } from '@/components/response-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
export default async function FormResponsePage({ params }: { params: { formId: string } }) {
  const awaitedParams = await params;
  const formId = parseInt(awaitedParams.formId);
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect('/login');
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar session={session} />
      <div className="py-8 flex flex-col items-center justify-around w-full">
        <Tabs defaultValue="responses">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="aggregate">Aggregate</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
          <TabsContent value="aggregate">
            <AggregateResponse formId={formId} />
          </TabsContent>
          <TabsContent value="responses">
            <ResponseList formId={formId} />
          </TabsContent>
          <TabsContent value="table">
            <ResponseTable formId={formId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
