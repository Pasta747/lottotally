import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import AdminShell from './AdminShell';

const ADMIN_EMAIL = 'mario@yourvantage.ai';

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    redirect('/dashboard');
  }

  return (
    <AdminShell session={session}>
      {children}
    </AdminShell>
  );
}
