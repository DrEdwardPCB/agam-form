import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { formId: string; responseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-expect-error - user id is a string

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = parseInt(params.formId);
    const responseId = parseInt(params.responseId);

    if (isNaN(formId) || isNaN(responseId)) {
      return NextResponse.json({ error: 'Invalid form ID or response ID' }, { status: 400 });
    }

    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        // @ts-expect-error - user id is a string
        userId: parseInt(session.user.id),
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 });
    }

    const response = await prisma.formResponse.findFirst({
      where: {
        id: responseId,
        formId,
      },
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
    });

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
