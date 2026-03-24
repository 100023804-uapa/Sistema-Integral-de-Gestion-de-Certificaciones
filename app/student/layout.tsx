import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { resolveSessionAccessFromSessionCookie } from '@/lib/server/studentPortal';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    redirect('/login?next=/student');
  }

  try {
    const access = await resolveSessionAccessFromSessionCookie(sessionCookie);

    if (access.internalAccess) {
      redirect('/dashboard');
    }

    if (!access.studentAccess) {
      redirect('/login');
    }
  } catch {
    redirect('/login?next=/student');
  }

  return children;
}
