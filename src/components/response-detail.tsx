'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Form, FormResponse, Question, QuestionOption, ResponseAnswer, User } from '@prisma/client';

interface ResponseAnswerData extends ResponseAnswer {
  question: Question;
  option?: QuestionOption;
}

interface FormResponseData extends FormResponse {
  user: User;
  responseAnswers: ResponseAnswerData[];
}

interface ResponseDetailProps {
  formId: number;
  responseId: number;
}

export function ResponseDetail({ formId, responseId }: ResponseDetailProps) {
  const router = useRouter();
  const [response, setResponse] = useState<FormResponseData | null>(null);
  const [formData, setFormData] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const formResponse = await fetch(`/api/forms/${formId}`);
        if (!formResponse.ok) {
          throw new Error('Failed to fetch form data');
        }
        const formData = await formResponse.json();
        setFormData(formData);

        const responseResponse = await fetch(`/api/forms/${formId}/responses/${responseId}`);
        if (!responseResponse.ok) {
          throw new Error('Failed to fetch response');
        }
        const responseData = await responseResponse.json();
        setResponse(responseData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [formId, responseId]);

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

  if (!formData || !response) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-gray-500">Response not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 md:max-w-3xl max-w-xs">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Responses
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{formData.title}</CardTitle>
          {formData.description && <p className="text-sm text-gray-500">{formData.description}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-500">Submitted By</p>
              <p className="mt-1">{response.user.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1 break-all">{response.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Submitted At</p>
              <p className="mt-1">{format(new Date(response.submittedAt), 'PPpp')}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium">Responses</h3>
            {response.responseAnswers.map(answer => (
              <div key={answer.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {answer.question.questionText}
                      {answer.question.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <p className="text-sm text-gray-500">{answer.question.questionType}</p>
                  </div>
                </div>
                <div className="mt-2">
                  {answer.question.questionType === 'DROPDOWN' ? (
                    <p className="text-gray-700">
                      {answer.option?.optionText || 'No option selected'}
                    </p>
                  ) : answer.question.questionType === 'FILE_UPLOAD' ? (
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-700">File uploaded</p>
                      {answer.filePath && (
                        <a
                          href={`/api/upload?fileName=${answer.filePath.split('/').pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View File
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {answer.textAnswer || 'No answer provided'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
