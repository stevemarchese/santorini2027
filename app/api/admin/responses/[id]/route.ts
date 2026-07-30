import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-session';
import { deleteResponse } from '@/lib/supabase-admin';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await deleteResponse(id);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
