import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const answerSchema = z.object({
  questionId: z.number(),
  optionId: z.number().optional(),
  textAnswer: z.string().optional(),
  filePath: z.string().optional(),
});

const responseSchema = z.object({
  formId: z.number(),
  responseAnswers: z.array(answerSchema),
});

export async function GET(request: Request, { params }: { params: { formId: string } }) {
  const awaitedParams = await params;
  try {
    const session = await getServerSession(authOptions);
    //@ts-expect-error - user id is not defined
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = parseInt(awaitedParams.formId);
    if (isNaN(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        //@ts-expect-error - user id is not defined
        userId: parseInt(session.user.id),
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 });
    }

    const responses = await prisma.formResponse.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        responseAnswers: {
          include: {
            question: true,
            option: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { formId: string } }) {
  const awaitedParams = await params;
  try {
    const session = await getServerSession(authOptions);
    //@ts-expect-error - user id is not defined
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = parseInt(awaitedParams.formId);
    if (isNaN(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    // Check if form exists and is active
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        isActive: true,
      },
      include: {
        questions: {
          where: {
            displayOrder: {
              gt: 0,
            },
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = responseSchema.parse(body);

    // Validate required questions are answered
    const requiredQuestions = form.questions.filter(q => q.isRequired);
    const answeredQuestionIds = new Set(validatedData.responseAnswers.map(a => a.questionId));

    const missingRequired = requiredQuestions.find(q => !answeredQuestionIds.has(q.id));

    if (missingRequired) {
      return NextResponse.json(
        { error: `Required question "${missingRequired.questionText}" is not answered` },
        { status: 400 }
      );
    }

    // Validate that each answer has the correct type of response based on question type
    for (const answer of validatedData.responseAnswers) {
      const question = form.questions.find(q => q.id === answer.questionId);
      if (!question) {
        return NextResponse.json(
          { error: `Question with ID ${answer.questionId} not found` },
          { status: 400 }
        );
      }

      // Validate answer type matches question type
      switch (question.questionType) {
        case 'TEXT':
          if (!answer.textAnswer) {
            return NextResponse.json(
              { error: `Text answer required for question "${question.questionText}"` },
              { status: 400 }
            );
          }
          break;
        case 'DROPDOWN':
          if (!answer.optionId) {
            return NextResponse.json(
              { error: `Option selection required for question "${question.questionText}"` },
              { status: 400 }
            );
          }
          break;
        case 'FILE_UPLOAD':
          if (!answer.filePath) {
            return NextResponse.json(
              { error: `File upload required for question "${question.questionText}"` },
              { status: 400 }
            );
          }
          break;
      }
    }

    const response = await prisma.$transaction(async tx => {
      const formResponse = await tx.formResponse.create({
        data: {
          formId,
          //@ts-expect-error - user id is not defined
          userId: parseInt(session.user.id),
        },
      });

      const answers = await Promise.all(
        validatedData.responseAnswers.map(answer =>
          tx.responseAnswer.create({
            data: {
              responseId: formResponse.id,
              questionId: answer.questionId,
              optionId: answer.optionId,
              textAnswer: answer.textAnswer,
              filePath: answer.filePath,
            },
          })
        )
      );

      return {
        ...formResponse,
        responseAnswers: answers,
      };
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod error', error);
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Error creating response:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
