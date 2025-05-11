'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, FileText, Users } from 'lucide-react';

import { Form } from '@prisma/client';
import { Session } from 'next-auth';

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.json());
const Allfetcher = (url: string) =>
  fetch(url + '?all=true', { cache: 'no-store' }).then(res => res.json());

interface FormListProps {
  allowDelete?: boolean;
  allowEdit?: boolean;
  allowViewResponses?: boolean;
  session?: Session | null;
  all?: boolean;
}
interface FormWithCounts extends Form {
  _count: {
    questions: number;
    formResponses: number;
  };
}
export function FormsList({
  allowDelete,
  allowEdit,
  allowViewResponses,
  session,
  all,
}: FormListProps) {
  const {
    data: forms,
    error,
    isLoading,
    mutate,
  } = useSWR<FormWithCounts[]>('/api/forms', all ? Allfetcher : fetcher);

  const handleDelete = useCallback(
    async (formId: number) => {
      if (!confirm('Are you sure you want to delete this form?')) {
        return;
      }

      try {
        await fetch(`/api/forms/${formId}`, {
          method: 'DELETE',
        });

        // Optimistically update the UI
        mutate(
          forms?.filter(form => form.id !== formId),
          { revalidate: false }
        );
      } catch (error) {
        console.error('Error deleting form:', error);
        alert('Failed to delete form. Please try again.');
      }
    },
    [forms, mutate]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">Failed to load forms. Please try again.</div>;
  }

  if (!forms?.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No forms yet</h3>
        <p className="mt-2 text-sm text-gray-500">Get started by creating your first form.</p>
        <div className="mt-6">
          <Button asChild>
            {session ? (
              <Link href="/forms/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Form
              </Link>
            ) : (
              <Link href="/login">
                <Plus className="mr-2 h-4 w-4" />
                Create Form
              </Link>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">{all ? 'All Forms' : 'My Forms'}</h2>
        <Button asChild>
          {session ? (
            <Link href="/forms/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Link>
          ) : (
            <Link href="/login">
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Link>
          )}
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {forms.map(form => (
          <Card key={form.id}>
            <CardHeader>
              <CardTitle className="line-clamp-1">{form.title}</CardTitle>
              {form.description && (
                <CardDescription className="line-clamp-2">{form.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <FileText className="mr-1 h-4 w-4" />
                  {form._count.questions} questions
                </div>
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  {form._count.formResponses} responses
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {session && allowEdit && (
                <Button variant="outline" asChild>
                  <Link href={`/forms/${form.id}/edit`}>Edit</Link>
                </Button>
              )}
              {session && allowViewResponses && (
                <Button variant="outline" asChild>
                  <Link href={`/forms/${form.id}/response`}>View Responses</Link>
                </Button>
              )}
            </CardFooter>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                asChild
                disabled={!form.isActive}
                onClick={() => {
                  if (!form.isActive) {
                    alert('Form is not active');
                  }
                }}
              >
                {!form.isActive ? (
                  <p>Survey</p>
                ) : session ? (
                  <Link href={`/forms/${form.id}/response/fill`}>Survey</Link>
                ) : (
                  <Link href={`/login/`}>Survey</Link>
                )}
              </Button>

              {session && allowDelete && (
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(form.id)}
                >
                  Delete
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
