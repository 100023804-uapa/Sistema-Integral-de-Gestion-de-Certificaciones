"use client";

import { useMemo, useState } from 'react';
import { Copy, ShieldCheck, Type } from 'lucide-react';
import { toast } from 'sonner';

import {
  extractDeclaredFontFamilies,
  extractRemoteFontSources,
  getUnsupportedOfficialTemplateFamilies,
  OFFICIAL_TEMPLATE_FONT_POLICY,
  SAFE_TEMPLATE_FONTS,
} from '@/lib/config/template-fonts';

interface OfficialTemplateTypographyPanelProps {
  htmlContent?: string;
  cssStyles?: string;
  linkedFontCount?: number;
  onInsertCssSnippet?: (snippet: string) => void;
}

export function OfficialTemplateTypographyPanel({
  htmlContent = '',
  cssStyles = '',
  linkedFontCount = 0,
  onInsertCssSnippet,
}: OfficialTemplateTypographyPanelProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const declaredFamilies = useMemo(
    () => extractDeclaredFontFamilies(htmlContent, cssStyles),
    [htmlContent, cssStyles]
  );
  const unsupportedFamilies = useMemo(
    () => getUnsupportedOfficialTemplateFamilies(htmlContent, cssStyles),
    [htmlContent, cssStyles]
  );
  const remoteSources = useMemo(
    () => extractRemoteFontSources(htmlContent, cssStyles),
    [htmlContent, cssStyles]
  );

  const copySnippet = async (value: string, token: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedToken(token);
      window.setTimeout(() => setCopiedToken(null), 1500);
      toast.success('Regla CSS copiada.');
    } catch (error) {
      console.error('Error copying CSS snippet:', error);
      toast.error('No se pudo copiar la regla CSS.');
    }
  };

  return (
    <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <ShieldCheck size={14} />
            Modo oficial
          </div>
          <h4 className="text-base font-semibold text-slate-900 md:text-lg">
            Tipografías admitidas para certificados oficiales
          </h4>
          <p className="max-w-3xl text-sm text-slate-600">
            {OFFICIAL_TEMPLATE_FONT_POLICY.description}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
          <div>
            <p className="text-lg font-black text-slate-900">{SAFE_TEMPLATE_FONTS.length}</p>
            <p>Fuentes seguras</p>
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{declaredFamilies.length}</p>
            <p>Declaradas</p>
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">
              {unsupportedFamilies.length + remoteSources.length + (linkedFontCount > 0 ? 1 : 0)}
            </p>
            <p>Alertas</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Recomendación operativa</p>
        <p className="mt-1">
          Para certificados oficiales usa <strong>Georgia</strong> o <strong>Times New Roman</strong> en itálica para el nombre del participante y{' '}
          <strong>Arial</strong> o <strong>Verdana</strong> para el cuerpo.
        </p>
      </div>

      {linkedFontCount > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Fuentes legacy vinculadas</p>
          <p className="mt-1">
            Esta plantilla aún conserva {linkedFontCount} fuente(s) vinculada(s) de la etapa anterior.
            Ya no se usan en el editor oficial y se limpiarán al guardar.
          </p>
        </div>
      ) : null}

      {remoteSources.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-medium">Fuentes remotas detectadas</p>
          <p className="mt-1">
            Elimina estas referencias del HTML/CSS antes de guardar: {remoteSources.join(', ')}.
          </p>
        </div>
      ) : null}

      {unsupportedFamilies.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-medium">Familias no permitidas en modo oficial</p>
          <p className="mt-1">
            Reemplaza estas familias por una fuente segura: {unsupportedFamilies.join(', ')}.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {SAFE_TEMPLATE_FONTS.map((font) => (
          <div
            key={font.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900">
                <Type size={16} />
                <p className="font-semibold">{font.label}</p>
              </div>
              <p className="text-sm text-slate-600">{font.notes}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">
                {font.stability === 'muy_estable' ? 'PDF estable' : 'Estable'}
              </p>
            </div>

            <code className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
              {font.cssSnippet}
            </code>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copySnippet(font.cssSnippet, `copy-${font.id}`)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Copy size={14} />
                {copiedToken === `copy-${font.id}` ? 'Copiada' : 'Copiar regla'}
              </button>
              <button
                type="button"
                onClick={() => onInsertCssSnippet?.(font.cssSnippet)}
                className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Insertar font-family
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
