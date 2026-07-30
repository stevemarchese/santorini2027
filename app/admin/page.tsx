import { isAdminAuthed } from '@/lib/admin-session';
import { getAllResponses } from '@/lib/supabase-admin';
import AdminLoginForm from '@/components/AdminLoginForm';
import ResponsesTable from '@/components/ResponsesTable';

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    return <AdminLoginForm />;
  }

  const responses = await getAllResponses();
  return (
    <main className="h-dvh overflow-auto bg-navy p-8">
      <ResponsesTable responses={responses} />
    </main>
  );
}
