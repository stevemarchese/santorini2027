import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import { buildResponseRow, validateDraftForSubmit } from '@/lib/payload';
import { sendNotificationEmail } from '@/lib/email';
import { getResendClient } from '@/lib/resend-client';
import type { DraftResponse } from '@/lib/types';

export async function POST(request: Request) {
  let draft: DraftResponse;
  try {
    draft = (await request.json()) as DraftResponse;
  } catch {
    return NextResponse.json({ errors: ['Invalid request body'] }, { status: 400 });
  }

  const errors = validateDraftForSubmit(draft);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const row = buildResponseRow(draft);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from('responses').insert(row);
  if (error) {
    return NextResponse.json({ errors: [error.message] }, { status: 500 });
  }

  try {
    await sendNotificationEmail(getResendClient(), row);
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }

  return NextResponse.json({ ok: true });
}
