import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import { buildResponseRow, validateDraftForSubmit } from '@/lib/payload';
import { sendNotificationEmail } from '@/lib/email';
import { getResendClient } from '@/lib/resend-client';
import type { DraftResponse } from '@/lib/types';

export async function POST(request: Request) {
  const draft = (await request.json()) as DraftResponse;
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

  await sendNotificationEmail(getResendClient(), row);

  return NextResponse.json({ ok: true });
}
