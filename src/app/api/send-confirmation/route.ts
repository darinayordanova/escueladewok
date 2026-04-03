import { NextResponse } from 'next/server';

import { sendConfirmationEmail } from '@/lib/email';
import type { ConfirmationEmailData } from '@/types';

export async function POST(request: Request) {
  try {
    const body: ConfirmationEmailData = await request.json();

    const { to, recipientName, courseName, courseDate, amount, currency } = body;

    if (!to || !recipientName || !courseName || !courseDate || !amount || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sendConfirmationEmail({ to, recipientName, courseName, courseDate, amount, currency });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 500 });
  }
}
