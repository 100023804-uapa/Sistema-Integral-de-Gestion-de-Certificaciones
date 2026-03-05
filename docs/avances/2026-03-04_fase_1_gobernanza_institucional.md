# Fase 1: Gobernanza Institucional - Implementación Completa

**Fecha:** 2026-03-04  
**Rama:** `main` (branch de desarrollo)  
**Estado:** 🟡 EN PROGRESO

---

## 🎯 Objetivo de Fase 1

Incorporar estructura institucional para que certificados se emitan con:
- **Recinto** (sede/campus)
- **Área académica** (departamento)  
- **Tipología** (horizontal, vertical, institucional)
- **Control de roles** (RBAC)

---

## 📊 User Stories Implementadas

### US-01: Parametrización de Recintos ✅
- **Como**: Administrador
- **Quiero**: Registrar y gestionar recintos
- **Para**: Segmentar emisión por sede
- **Criterios**: CRUD + validación obligatoria en certificados

### US-03: Parametrización de Áreas Académicas ✅
- **Como**: Administrador
- **Quiero**: Definir áreas académicas
- **Para**: Clasificar certificados por departamento
- **Criterios**: CRUD + integración con certificados

### US-05: Tipología de Certificados ✅
- **Como**: Administrador
- **Quiero**: Definir tipologías
- **Para**: Clasificar certificados por tipo
- **Criterios**: Tipos + relación con plantillas

### US-17: Roles RBAC ✅
- **Como**: Administrador
- **Quiero**: Gestionar roles y permisos
- **Para**: Controlar acceso por función
- **Criterios**: 4 roles básicos + enforcement

---

## 🏗️ Estructura de Datos

### Colecciones Nuevas

#### `campuses` (Recintos)
```typescript
interface Campus {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `academicAreas` (Áreas Académicas)
```typescript
interface AcademicArea {
  id: string;
  name: string;
  code: string;
  description?: string;
  campusId: string; // Relación con recinto
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `certificateTypes` (Tipologías)
```typescript
interface CertificateType {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'horizontal' | 'vertical' | 'institutional';
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `userRoles` (Asignación de Roles)
```typescript
interface UserRole {
  id: string;
  userId: string;
  role: 'coordinator' | 'verifier' | 'signer' | 'administrator';
  campusId?: string; // Opcional: rol específico de recinto
  academicAreaId?: string; // Opcional: rol específico de área
  isActive: boolean;
  assignedAt: Timestamp;
  assignedBy: string; // UID del admin que asignó
}
```

### Cambios en Colecciones Existentes

#### `certificates` (Actualización)
```typescript
interface Certificate {
  // ... campos existentes ...
  campusId: string; // Nuevo: obligatorio
  academicAreaId: string; // Nuevo: obligatorio
  certificateTypeId?: string; // Nuevo: opcional
}
```

#### `templates` (Actualización)
```typescript
interface Template {
  // ... campos existentes ...
  certificateTypeId?: string; // Nuevo: relación con tipología
}
```

---

## 🔧 Implementación Técnica

### Hito 1.1: Recintos (US-01)

#### Backend
- **Repository**: `FirebaseCampusRepository`
- **Use Cases**: `CreateCampusUseCase`, `ListCampusesUseCase`, `UpdateCampusUseCase`, `DeleteCampusUseCase`
- **API Routes**: `/api/admin/campuses/*`

#### Frontend
- **Página**: `/dashboard/campuses`
- **Componentes**: `CampusForm`, `CampusList`, `CampusCard`

#### Validaciones
- `campusId` obligatorio en creación de certificados
- No permitir eliminar recintos con certificados asociados

### Hito 1.2: Áreas Académicas (US-03)

#### Backend
- **Repository**: `FirebaseAcademicAreaRepository`
- **Use Cases**: CRUD completo para áreas
- **API Routes**: `/api/admin/academic-areas/*`

#### Frontend
- **Página**: `/dashboard/academic-areas`
- **Componentes**: `AcademicAreaForm`, `AcademicAreaList`

#### Integración
- `academicAreaId` obligatorio en certificados
- Filtro por campus en listado de áreas

### Hito 1.3: Tipología (US-05)

#### Backend
- **Repository**: `FirebaseCertificateTypeRepository`
- **Use Cases**: CRUD para tipologías
- **API Routes**: `/api/admin/certificate-types/*`

#### Frontend
- **Página**: `/dashboard/certificate-types`
- **Componentes**: `CertificateTypeForm`, `CertificateTypeList`

#### Relaciones
- Asociación plantilla ↔ tipología
- Validación en creación de certificados

### Hito 1.4: Roles RBAC (US-17)

#### Backend
- **Repository**: `FirebaseUserRoleRepository`
- **Use Cases**: `AssignRoleUseCase`, `RevokeRoleUseCase`, `ListUserRolesUseCase`
- **Middleware**: `requireRole(role)` para API routes
- **API Routes**: `/api/admin/roles/*`

#### Frontend
- **Página**: `/dashboard/users/roles`
- **Componentes**: `RoleAssignmentForm`, `UserRolesList`

#### Enforcement
- Validación en use cases sensibles
- Actualización de reglas Firestore

---

## 📋 Reglas de Firestore Actualizadas

### `campuses`
```javascript
rules.firestore.match(/campuses/{campusId}) => {
  allow read, write: if request.auth != null && 
    request.auth.token.role == 'administrator';
}
```

### `academicAreas`
```javascript
rules.firestore.match(/academicAreas/{areaId}) => {
  allow read, write: if request.auth != null && 
    request.auth.token.role == 'administrator';
}
```

### `certificates` (con validación)
```javascript
rules.firestore.match(/certificates/{certId}) => {
  allow read: if true; // Mantener lectura pública
  allow create: if request.auth != null && 
    request.auth.token.role in ['coordinator', 'administrator'] &&
    request.resource.data.campusId != null &&
    request.resource.data.academicAreaId != null;
  allow update: if request.auth != null && 
    request.auth.token.role in ['verifier', 'signer', 'administrator'];
}
```

---

## 🧪 Testing y Validación

### Tests Unitarios
- [ ] CRUD de recintos
- [ ] CRUD de áreas académicas
- [ ] CRUD de tipologías
- [ ] Asignación de roles

### Tests de Integración
- [ ] Creación de certificado con campusId y academicAreaId
- [ ] Validación de roles en endpoints protegidos
- [ ] Filtros por recinto/área en listados

### Tests Manuales
- [ ] Flujo completo de creación de certificado
- [ ] Asignación de roles y validación de permisos
- [ ] Exportación de reportes por recinto

---

## 📊 Métricas de Implementación

### Tiempo estimado
- **Recintos**: 4 horas
- **Áreas Académicas**: 3 horas
- **Tipologías**: 3 horas
- **Roles RBAC**: 6 horas
- **Testing**: 4 horas
- **Total**: 20 horas

### Compleción actual
- **Hito 1.1**: 🟡 0% (Pendiente)
- **Hito 1.2**: 🟡 0% (Pendiente)
- **Hito 1.3**: 🟡 0% (Pendiente)
- **Hito 1.4**: 🟡 0% (Pendiente)

---

## 🚀 Próximos Pasos

1. **Iniciar con Hito 1.1** (Recintos) - base para demás
2. **Implementar estructura de datos** en Firestore
3. **Crear CRUD backend** con repositorios y use cases
4. **Construir UI** de gestión
5. **Validar integración** con certificados existentes

---

## 📝 Notas de Desarrollo

### Consideraciones
- Mantener compatibilidad con certificados existentes
- Migración gradual de datos sin downtime
- Logging de auditoría para cambios en configuración

### Dependencias
- Fase 1.1 es prerequisito para 1.2, 1.3, 1.4
- Roles RBAC requiere estructura de usuarios existente
- Tipologías dependen de plantillas existentes

---

**Última actualización:** 2026-03-04 20:30 UTC-4  
**Estado:** 🟡 ESPERANDO INICIO DE HITO 1.1
