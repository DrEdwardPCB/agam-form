'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from './ui/button';
import Link from 'next/link';
import { Form, FormResponse, Question, QuestionOption, User, ResponseAnswer } from '@prisma/client';

interface ResponseAnswerData extends ResponseAnswer {
  question: Question;
  option?: QuestionOption;
}

interface FormResponseData extends FormResponse {
  user: User;
  responseAnswers: ResponseAnswerData[];
}

interface ResponseListProps {
  formId: number;
}

export function ResponseList({ formId }: ResponseListProps) {
  const [responses, setResponses] = useState<FormResponseData[]>([]);
  const [formData, setFormData] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch form data
        const formResponse = await fetch(`/api/forms/${formId}`);
        if (!formResponse.ok) {
          throw new Error('Failed to fetch form data');
        }
        const formData = await formResponse.json();
        setFormData(formData);

        // Fetch responses
        const responsesResponse = await fetch(`/api/forms/${formId}/responses`);
        if (!responsesResponse.ok) {
          throw new Error('Failed to fetch responses');
        }
        const responsesData = await responsesResponse.json();
        setResponses(responsesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [formId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!formData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-gray-500">Form not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:max-w-3xl max-w-xs">
      <CardHeader>
        <CardTitle>{formData.title}</CardTitle>
        {formData.description && <p className="text-sm text-gray-500">{formData.description}</p>}
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No responses yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted By</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map(response => (
                <TableRow key={response.id}>
                  <TableCell>{response.user.username}</TableCell>
                  <TableCell>{response.user.email}</TableCell>
                  <TableCell>{format(new Date(response.submittedAt), 'PPpp')}</TableCell>
                  <TableCell>
                    <Button variant="outline">
                      <Link href={`/forms/${formId}/response/${response.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
