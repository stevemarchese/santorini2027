import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-session';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

interface ContentBody {
  letter: string;
  confirmationAttending: string;
  confirmationNotAttending: string;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ContentBody;
  try {
    body = (await request.json()) as ContentBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  const rows = [
    { key: 'letter', value: body.letter ?? '', updated_at: updatedAt },
    { key: 'confirmation_attending', value: body.confirmationAttending ?? '', updated_at: updatedAt },
    { key: 'confirmation_not_attending', value: body.confirmationNotAttending ?? '', updated_at: updatedAt },
  ];

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
