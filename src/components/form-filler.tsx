'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import useSWR from 'swr';
import { QuestionType } from '@prisma/client';
import { useRouter } from 'next/navigation';

//separate interface without directly import from prisma as id type are different
interface QuestionOption {
  id: string | number;
  optionText: string;
  displayOrder: number;
}

interface Question {
  id: string | number;
  questionType: QuestionType;
  questionText: string;
  isRequired: boolean;
  questionOptions: QuestionOption[];
  displayOrder: number;
}

interface FormData {
  id: number;
  title: string;
  description: string;
  isActive: boolean;
  questions: Question[];
}

interface FormResponse {
  id: number;
  formId: number;
  userId: number;
  submittedAt: Date;
  responseAnswers: ResponseAnswer[];
}

interface ResponseAnswer {
  questionId: number;
  optionId?: number;
  textAnswer?: string;
  filePath?: string;
}

interface FormResponseInput {
  questionId: string | number;
  response: string | File | null;
}

export interface FormFillerProps {
  formId: number;
  onSubmitSuccessRedirect?: string;
}
const fetcher = async (url: string) => {
  const res = await fetch(url);
  return res.json();
};
export default function FormFiller({ formId, onSubmitSuccessRedirect }: FormFillerProps) {
  const [responses, setResponses] = useState<FormResponseInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const {
    data: formData,
    error: swrError,
    isLoading,
  } = useSWR<FormData>(`/api/forms/${formId}`, fetcher, {
    revalidateOnFocus: false,
    onError: err => {
      console.error('Error fetching form:', err);
      setError(err.message || 'Failed to load form. Please try again later.');
    },
  });

  useEffect(() => {
    if (formData) {
      setResponses(
        formData.questions
          .filter((q: Question) => q.displayOrder > 0)
          .map((q: Question) => ({
            questionId: q.id,
            response: null,
          }))
      );
    }
  }, [formData]);

  const handleResponseChange = (questionId: string | number, value: string | File | null) => {
    setResponses(prev =>
      prev.map(r => (r.questionId === questionId ? { ...r, response: value } : r))
    );
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate required fields
      const missingRequired = formData?.questions
        .filter(q => q.isRequired && q.displayOrder > 0)
        .some(
          q =>
            !responses.find(r => r.questionId === q.id && r.response !== null && r.response !== '')
        );

      if (missingRequired) {
        setError('Please fill in all required fields');
        return;
      }

      // First, handle any file uploads
      const fileUploadPromises = responses
        .filter(r => r.response instanceof File)
        .map(async response => {
          const formData = new FormData();
          formData.append('file', response.response as File);

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload file');
          }

          const { filePath } = await uploadResponse.json();
          return {
            questionId: response.questionId,
            filePath,
          };
        });

      const fileUploadResults = await Promise.all(fileUploadPromises);

      // Prepare the response data according to the schema
      const responseData = {
        formId: formId,
        responseAnswers: responses
          .map(response => {
            const question = formData?.questions.find(q => q.id === response.questionId);
            if (!question) return null;

            // Base response object with questionId
            const baseResponse = {
              questionId: Number(response.questionId),
            };

            // Handle different question types
            switch (question.questionType) {
              case 'FILE_UPLOAD':
                if (response.response instanceof File) {
                  const fileResult = fileUploadResults.find(
                    r => r.questionId === response.questionId
                  );
                  return {
                    ...baseResponse,
                    filePath: fileResult?.filePath,
                  };
                }
                return null;

              case 'DROPDOWN':
                if (typeof response.response === 'string') {
                  const option = question.questionOptions.find(
                    opt => opt.optionText === response.response
                  );
                  return {
                    ...baseResponse,
                    optionId: option ? Number(option.id) : undefined,
                  };
                }
                return null;

              case 'TEXT':
                if (typeof response.response === 'string') {
                  return {
                    ...baseResponse,
                    textAnswer: response.response,
                  };
                }
                return null;

              default:
                return null;
            }
          })
          .filter(Boolean), // Remove any null responses
      };
      const submitResponse = await fetch(`/api/forms/${formId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit response');
      }

      // Clear form after successful submission
      setResponses(
        formData?.questions
          .filter(q => q.displayOrder > 0)
          .map(q => ({
            questionId: q.id,
            response: null,
          })) || []
      );
      alert('Form submitted successfully!');
      if (onSubmitSuccessRedirect) {
        router.push(onSubmitSuccessRedirect);
      }
    } catch (err) {
      setError('Failed to submit form. Please try again.');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (swrError) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-4">
              {error || 'Failed to load form. Please try again later.'}
            </div>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-gray-500">No form data available</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData.isActive) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-red-500">This form is no longer active.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>{formData.title}</CardTitle>
          {formData.description && <p className="text-sm text-gray-500">{formData.description}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.questions
            .filter(q => q.displayOrder > 0)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(question => (
              <div key={question.id} className="space-y-2">
                <Label>
                  {question.questionText}
                  {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {question.questionType === 'TEXT' && (
                  <Textarea
                    value={
                      (responses.find(r => r.questionId === question.id)?.response as string) || ''
                    }
                    onChange={e => handleResponseChange(question.id, e.target.value)}
                    placeholder="Enter your response"
                    required={question.isRequired}
                  />
                )}

                {question.questionType === 'DROPDOWN' && (
                  <Select
                    value={
                      (responses.find(r => r.questionId === question.id)?.response as string) || ''
                    }
                    onValueChange={value => handleResponseChange(question.id, value)}
                    required={question.isRequired}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.questionOptions
                        .filter(o => o.displayOrder > 0)
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map(option => (
                          <SelectItem key={option.id} value={option.optionText}>
                            {option.optionText}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}

                {question.questionType === 'FILE_UPLOAD' && (
                  <Input
                    type="file"
                    onChange={e =>
                      handleResponseChange(question.id, e.target.files ? e.target.files[0] : null)
                    }
                    required={question.isRequired}
                  />
                )}
              </div>
            ))}

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Response'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
