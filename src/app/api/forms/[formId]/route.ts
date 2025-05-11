import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const questionOptionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  optionText: z.string(),
  displayOrder: z.number(),
});

const questionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  questionType: z.enum(['TEXT', 'DROPDOWN', 'FILE_UPLOAD']),
  questionText: z.string(),
  isRequired: z.boolean(),
  questionOptions: z.array(questionOptionSchema),
  displayOrder: z.number(),
});

const formSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  questions: z.array(questionSchema),
});

export async function GET(request: Request, { params }: { params: { formId: string } }) {
  try {
    const formId = parseInt((await params).formId);
    if (isNaN(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: {
          include: {
            questionOptions: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        _count: {
          select: {
            formResponses: true,
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { formId: string } }) {
  const awaitedParams = await params;
  try {
    const session = await getServerSession(authOptions);
    //@ts-expect-error - id is not defined in user type
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = parseInt(awaitedParams.formId);
    if (isNaN(formId)) {
      console.error('Invalid form ID', awaitedParams.formId);
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    const existingForm = await prisma.form.findFirst({
      where: {
        id: formId,
        //@ts-expect-error - id is not defined in user type
        userId: parseInt(session.user.id),
      },
    });

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = formSchema.parse(body);

    // Start a transaction to handle all updates
    const updatedForm = await prisma.$transaction(async tx => {
      await tx.form.update({
        where: { id: formId },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          isActive: validatedData.isActive,
        },
      });

      const existingForm = await tx.form.findFirst({
        where: { id: formId },
        include: {
          questions: {
            include: {
              questionOptions: true,
            },
          },
        },
      });
      // Get existing questions and options from existing form that must exist
      const existingQuestions = existingForm!.questions;
      const existingOptions = existingQuestions.flatMap(q => q.questionOptions);

      // Handle questions
      for (const question of validatedData.questions) {
        if (typeof question.id === 'string') {
          // New question
          await tx.question.create({
            data: {
              formId,
              questionType: question.questionType,
              questionText: question.questionText,
              isRequired: question.isRequired,
              displayOrder: question.displayOrder,
              questionOptions: {
                create: question.questionOptions.map(opt => ({
                  optionText: opt.optionText,
                  displayOrder: opt.displayOrder,
                })),
              },
            },
          });
        } else {
          // Existing question
          const existingQuestion = existingQuestions.find(q => q.id === question.id);
          if (existingQuestion) {
            //remove the existing question from the array
            existingQuestions.splice(existingQuestions.indexOf(existingQuestion), 1);
            await tx.question.update({
              where: { id: question.id },
              data: {
                questionType: question.questionType,
                questionText: question.questionText,
                isRequired: question.isRequired,
                displayOrder: question.displayOrder,
              },
            });

            // Handle options for existing question
            for (const option of question.questionOptions) {
              if (typeof option.id === 'string') {
                // New option
                await tx.questionOption.create({
                  data: {
                    questionId: question.id,
                    optionText: option.optionText,
                    displayOrder: option.displayOrder,
                  },
                });
              } else {
                // Existing option
                const existingOption = existingOptions.find(o => o.id === option.id);
                if (existingOption) {
                  //remove the existing option from the array
                  existingOptions.splice(existingOptions.indexOf(existingOption), 1);
                }
                await tx.questionOption.update({
                  where: { id: option.id },
                  data: {
                    optionText: option.optionText,
                    displayOrder: option.displayOrder,
                  },
                });
              }
            }
          }
        }
      }

      // Mark deleted questions
      await tx.question.updateMany({
        where: {
          formId,
          id: {
            in: existingQuestions.map(q => q.id),
          },
        },
        data: {
          displayOrder: -1,
        },
      });

      // Mark deleted options
      await tx.questionOption.updateMany({
        where: {
          id: {
            in: existingOptions.map(o => o.id),
          },
        },
        data: {
          displayOrder: -1,
        },
      });
      const updatedForm = await tx.form.findFirst({
        where: { id: formId },
        include: {
          questions: {
            include: {
              questionOptions: true,
            },
          },
        },
      });
      return updatedForm;
    });

    return NextResponse.json(updatedForm);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod error', error);
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { formId: string } }) {
  const awaitedParams = await params;
  try {
    const session = await getServerSession(authOptions);

    //@ts-expect-error - id is not defined in user type
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = parseInt(awaitedParams.formId);
    if (isNaN(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    // Check if form exists and belongs to user
    const existingForm = await prisma.form.findFirst({
      where: {
        id: formId,
        //@ts-expect-error - id is not defined in user type
        userId: parseInt(session.user.id),
      },
    });

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 });
    }

    await prisma.form.delete({
      where: { id: formId },
    });

    return NextResponse.json({ message: 'Form deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
