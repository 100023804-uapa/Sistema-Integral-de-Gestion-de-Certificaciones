"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, QrCode, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getCertificateRepository } from '@/lib/container';
import { Certificate } from '@/lib/domain/entities/Certificate';

type ValidationStatus = 'idle' | 'valid' | 'invalid' | 'error';

export default function ValidatePage() {
  const router = useRouter();
  const certificateRepo = getCertificateRepository();
  const [folio, setFolio] = useState('');
  const [status, setStatus] = useState<ValidationStatus>('idle');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [message, setMessage] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const query = folio.trim();
    if (!query) {
      setStatus('invalid');
      setMessage('Ingresa un folio o identificador para validar.');
      setCertificate(null);
      return;
    }

    setLoading(true);
    setMessage('');
    setCertificate(null);

    try {
      let result = await certificateRepo.findByFolio(query);

      if (!result) {
        result = await certificateRepo.findByFolio(query.toUpperCase());
      }

      if (!result) {
        result = await certificateRepo.findById(query);
      }

      if (!result) {
        setStatus('invalid');
        setMessage(`No encontramos coincidencias para "${query}".`);
        return;
      }

      setCertificate(result);

      if (result.status === 'active') {
        setStatus('valid');
        setMessage('Certificado valido y vigente.');
      } else {
        setStatus('invalid');
        setMessage(`Certificado encontrado, pero su estado actual es "${result.status}".`);
      }
    } catch (error) {
      console.error('Error validating certificate:', error);
      setStatus('error');
      setMessage('No fue posible validar el folio en este momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 md:px-8 md:py-12 space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-3xl font-black text-primary tracking-tighter">Validar Folio</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Ingrese Folio o UUID</label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder="Ej. SIGCE-2026-CAP-0001"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <QrCode size={20} />}
            {loading ? 'Validando...' : 'Verificar Ahora'}
          </button>
        </form>

        {status === 'valid' && certificate && (
          <div className="mt-8 p-6 bg-green-50 rounded-2xl border border-green-100 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4">
            <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-bold text-green-800 text-lg">Certificado Valido</h3>
              <p className="text-green-700">{message}</p>
              <p className="text-sm text-green-800"><strong>Folio:</strong> {certificate.folio}</p>
              <p className="text-sm text-green-800"><strong>Estudiante:</strong> {certificate.studentName}</p>
              <p className="text-sm text-green-800"><strong>Programa:</strong> {certificate.academicProgram}</p>
              <Link href={`/verify/${certificate.id}`} className="inline-block text-sm font-bold text-primary underline">
                Ver detalle publico
              </Link>
            </div>
          </div>
        )}

        {(status === 'invalid' || status === 'error') && (
          <div className="mt-8 p-6 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4">
            <XCircle className="w-8 h-8 text-red-600 shrink-0" />
            <div>
              <h3 className="font-bold text-red-800 text-lg">
                {status === 'error' ? 'Error de Validacion' : 'Certificado No Encontrado'}
              </h3>
              <p className="text-red-700">{message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
