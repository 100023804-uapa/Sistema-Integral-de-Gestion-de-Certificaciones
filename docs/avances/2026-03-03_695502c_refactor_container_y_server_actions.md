# 695502c — Refactor: introduce container and decouple server actions from Firebase repos

**Fecha:** 2026-03-03  
**Commit:** `695502c`  
**Rama:** `fase-0-hardening`  

---

## Objetivo

Iniciar la Fase 0.2 (Modularidad mínima):

- Crear un punto único de construcción de dependencias (`container`).
- Evitar que `app/actions/*` importen repositorios concretos de Firebase.

---

## Cambios principales

### 1) Nuevo contenedor

- Se creó `lib/container.ts` con factorías para:
  - repositorios (`getCertificateRepository`, `getStudentRepository`, `getTemplateRepository`, `getAccessRepository`),
  - casos de uso (inicialmente `getCreateCertificateUseCase`, `getGenerateFolioUseCase`).

### 2) Server Actions desacopladas

- `app/actions/consult-certificates.ts` ahora usa `getCertificateRepository()`.
- `app/actions/import-certificates.ts` ahora usa `getCertificateRepository()` y `getStudentRepository()`.

---

## Archivos impactados

- `lib/container.ts`
- `app/actions/consult-certificates.ts`
- `app/actions/import-certificates.ts`

---

## Verificación (manual)

- Verificación pública (`/verify`) debe seguir consultando por folio o matrícula.
- Importación desde Excel debe seguir creando/actualizando estudiantes y certificados.

---

## Próximo paso

- Continuar Fase 0.2 migrando `app/**` (UI) a consumir `lib/container.ts` en lugar de `lib/infrastructure/**`.
