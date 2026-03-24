'use client';

import React, { useEffect, useRef, useState } from 'react';

import { RenderedCertificateTemplate } from '@/lib/application/utils/certificate-template-renderer';

interface RenderedCertificatePreviewProps {
  renderedTemplate: RenderedCertificateTemplate;
  title?: string;
  className?: string;
  minHeightClassName?: string;
  maxScale?: number;
}

const MM_TO_PX = 3.7795275591;

export function RenderedCertificatePreview({
  renderedTemplate,
  title = 'Vista renderizada del certificado',
  className = '',
  minHeightClassName = 'min-h-[70vh]',
  maxScale = 1.35,
}: RenderedCertificatePreviewProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateScale = () => {
      const availableWidth = Math.max(viewport.clientWidth - 24, 320);
      const widthPx = renderedTemplate.width * MM_TO_PX;
      const widthScale = availableWidth / widthPx;
      const nextScale = Math.min(widthScale, maxScale);

      if (Number.isFinite(nextScale) && nextScale > 0) {
        setPreviewScale(nextScale);
      }
    };

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(viewport);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [maxScale, renderedTemplate.height, renderedTemplate.width]);

  return (
    <div
      ref={viewportRef}
      className={`relative mx-auto bg-slate-100/90 shadow-inner rounded-[28px] overflow-y-auto overflow-x-hidden flex items-start justify-center p-2 sm:p-3 lg:p-4 border border-slate-200 ${minHeightClassName} ${className}`.trim()}
    >
      <div
        className="bg-white shadow-[0_28px_60px_rgba(15,23,42,0.18)] transition-transform duration-300 rounded-sm"
        style={{
          width: `${renderedTemplate.width}mm`,
          height: `${renderedTemplate.height}mm`,
          transform: `scale(${previewScale})`,
          transformOrigin: 'top center',
          overflow: 'hidden',
          marginTop: '8px',
          marginBottom: '32px',
        }}
      >
        <iframe title={title} srcDoc={renderedTemplate.documentHtml} className="w-full h-full border-0 bg-white" />
      </div>
    </div>
  );
}
