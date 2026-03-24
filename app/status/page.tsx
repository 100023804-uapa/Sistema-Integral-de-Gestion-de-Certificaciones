import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirección de consulta pública - SIGCE',
  description:
    'La consulta pública de certificados fue consolidada en la validación por folio o código.',
};

interface PageProps {
  searchParams: Promise<{ query?: string }>;
}

export default async function StatusPage({ searchParams }: PageProps) {
  const { query } = await searchParams;

  if (query?.trim()) {
    redirect(`/verify?query=${encodeURIComponent(query.trim())}`);
  }

  redirect('/verify');
}
