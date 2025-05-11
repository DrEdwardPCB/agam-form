'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, GripVertical, Trash2, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// not directly import from prisma some the type stated here are used for input
type QuestionType = 'TEXT' | 'DROPDOWN' | 'FILE_UPLOAD';

interface QuestionOption {
  id: string;
  optionText: string;
  displayOrder: number;
}

interface Question {
  id: string;
  questionType: QuestionType;
  questionText: string;
  isRequired: boolean;
  options: QuestionOption[];
  displayOrder: number;
}

interface FormData {
  title: string;
  description: string;
  isActive: boolean;
  questions: Question[];
}

const initialFormData: FormData = {
  title: '',
  description: '',
  isActive: true,
  questions: [],
};

export function FormBuilder({
  onSubmitSuccessRedirection,
}: {
  onSubmitSuccessRedirection?: string;
}) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = useCallback(() => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      questionType: 'TEXT',
      questionText: '',
      isRequired: false,
      options: [],
      displayOrder: formData.questions.length + 1,
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  }, [formData.questions.length]);

  const updateQuestion = useCallback((questionId: string, updates: Partial<Question>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => (q.id === questionId ? { ...q, ...updates } : q)),
    }));
  }, []);

  const deleteQuestion = useCallback((questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => (q.id === questionId ? { ...q, displayOrder: 0 } : q)),
    }));
  }, []);

  const addOption = useCallback(
    (questionId: string) => {
      const question = formData.questions.find(q => q.id === questionId);
      const newOption: QuestionOption = {
        id: crypto.randomUUID(),
        optionText: '',
        displayOrder: (question?.options.length || 0) + 1,
      };

      setFormData(prev => ({
        ...prev,
        questions: prev.questions.map(q =>
          q.id === questionId ? { ...q, options: [...q.options, newOption] } : q
        ),
      }));
    },
    [formData.questions]
  );

  const updateOption = useCallback((questionId: string, optionId: string, optionText: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map(opt => (opt.id === optionId ? { ...opt, optionText } : opt)),
            }
          : q
      ),
    }));
  }, []);

  const deleteOption = useCallback((questionId: string, optionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter(opt => opt.id !== optionId),
            }
          : q
      ),
    }));
  }, []);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const { source, destination, type } = result;

      if (type === 'question') {
        const items = Array.from(formData.questions);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        const updatedQuestions = items.map((item, index) => ({
          ...item,
          displayOrder: index + 1,
        }));

        setFormData(prev => ({
          ...prev,
          questions: updatedQuestions,
        }));
      } else if (type === 'option') {
        const questionId = source.droppableId;
        const question = formData.questions.find(q => q.id === questionId);

        if (!question) return;

        const items = Array.from(question.options);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        // Update displayOrder for all options
        const updatedOptions = items.map((item, index) => ({
          ...item,
          displayOrder: index + 1,
        }));

        setFormData(prev => ({
          ...prev,
          questions: prev.questions.map(q =>
            q.id === questionId ? { ...q, options: updatedOptions } : q
          ),
        }));
      }
    },
    [formData.questions]
  );

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      console.log(response);
      if (!response.ok) {
        throw new Error('Failed to create form');
      }

      setFormData(initialFormData);
      if (onSubmitSuccessRedirection) {
        router.push(onSubmitSuccessRedirection);
      }
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Failed to create form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Form Title</label>
            <Input
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter form title"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Form Description</label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter form description"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked: boolean | 'indeterminate') =>
                setFormData(prev => ({ ...prev, isActive: checked === true }))
              }
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Form is active
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="questions" type="question">
              {provided => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {formData.questions
                    .filter(q => q.displayOrder > 0)
                    .map((question, index) => (
                      <Draggable key={question.id} draggableId={question.id} index={index}>
                        {provided => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border rounded-lg p-4 space-y-4"
                          >
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="h-5 w-5 text-gray-400" />
                              </div>
                              <Input
                                value={question.questionText}
                                onChange={e =>
                                  updateQuestion(question.id, {
                                    questionText: e.target.value,
                                  })
                                }
                                placeholder="Question text"
                                className="flex-1"
                              />
                              <Select
                                value={question.questionType}
                                onValueChange={(value: QuestionType) =>
                                  updateQuestion(question.id, { questionType: value })
                                }
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TEXT">Text</SelectItem>
                                  <SelectItem value="DROPDOWN">Dropdown</SelectItem>
                                  <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`required-${question.id}`}
                                  checked={question.isRequired}
                                  onCheckedChange={(checked: boolean | 'indeterminate') =>
                                    updateQuestion(question.id, {
                                      isRequired: checked === true,
                                    })
                                  }
                                />
                                <label
                                  htmlFor={`required-${question.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Required
                                </label>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteQuestion(question.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>

                            {question.questionType === 'DROPDOWN' && (
                              <div className="space-y-2 pl-8">
                                <Droppable droppableId={question.id} type="option">
                                  {provided => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className="space-y-2"
                                    >
                                      {question.options
                                        .sort((a, b) => a.displayOrder - b.displayOrder)
                                        .map((option, index) => (
                                          <Draggable
                                            key={option.id}
                                            draggableId={option.id}
                                            index={index}
                                          >
                                            {provided => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="flex items-center gap-2"
                                              >
                                                <div
                                                  {...provided.dragHandleProps}
                                                  className="cursor-grab"
                                                >
                                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <Input
                                                  value={option.optionText}
                                                  onChange={e =>
                                                    updateOption(
                                                      question.id,
                                                      option.id,
                                                      e.target.value
                                                    )
                                                  }
                                                  placeholder="Option text"
                                                  className="flex-1"
                                                />
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    deleteOption(question.id, option.id)
                                                  }
                                                >
                                                  <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(question.id)}
                                  className="w-full"
                                >
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Add Option
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <Button onClick={addQuestion} className="mt-4" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Form'}
        </Button>
      </div>
    </div>
  );
}
