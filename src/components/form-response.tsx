'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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

type QuestionType = 'TEXT' | 'DROPDOWN' | 'FILE_UPLOAD';

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
  questionId: string | number;
  response: string | File | null;
}

export default function FormResponsePage() {
  const params = useParams();
  const formId = params.formId as string;
  const [formData, setFormData] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${formId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch form');
        }
        const data = await response.json();
        setFormData(data);
        // Initialize responses array with empty values
        setResponses(
          data.questions
            .filter((q: Question) => q.displayOrder > 0)
            .map((q: Question) => ({
              questionId: q.id,
              response: null,
            }))
        );
      } catch (err) {
        setError('Failed to load form. Please try again later.');
        console.error('Error fetching form:', err);
      }
    };

    fetchForm();
  }, [formId]);

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

      const formDataToSubmit = new FormData();
      responses.forEach(response => {
        if (response.response instanceof File) {
          formDataToSubmit.append(`file_${response.questionId}`, response.response);
        } else {
          formDataToSubmit.append(`response_${response.questionId}`, response.response || '');
        }
      });

      const submitResponse = await fetch(`/api/forms/${formId}/responses`, {
        method: 'POST',
        body: formDataToSubmit,
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
    } catch (err) {
      setError('Failed to submit form. Please try again.');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!formData.isActive) {
    return <div className="text-center text-red-500">This form is no longer active.</div>;
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
