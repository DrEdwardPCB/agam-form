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

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = parseInt(params.formId);
    const responseId = parseInt(params.responseId);

    if (isNaN(formId) || isNaN(responseId)) {
      return NextResponse.json({ error: 'Invalid form ID or response ID' }, { status: 400 });
    }

    // Check if form exists and belongs to user
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        userId: parseInt(session.user.id),
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 });
    }

    const answers = await prisma.responseAnswer.findMany({
      where: {
        responseId,
        question: {
          formId,
        },
      },
      include: {
        question: true,
        option: true,
      },
      orderBy: {
        question: {
          displayOrder: 'asc',
        },
      },
    });

    return NextResponse.json(answers);
  } catch (error) {
    console.error('Error fetching answers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
