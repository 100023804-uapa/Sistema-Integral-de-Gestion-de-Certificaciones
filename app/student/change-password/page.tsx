"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function StudentChangePasswordPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No fue posible cambiar la contraseña');
      }

      try {
        await logout();
      } catch {
        // La sesión pudo quedar revocada por el cambio de contraseña.
      }

      router.replace('/login?passwordChanged=1');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No fue posible cambiar la contraseña'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-amber-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-amber-100 bg-amber-50 p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              <ShieldAlert className="h-4 w-4" />
              Cambio obligatorio de contraseña
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-primary">
              Actualiza tu acceso antes de continuar
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Esta cuenta fue activada o reiniciada con una contraseña temporal. Para
              entrar al portal debes definir una nueva contraseña personal.
            </p>
          </div>

          <div className="p-6 md:p-8">
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-bold text-gray-700"
                >
                  Nueva contraseña
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-bold text-gray-700"
                >
                  Confirmar contraseña
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                <div className="mb-2 flex items-center gap-2 font-bold text-gray-800">
                  <KeyRound className="h-4 w-4" />
                  Recomendaciones mínimas
                </div>
                <p>Usa al menos 8 caracteres, una mayúscula, una minúscula y un número.</p>
              </div>

              <Button
                type="submit"
                className="h-12 w-full text-base font-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando acceso...
                  </>
                ) : (
                  'Guardar nueva contraseña'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
