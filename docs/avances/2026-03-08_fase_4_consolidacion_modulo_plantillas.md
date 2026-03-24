# Fase 4 - Consolidacion del modulo de plantillas

**Fecha:** 2026-03-08  
**Estado:** Implementada  

---

## 1. Objetivo

Esta fase se enfocó en volver el módulo de plantillas más coherente con el motor real de generación de certificados.

La meta era corregir tres brechas:

1. el catálogo no mostraba con claridad si una plantilla corría en modo `HTML`, `LEGACY` o `DEFAULT`,
2. la duplicación no preservaba `htmlContent` ni `cssStyles`,
3. la cadena de creación podía persistir HTML/CSS genéricos aunque el editor hubiera capturado un diseño real.

---

## 2. Cambios implementados

### 2.1 Catálogo de plantillas

Se reescribió `app/dashboard/certificate-templates/page.tsx`.

Ahora el catálogo:

- muestra una vista previa renderizada con datos de ejemplo,
- expone el modo real de render (`HTML`, `LEGACY`, `DEFAULT`),
- muestra formato, orientación, variables detectadas y fecha de actualización,
- abre un modal de preview más fiel al render real.

### 2.2 Duplicación correcta

Se corrigió la duplicación de plantillas en el catálogo para que conserve:

- `htmlContent`
- `cssStyles`
- `layout`
- `placeholders`

Además, la acción usa el usuario autenticado cuando está disponible.

### 2.3 Persistencia de creación

Se corrigió la cadena completa de creación de plantillas:

- `app/api/admin/certificate-templates/route.ts`
- `lib/usecases/certificateTemplate/CreateTemplateUseCase.ts`
- `lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts`
- `lib/types/certificateTemplate.ts`

Con esto, cuando el editor envía HTML/CSS reales, ya no se sobrescriben con un template genérico.

### 2.4 Editor de creación

Se ajustó `app/dashboard/certificate-templates/create/page.tsx` para enviar `createdBy` con el usuario real en vez del valor temporal anterior.

---

## 3. Resultado esperado

Después de esta fase debes notar:

- el catálogo refleja mejor el comportamiento real de cada plantilla,
- el preview del catálogo se parece mucho más al resultado final,
- al duplicar una plantilla no se pierde el diseño real,
- la creación desde el editor persiste HTML/CSS reales y no un placeholder genérico.

---

## 4. Archivos impactados

- `app/dashboard/certificate-templates/page.tsx`
- `app/dashboard/certificate-templates/create/page.tsx`
- `app/api/admin/certificate-templates/route.ts`
- `lib/usecases/certificateTemplate/CreateTemplateUseCase.ts`
- `lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts`
- `lib/types/certificateTemplate.ts`

---

## 5. Verificación ejecutada

Se validó con:

- `pnpm exec tsc --noEmit`
- `pnpm exec eslint "app/dashboard/certificate-templates/page.tsx" "app/dashboard/certificate-templates/create/page.tsx" "app/api/admin/certificate-templates/route.ts" "lib/usecases/certificateTemplate/CreateTemplateUseCase.ts" "lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts" "lib/types/certificateTemplate.ts" --no-cache`

Ambas verificaciones quedaron en verde.

