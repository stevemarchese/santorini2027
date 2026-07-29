import { cookies } from 'next/headers';
import { hashAdminPassword } from '@/lib/admin-auth';
import { getAllResponses } from '@/lib/supabase-admin';
import AdminLoginForm from '@/components/AdminLoginForm';
import ResponsesTable from '@/components/ResponsesTable';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;
  const expected = process.env.ADMIN_PASSWORD ? hashAdminPassword(process.env.ADMIN_PASSWORD) : null;
  const isAuthed = Boolean(expected) && session === expected;

  if (!isAuthed) {
    return <AdminLoginForm />;
  }

  const responses = await getAllResponses();
  return (
    <main className="h-dvh overflow-auto bg-navy p-8">
      <ResponsesTable responses={responses} />
    </main>
  );
}
