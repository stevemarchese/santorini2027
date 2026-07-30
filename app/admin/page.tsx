import { isAdminAuthed } from '@/lib/admin-session';
import { getAllResponses } from '@/lib/supabase-admin';
import { getSiteContent } from '@/lib/site-content';
import AdminLoginForm from '@/components/AdminLoginForm';
import ResponsesTable from '@/components/ResponsesTable';
import ContentEditor from '@/components/ContentEditor';

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    return <AdminLoginForm />;
  }

  const [responses, content] = await Promise.all([getAllResponses(), getSiteContent()]);
  return (
    <main className="h-dvh overflow-auto bg-navy p-8">
      <ContentEditor content={content} />
      <ResponsesTable responses={responses} />
    </main>
  );
}
