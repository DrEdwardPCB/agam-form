'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Form, FormResponse, Question, QuestionOption, ResponseAnswer, User } from '@prisma/client';
import { v4 as uuidv4, v4 } from 'uuid';
import { authOptions } from '@/lib/auth';

interface ResponseAnswerData extends ResponseAnswer {
  question: Question;
  option?: QuestionOption;
}

interface FormResponseData extends FormResponse {
  user: User;
  responseAnswers: ResponseAnswerData[];
}

interface FormData extends Form {
  questions: Question[];
}

interface AggregateResponseProps {
  formId: number;
}

interface DropdownOptionCount {
  optionText: string;
  count: number;
  percentage: number;
}

interface QuestionResponseData extends Question {
  responses: {
    answer: string;
    user: string;
    submittedAt: string;
  }[];
  dropdownStats?: DropdownOptionCount[];
}

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff8042',
  '#0088fe',
  '#00c49f',
  '#ffbb28',
  '#ff8042',
];

export function AggregateResponse({ formId }: AggregateResponseProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [aggregatedData, setAggregatedData] = useState<QuestionResponseData[]>([]);
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

        const responsesResponse = await fetch(`/api/forms/${formId}/responses`);
        if (!responsesResponse.ok) {
          throw new Error('Failed to fetch responses');
        }
        const responsesData = await responsesResponse.json();

        const processedData = formData.questions.map((question: FormData['questions'][0]) => {
          const questionResponses = responsesData.flatMap((response: FormResponseData) => {
            const answer = response.responseAnswers.find(
              (a: ResponseAnswer) => a.questionId === question.id
            );
            if (!answer) return [];

            let answerText = '';
            if (question.questionType === 'DROPDOWN') {
              answerText = answer.option?.optionText || 'No option selected';
            } else if (question.questionType === 'FILE_UPLOAD') {
              answerText = answer.filePath ? answer.filePath : 'No file uploaded';
            } else {
              answerText = answer.textAnswer || 'No answer provided';
            }

            return {
              answer: answerText,
              user: response.user.username,
              submittedAt: response.submittedAt,
            };
          });

          // Calculate dropdown statistics if applicable
          let dropdownStats: DropdownOptionCount[] | undefined;
          if (question.questionType === 'DROPDOWN') {
            const optionCounts = new Map<string, number>();
            questionResponses.forEach((response: { answer: string }) => {
              const count = optionCounts.get(response.answer) || 0;
              optionCounts.set(response.answer, count + 1);
            });

            const total = Array.from(optionCounts.values()).reduce((a, b) => a + b, 0);
            dropdownStats = Array.from(optionCounts.entries()).map(([optionText, count]) => ({
              optionText,
              count,
              percentage: (count / total) * 100,
            }));
          }

          return {
            questionId: question.id,
            questionText: question.questionText,
            questionType: question.questionType,
            isRequired: question.isRequired,
            displayOrder: question.displayOrder,
            responses: questionResponses,
            dropdownStats,
          };
        });

        setAggregatedData(processedData);
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
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Form: {formData.title}</CardTitle>
          {formData.description && (
            <p className="text-sm text-gray-500">Description: {formData.description}</p>
          )}
        </CardHeader>
      </Card>

      {aggregatedData.map(question => (
        <Card key={v4()} className={question.displayOrder <= 0 ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="text-lg">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
              {question.displayOrder <= 0 && (
                <span className="text-gray-400 text-base ml-2 font-light">deleted question</span>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500">{question.questionType}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {question.questionType === 'DROPDOWN' && question.dropdownStats && (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={question.dropdownStats}
                      dataKey="count"
                      nameKey="optionText"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {question.dropdownStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-4">
              {question.responses.map(response => (
                <div key={v4()} className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{response.answer}</p>
                      <p className="text-sm text-gray-500">Submitted by {response.user}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(response.submittedAt), 'PPpp')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
