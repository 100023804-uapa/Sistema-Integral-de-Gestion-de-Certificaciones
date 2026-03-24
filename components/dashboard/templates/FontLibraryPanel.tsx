"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Library,
  Link2,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  analyzeTemplateFontRisks,
  buildManagedTemplateFontFaceCss,
  buildTemplateFontProfile,
  buildTemplateFontFamilySnippet,
  buildTemplateFontRuleSnippet,
  createTemplateFontRefFromAsset,
  inferFontAssetMetadata,
  inferTemplateFontFallback,
  isSupportedFontFormat,
  SAFE_TEMPLATE_FONTS,
} from '@/lib/config/template-fonts';
import { db } from '@/lib/firebase';
import { UploadButton } from '@/lib/uploadthing';
import { FontAsset, FontAssetStyle } from '@/lib/types/fontAsset';
import { TemplateFontRef } from '@/lib/types/certificateTemplate';
import { cn } from '@/lib/utils';

interface FontLibraryPanelProps {
  value: TemplateFontRef[];
  onChange: (value: TemplateFontRef[]) => void;
  onInsertCssSnippet?: (snippet: string) => void;
  htmlContent?: string;
  cssStyles?: string;
}

interface ImportedFontPayload {
  name: string;
  family: string;
  url: string;
  key?: string;
  format: FontAsset['format'];
  weight: string;
  style: FontAssetStyle;
  sourceType: FontAsset['sourceType'];
}

function matchesFontRef(fontAsset: FontAsset, fontRef: TemplateFontRef): boolean {
  if (fontRef.assetId && fontAsset.id) {
    return fontRef.assetId === fontAsset.id;
  }

  return fontRef.family === fontAsset.family && fontRef.url === fontAsset.url;
}

function buildSourceBadge(sourceType: FontAsset['sourceType']) {
  if (sourceType === 'external') {
    return {
      label: 'Importada URL',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Interna',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
}

function buildProfileStatusBadge(status: ReturnType<typeof buildTemplateFontProfile>['status']) {
  switch (status) {
    case 'managed':
      return {
        label: 'Gestionada',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      };
    case 'safe':
      return {
        label: 'Fuentes seguras',
        className: 'border-sky-200 bg-sky-50 text-sky-700',
      };
    case 'mixed':
      return {
        label: 'Mixta',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
      };
    case 'external':
      return {
        label: 'Externa',
        className: 'border-rose-200 bg-rose-50 text-rose-700',
      };
    case 'unmanaged':
      return {
        label: 'No gestionada',
        className: 'border-orange-200 bg-orange-50 text-orange-700',
      };
    default:
      return {
        label: 'Sin declarar',
        className: 'border-slate-200 bg-slate-100 text-slate-700',
      };
  }
}

export function FontLibraryPanel({
  value,
  onChange,
  onInsertCssSnippet,
  htmlContent = '',
  cssStyles = '',
}: FontLibraryPanelProps) {
  const [fontAssets, setFontAssets] = useState<FontAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [remoteName, setRemoteName] = useState('');
  const [remoteFamily, setRemoteFamily] = useState('');
  const [remoteWeight, setRemoteWeight] = useState('400');
  const [remoteStyle, setRemoteStyle] = useState<FontAssetStyle>('normal');
  const [importingFromUrl, setImportingFromUrl] = useState(false);

  const managedFontCss = useMemo(
    () => buildManagedTemplateFontFaceCss(fontAssets.map(createTemplateFontRefFromAsset)),
    [fontAssets]
  );

  const selectedFonts = useMemo(
    () => fontAssets.filter((fontAsset) => value.some((fontRef) => matchesFontRef(fontAsset, fontRef))),
    [fontAssets, value]
  );

  const fontRisks = useMemo(
    () => analyzeTemplateFontRisks(htmlContent, cssStyles),
    [htmlContent, cssStyles]
  );

  const fontProfile = useMemo(
    () => buildTemplateFontProfile(htmlContent, cssStyles, value),
    [cssStyles, htmlContent, value]
  );

  const profileBadge = useMemo(
    () => buildProfileStatusBadge(fontProfile.status),
    [fontProfile.status]
  );

  const fetchFonts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'font_assets'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const nextFonts = querySnapshot.docs.map((fontDoc) => {
        const data = fontDoc.data();
        return {
          id: fontDoc.id,
          name: data.name || '',
          family: data.family || '',
          url: data.url || '',
          key: data.key,
          format: data.format || 'unknown',
          weight: data.weight || '400',
          style: data.style || 'normal',
          sourceType: data.sourceType || 'upload',
          isActive: data.isActive ?? true,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
        } satisfies FontAsset;
      });
      setFontAssets(nextFonts);
    } catch (error) {
      console.error('Error fetching font assets:', error);
      toast.error('No se pudo cargar la biblioteca de fuentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFonts();
  }, []);

  const copyToClipboard = async (text: string, token: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(token);
      window.setTimeout(() => setCopiedToken(null), 1800);
      toast.success(successMessage);
    } catch (error) {
      console.error('Error copying text:', error);
      toast.error('No se pudo copiar al portapapeles.');
    }
  };

  const registerFontAsset = async (payload: ImportedFontPayload) => {
    await addDoc(collection(db, 'font_assets'), {
      name: payload.name,
      family: payload.family,
      url: payload.url,
      key: payload.key || '',
      format: payload.format,
      weight: payload.weight,
      style: payload.style,
      sourceType: payload.sourceType,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const handleUploadComplete = async (
    result: Array<{ name?: string; url?: string; key?: string }>
  ) => {
    try {
      let importedCount = 0;

      for (const file of result) {
        if (!file.name || !file.url) continue;

        const metadata = inferFontAssetMetadata(file.name);
        if (!isSupportedFontFormat(metadata.format)) {
          toast.error(`"${file.name}" no es un formato de fuente soportado.`);
          continue;
        }

        await registerFontAsset({
          name: file.name,
          family: metadata.family,
          url: file.url,
          key: file.key || '',
          format: metadata.format,
          weight: metadata.weight,
          style: metadata.style,
          sourceType: 'upload',
        });
        importedCount += 1;
      }

      if (importedCount > 0) {
        toast.success(
          importedCount === 1
            ? 'Fuente importada a la biblioteca.'
            : 'Fuentes importadas a la biblioteca.'
        );
        await fetchFonts();
      }
    } catch (error) {
      console.error('Error registering uploaded font:', error);
      toast.error('La fuente se subio, pero no se pudo registrar en la biblioteca.');
    }
  };

  const handleImportFromUrl = async () => {
    const cleanedUrl = remoteUrl.trim();

    if (!cleanedUrl) {
      toast.error('Debes indicar una URL directa a la fuente.');
      return;
    }

    setImportingFromUrl(true);
    try {
      const response = await fetch('/api/admin/font-assets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cleanedUrl,
          name: remoteName.trim() || undefined,
          family: remoteFamily.trim() || undefined,
          weight: remoteWeight.trim() || undefined,
          style: remoteStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo importar la fuente desde URL.');
      }

      await registerFontAsset(data.data);
      await fetchFonts();

      setRemoteUrl('');
      setRemoteName('');
      setRemoteFamily('');
      setRemoteWeight('400');
      setRemoteStyle('normal');
      toast.success('Fuente importada desde URL y guardada en la biblioteca.');
    } catch (error) {
      console.error('Error importing font from URL:', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo importar la fuente.');
    } finally {
      setImportingFromUrl(false);
    }
  };

  const addFontToTemplate = (fontAsset: FontAsset) => {
    const nextValue = [
      ...value.filter((fontRef) => !matchesFontRef(fontAsset, fontRef)),
      createTemplateFontRefFromAsset(fontAsset),
    ];
    onChange(nextValue);
    toast.success(`"${fontAsset.family}" quedo vinculada a la plantilla.`);
  };

  const removeFontFromTemplate = (fontAsset: FontAsset) => {
    onChange(value.filter((fontRef) => !matchesFontRef(fontAsset, fontRef)));
    toast.success(`"${fontAsset.family}" se quito de la plantilla.`);
  };

  const deleteFontAsset = async (fontAsset: FontAsset) => {
    const confirmed = window.confirm(
      `¿Eliminar "${fontAsset.family}" de la biblioteca? Si una plantilla la usa, perdera esa referencia local.`
    );

    if (!confirmed) return;

    try {
      if (fontAsset.key) {
        const deleteResponse = await fetch('/api/admin/font-assets/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: fontAsset.key }),
        });

        if (!deleteResponse.ok) {
          const deleteData = await deleteResponse.json().catch(() => null);
          throw new Error(deleteData?.error || 'No se pudo eliminar el archivo remoto.');
        }
      }

      await deleteDoc(doc(db, 'font_assets', fontAsset.id));
      onChange(value.filter((fontRef) => !matchesFontRef(fontAsset, fontRef)));
      setFontAssets((current) => current.filter((item) => item.id !== fontAsset.id));
      toast.success('Fuente eliminada de la biblioteca.');
    } catch (error) {
      console.error('Error deleting font asset:', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la fuente.');
    }
  };

  return (
    <div className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      {managedFontCss ? <style>{managedFontCss}</style> : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Library size={14} />
            Fase 2
          </div>
          <div className="flex items-center gap-2 text-slate-900">
            <h4 className="text-base font-semibold md:text-lg">Fuentes para esta plantilla</h4>
          </div>
          <p className="max-w-3xl text-sm text-slate-600">
            Usa este panel para evitar dependencias tipograficas fragiles. Puedes trabajar con
            fuentes seguras del navegador, subir archivos locales o importar una fuente desde una
            URL directa a un archivo <code className="rounded bg-slate-100 px-1 py-0.5">.woff2</code>,{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5">.woff</code>,{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5">.ttf</code> u{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5">.otf</code>.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
          <div>
            <p className="text-lg font-black text-slate-900">{selectedFonts.length}</p>
            <p>Vinculadas</p>
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{fontAssets.length}</p>
            <p>En biblioteca</p>
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{fontRisks.length}</p>
            <p>Alertas</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Regla operativa</p>
        <p className="mt-1">
          Para acercar el visor y el PDF, evita usar <code>@import</code>, Google Fonts o hojas
          de estilo remotas como practica principal. Si la fuente hoy esta afuera, importala a la
          biblioteca o usa una fuente segura.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">
                Perfil tipografico de la plantilla
              </h5>
              <span
                className={cn(
                  'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                  profileBadge.className
                )}
              >
                {profileBadge.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Este resumen ya refleja las fuentes vinculadas a la plantilla y las familias
              declaradas actualmente en tu HTML/CSS.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center text-sm text-slate-600 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-lg font-black text-slate-900">{fontProfile.managedFamilies.length}</p>
              <p>Gestionadas</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-lg font-black text-slate-900">{fontProfile.safeFamilies.length}</p>
              <p>Seguras</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-lg font-black text-slate-900">{fontProfile.unmanagedFamilies.length}</p>
              <p>No gestionadas</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-lg font-black text-slate-900">{fontProfile.externalSources.length}</p>
              <p>Fuentes externas</p>
            </div>
          </div>
        </div>

        {fontProfile.declaredFamilies.length > 0 ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Familias declaradas
            </p>
            <div className="flex flex-wrap gap-2">
              {fontProfile.declaredFamilies.map((family) => {
                const normalizedFamily = family.toLowerCase();
                const tone = fontProfile.managedFamilies.some(
                  (managedFamily) => managedFamily.toLowerCase() === normalizedFamily
                )
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : fontProfile.safeFamilies.some(
                      (safeFamily) => safeFamily.toLowerCase() === normalizedFamily
                    )
                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700';

                return (
                  <span
                    key={family}
                    className={cn(
                      'inline-flex rounded-full border px-3 py-1 text-xs font-medium',
                      tone
                    )}
                  >
                    {family}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {fontRisks.length > 0 ? (
        <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-rose-900">
            <AlertTriangle size={18} />
            <h5 className="text-sm font-semibold uppercase tracking-[0.18em]">Riesgos detectados en el codigo actual</h5>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {fontRisks.map((risk) => (
              <div key={risk.id} className="rounded-xl border border-rose-200 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{risk.title}</p>
                <p className="mt-1 text-sm text-slate-600">{risk.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Upload size={18} className="text-slate-700" />
            <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
              Subir archivo local
            </h5>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Opcion mas estable. Sube el archivo de fuente que ya descargaste para que quede guardado
            en la biblioteca interna del sistema.
          </p>
          <div className="mt-4">
            <UploadButton
              endpoint="fontUpload"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error: Error) => {
                toast.error(`Error al subir fuente: ${error.message}`);
              }}
              appearance={{
                button:
                  'bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm font-semibold px-5 py-3 rounded-xl h-auto min-w-[220px]',
                allowedContent: 'hidden',
              }}
              content={{
                button({ ready }) {
                  return ready ? 'Subir fuente interna' : 'Preparando...';
                },
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Globe size={18} className="text-slate-700" />
            <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
              Importar desde URL
            </h5>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Usa una URL directa al archivo de fuente. El sistema la descarga, la sube a storage
            interno y la registra en la biblioteca.
          </p>

          <div className="mt-4 grid gap-3">
            <input
              type="url"
              value={remoteUrl}
              onChange={(event) => setRemoteUrl(event.target.value)}
              placeholder="https://.../MiFuente-Regular.woff2"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={remoteName}
                onChange={(event) => setRemoteName(event.target.value)}
                placeholder="Nombre del archivo (opcional)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary"
              />
              <input
                type="text"
                value={remoteFamily}
                onChange={(event) => setRemoteFamily(event.target.value)}
                placeholder="Familia tipografica (opcional)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={remoteWeight}
                onChange={(event) => setRemoteWeight(event.target.value)}
                placeholder="Peso, ej. 400"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary"
              />
              <select
                value={remoteStyle}
                onChange={(event) => setRemoteStyle(event.target.value as FontAssetStyle)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary"
              >
                <option value="normal">normal</option>
                <option value="italic">italic</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleImportFromUrl}
                disabled={importingFromUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importingFromUrl ? <LoaderCircle size={16} className="animate-spin" /> : <Link2 size={16} />}
                Importar desde URL
              </button>
              <span className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
                Solo URLs directas al archivo, no enlaces a la pagina de Google Fonts.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
            Fuentes vinculadas a esta plantilla
          </h5>
        </div>

        {selectedFonts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Esta plantilla todavia no tiene fuentes internas vinculadas. Puedes seguir usando
            fuentes seguras o agregar una desde la biblioteca.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {selectedFonts.map((fontAsset) => {
              const sourceBadge = buildSourceBadge(fontAsset.sourceType);
              return (
                <div
                  key={fontAsset.id}
                  className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900"
                >
                  <span className="font-medium">{fontAsset.family}</span>
                  <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]', sourceBadge.className)}>
                    {sourceBadge.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFontFromTemplate(fontAsset)}
                    className="rounded-full p-1 text-emerald-700 hover:bg-emerald-100"
                    title="Quitar de la plantilla"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <ShieldCheck size={18} className="text-blue-600" />
          <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
            Fuentes seguras del navegador
          </h5>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {SAFE_TEMPLATE_FONTS.map((fontOption) => (
            <div key={fontOption.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{fontOption.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{fontOption.notes}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                    fontOption.stability === 'muy_estable'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-blue-200 bg-blue-50 text-blue-700'
                  )}
                >
                  {fontOption.stability === 'muy_estable' ? 'PDF estable' : 'Estable'}
                </span>
              </div>

              <div
                className="mt-4 rounded-xl border border-white bg-white px-4 py-3 text-[28px] text-slate-900 shadow-sm"
                style={{ fontFamily: fontOption.sampleFamily }}
              >
                Fernando Cabrera
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      fontOption.cssSnippet,
                      `safe-${fontOption.id}`,
                      'Snippet de fuente copiado.'
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  {copiedToken === `safe-${fontOption.id}` ? <Check size={16} /> : <Copy size={16} />}
                  Copiar font-family
                </button>
                {onInsertCssSnippet ? (
                  <button
                    type="button"
                    onClick={() => onInsertCssSnippet(`${fontOption.cssSnippet}\n`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100"
                  >
                    <Type size={16} />
                    Insertar font-family
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Upload size={18} className="text-slate-700" />
          <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
            Biblioteca interna de fuentes
          </h5>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Cargando biblioteca de fuentes...
          </div>
        ) : fontAssets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Todavia no hay fuentes internas. Sube o importa una fuente para usarla en tus plantillas
            y mantener el PDF consistente con la vista previa.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {fontAssets.map((fontAsset) => {
              const isSelected = value.some((fontRef) => matchesFontRef(fontAsset, fontRef));
              const fallback = inferTemplateFontFallback(fontAsset.family);
              const familySnippet = buildTemplateFontFamilySnippet(fontAsset.family, fallback);
              const ruleSnippet = buildTemplateFontRuleSnippet(fontAsset.family, {
                weight: fontAsset.weight,
                style: fontAsset.style,
                fallback,
              });
              const sourceBadge = buildSourceBadge(fontAsset.sourceType);

              return (
                <div key={fontAsset.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{fontAsset.family}</p>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                          {fontAsset.format}
                        </span>
                        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]', sourceBadge.className)}>
                          {sourceBadge.label}
                        </span>
                        {isSelected ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                            En plantilla
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Archivo: {fontAsset.name} · Peso {fontAsset.weight} · {fontAsset.style}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteFontAsset(fontAsset)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar de la biblioteca"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div
                    className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-[34px] text-slate-900"
                    style={{ fontFamily: `'${fontAsset.family}', ${fallback}` }}
                  >
                    Fernando Cabrera
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          familySnippet,
                          `font-family-${fontAsset.id}`,
                          'font-family copiado.'
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      {copiedToken === `font-family-${fontAsset.id}` ? <Check size={16} /> : <Copy size={16} />}
                      Copiar font-family
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          ruleSnippet,
                          `font-rule-${fontAsset.id}`,
                          'Regla CSS copiada.'
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      {copiedToken === `font-rule-${fontAsset.id}` ? <Check size={16} /> : <Copy size={16} />}
                      Copiar regla CSS
                    </button>

                    {onInsertCssSnippet ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onInsertCssSnippet(
                              `/* Fuente: ${fontAsset.family} */\n${familySnippet}\n`
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100"
                        >
                          <Type size={16} />
                          Insertar font-family
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onInsertCssSnippet(
                              `/* Regla sugerida para ${fontAsset.family} */\n${ruleSnippet}\n`
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary hover:bg-primary/10"
                        >
                          <Library size={16} />
                          Insertar regla
                        </button>
                      </>
                    ) : null}

                    <button
                      type="button"
                      onClick={() =>
                        isSelected ? removeFontFromTemplate(fontAsset) : addFontToTemplate(fontAsset)
                      }
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
                        isSelected
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                      )}
                    >
                      {isSelected ? <CheckCircle2 size={16} /> : <Library size={16} />}
                      {isSelected ? 'Quitar de plantilla' : 'Usar en plantilla'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
