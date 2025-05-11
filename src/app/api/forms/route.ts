import { NextResponse } from 'next/server';
import { Form, PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import url from 'url';

const prisma = new PrismaClient();

const QuestionOptionSchema = z.object({
  id: z.string(),
  optionText: z.string().min(1).max(500),
  displayOrder: z.number().int().min(0),
});

const QuestionSchema = z.object({
  questionText: z.string().min(1).max(500),
  questionType: z.enum(['TEXT', 'DROPDOWN', 'FILE_UPLOAD']),
  isRequired: z.boolean().default(false),
  displayOrder: z.number().int().min(0),
  options: z.array(QuestionOptionSchema).optional(),
});

const formSchema = z.object({
  title: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  description: z.string().max(500).optional(),
  questions: z.array(QuestionSchema).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    let forms: Form[] = [];
    const queryParams = url.parse(request.url, true).query;
    const all = queryParams.all;
    console.log(all);
    //@ts-expect-error - id is not defined in user type
    if (!session?.user?.id || all) {
      forms =
        (await prisma.form.findMany({
          include: {
            _count: {
              select: {
                questions: {
                  where: {
                    displayOrder: {
                      gt: 0,
                    },
                  },
                },
                formResponses: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        })) ?? [];
    } else {
      forms =
        (await prisma.form.findMany({
          where: {
            //@ts-expect-error - id is not defined in user type
            userId: parseInt(session.user.id),
          },
          include: {
            _count: {
              select: {
                questions: {
                  where: {
                    displayOrder: {
                      gt: 0,
                    },
                  },
                },
                formResponses: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        })) ?? [];
    }

    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    //@ts-expect-error - id is not defined in user type
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    console.log(body);
    const validatedData = formSchema.parse(body);

    const form = await prisma.$transaction(async tx => {
      const form = await tx.form.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          isActive: validatedData.isActive,
          //@ts-expect-error - id is not defined in user type
          userId: parseInt(session.user.id),
        },
      });

      if (validatedData.questions) {
        for (const question of validatedData.questions) {
          const createdQuestion = await tx.question.create({
            data: {
              formId: form.id,
              questionText: question.questionText,
              questionType: question.questionType,
              isRequired: question.isRequired,
              displayOrder: question.displayOrder,
            },
          });

          if (question.options) {
            for (const option of question.options) {
              await tx.questionOption.create({
                data: {
                  questionId: createdQuestion.id,
                  optionText: option.optionText,
                  displayOrder: option.displayOrder,
                },
              });
            }
          }
        }
      }
      return form;
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.errors);
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Error creating form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
