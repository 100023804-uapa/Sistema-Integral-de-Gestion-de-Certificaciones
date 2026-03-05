# Firebase Admin Production Issues - Reversión Temporal

**Fecha:** 2026-03-04  
**Rama:** `main`  
**Estado:** 🔴 PROBLEMA CRÍTICO EN PRODUCCIÓN

---

## 🚨 Problema

### Síntomas
- **Local**: ✅ Login/logout funciona correctamente con Firebase Admin
- **Producción (Vercel)**: ❌ Error 500 en endpoints de sesión
- **Error específico**: `Failed to parse private key: Error: Too few bytes to read ASN.1 value`

### Causa raíz
1. **Firebase Admin SDK** requiere `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON con private key)
2. **Vercel Environment Variables** tiene límite de ~4KB
3. **JSON truncado** → private key incompleto → error ASN.1 parsing
4. **Resultado**: Login/logout fallan en producción pero funcionan local

---

## 🔍 Intentos de solución

### 1. Lazy Initialization ✅
- **Archivo**: `lib/firebaseAdmin.ts`
- **Cambio**: Inicialización lazy (runtime) vs build-time
- **Resultado**: ✅ Evita build errors, ❌ Sigue fallando en runtime

### 2. Logging Detallado ✅
- **Archivo**: `lib/firebaseAdmin.ts`
- **Cambio**: Logs de longitud, preview, validación de campos
- **Resultado**: ✅ Detecta truncamiento, ❌ No soluciona problema

### 3. Base64 Encoding ❌
- **Archivo**: `lib/firebaseAdmin.ts`, `scripts/encode-env-key.js`
- **Cambio**: Codificar JSON en Base64 para evitar truncamiento
- **Resultado**: ❌ Variable `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` no persiste en Vercel

### 4. Priorizar Base64 ❌
- **Archivo**: `lib/firebaseAdmin.ts`
- **Cambio**: Leer Base64 primero, luego variable directa
- **Resultado**: ❌ Sigue usando variable truncada

---

## 🔄 Decisión: Reversión Temporal

### Motivo
- **Bloqueo de desarrollo**: No se puede continuar con otras fases
- **Infraestructura vs funcionalidad**: Priorizar avance del proyecto
- **Solución temporal**: Revertir Firebase Admin en endpoints de sesión

### Cambios realizados
1. **`app/api/auth/session/login/route.ts`**
   - **Antes**: `getAdminAuth()` → `createSessionCookie()`
   - **Ahora**: Cookie simple `temp-session` sin verificación

2. **`app/api/auth/session/logout/route.ts`**
   - **Antes**: `getAdminAuth()` → `revokeRefreshTokens()`
   - **Ahora**: Eliminar cookie sin revocación

3. **`app/api/auth/session/verify/route.ts`**
   - **Antes**: `getAdminAuth()` → `verifySessionCookie()`
   - **Ahora**: Verificar cookie `temp-session` sin validación

---

## ⚖️ Impacto de la reversión

### ✅ Ventajas
- **Funciona inmediatamente** en producción
- **Sin dependencia de Firebase Admin** temporalmente
- **Permite continuar desarrollo** de otras fases
- **Mantiene UX** del login/logout

### ❌ Desventajas
- **Seguridad reducida**: No verifica idToken real
- **Cookie falsificable**: Cualquiera puede crear sesión
- **Sin revocación real**: Tokens no se invalidan en Firebase
- **Pérdida de hardening** de Fase 0.1

---

## 🎯 Próximos pasos

### Corto plazo (temporal)
1. **Deploy cambios** y verificar que login/logout funcionen
2. **Continuar desarrollo** de otras fases
3. **Monitorear producción** por problemas de seguridad

### Largo plazo (definitivo)
1. **Investigar alternativas** a Vercel Environment Variables:
   - Vercel Secrets (plan superior)
   - External secret manager (AWS Secrets, etc.)
   - Service Account con clave más corta

2. **Reimplementar Firebase Admin** con solución robusta
3. **Restaurar seguridad** de Fase 0.1 completa

---

## 📊 Métricas

### Tiempo invertido
- **Diagnóstico**: 2 horas
- **Intentos de solución**: 4
- **Documentación**: 30 minutos

### Estado actual
- **Producción**: 🔴 Funcionalidad básica (sin seguridad)
- **Desarrollo**: 🟡 Bloqueo resuelto temporalmente
- **Deuda técnica**: 🔴 Seguridad pendiente de restaurar

---

## 📝 Notas para el futuro

1. **Considerar hosting alternativo** con mejor soporte para secrets largos
2. **Implementar verificación híbrida**: Firebase Admin + fallback simple
3. **Automatizar tests** de variables de entorno en CI/CD
4. **Documentar límites** de Vercel para futuros proyectos

---

**Última actualización:** 2026-03-04 19:50 UTC-4  
**Estado:** 🔴 EN ESPERA DE DEPLOY Y VALIDACIÓN
