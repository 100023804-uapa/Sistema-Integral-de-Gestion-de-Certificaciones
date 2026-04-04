export const PREFERRED_CERTIFICATE_TEMPLATE_NAME = 'Certificado modelo curso taller';

function normalizeTemplateName(value: string | undefined | null) {
  return (value || '').trim().toLowerCase();
}

export function isTemplateApprovedForIssuance(template: { name: string; isActive: boolean }) {
  return (
    template.isActive &&
    normalizeTemplateName(template.name) === normalizeTemplateName(PREFERRED_CERTIFICATE_TEMPLATE_NAME)
  );
}

export function filterApprovedTemplatesForIssuance<T extends { name: string; isActive: boolean }>(
  templates: T[]
): T[] {
  return templates.filter((template): template is T => isTemplateApprovedForIssuance(template));
}

export function findPreferredTemplateForIssuance<T extends { id: string; name: string; isActive: boolean }>(
  templates: T[]
): T | null {
  return filterApprovedTemplatesForIssuance(templates)[0] || null;
}

export function getTemplateIssuancePolicyMessage() {
  return `Por ahora SIGCE emite solo con la plantilla aprobada "${PREFERRED_CERTIFICATE_TEMPLATE_NAME}".`;
}
