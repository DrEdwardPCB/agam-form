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
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Printer, Copy } from 'lucide-react';
import { Form, FormResponse, Question, QuestionOption, ResponseAnswer, User } from '@prisma/client';

interface ResponseAnswerData extends ResponseAnswer {
  question: Question;
  option?: QuestionOption;
}

interface FormResponseData extends FormResponse {
  responseAnswers: ResponseAnswerData[];
  user: User;
}

interface FormData extends Form {
  questions: Question[];
}

interface ResponseTableProps {
  formId: number;
}

export function ResponseTable({ formId }: ResponseTableProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<FormResponseData[]>([]);
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const table = document.getElementById('response-table');
    if (!table) return;

    const printContent = `
      <html>
        <head>
          <title>${formData?.title || 'Form Responses'}</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            @media print {
              body { margin: 0; padding: 15px; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>${formData?.title || 'Form Responses'}</h1>
          ${table.outerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCopyCSV = () => {
    if (!formData || !responses.length) return;

    // Create headers
    const headers = [
      'Submission Date',
      'Submitted By',
      'Email',
      ...formData.questions.map(q => q.questionText),
    ];

    // Create rows
    const rows = responses.map(response => {
      const answers = formData.questions.map(question => {
        const answer = response.responseAnswers.find(a => a.questionId === question.id);
        if (!answer) return '';

        if (question.questionType === 'DROPDOWN') {
          return answer.option?.optionText || '';
        } else if (question.questionType === 'FILE_UPLOAD') {
          return answer.filePath ? 'File uploaded' : '';
        } else {
          return answer.textAnswer || '';
        }
      });

      return [
        format(new Date(response.submittedAt), 'yyyy-MM-dd HH:mm:ss'),
        response.user.username,
        response.user.email,
        ...answers,
      ];
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    // Copy to clipboard
    navigator.clipboard.writeText(csvContent);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 border rounded-lg">{error}</div>;
  }

  if (!formData) {
    return <div className="text-gray-500 p-4 border rounded-lg">Form not found</div>;
  }

  return (
    <div className="space-y-4 md:max-w-4xl max-w-xs">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{formData.title}</h2>
        <div className="space-x-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCSV}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy as CSV
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table id="response-table">
          <TableHeader>
            <TableRow>
              <TableHead>Submission Date</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Email</TableHead>
              {formData.questions.map(question => (
                <TableHead key={question.id}>
                  {question.questionText}
                  {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.map(response => (
              <TableRow key={response.id}>
                <TableCell>{format(new Date(response.submittedAt), 'PPpp')}</TableCell>
                <TableCell>{response.user.username}</TableCell>
                <TableCell>{response.user.email}</TableCell>
                {formData.questions.map(question => {
                  const answer = response.responseAnswers.find(a => a.questionId === question.id);
                  let answerText = '';

                  if (answer) {
                    if (question.questionType === 'DROPDOWN') {
                      answerText = answer.option?.optionText || 'No option selected';
                    } else if (question.questionType === 'FILE_UPLOAD') {
                      answerText = answer.filePath ? answer.filePath : 'No file uploaded';
                    } else {
                      answerText = answer.textAnswer || 'No answer provided';
                    }
                  }

                  return <TableCell key={question.id}>{answerText}</TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
