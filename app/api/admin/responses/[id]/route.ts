import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-session';
import { deleteResponse, updateResponseName } from '@/lib/supabase-admin';

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const { id } = await params;
  const { error } = await updateResponseName(id, name);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
