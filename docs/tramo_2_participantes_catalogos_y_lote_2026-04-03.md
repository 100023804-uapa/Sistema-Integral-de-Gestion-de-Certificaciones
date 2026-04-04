# Tramo 2: Participantes con Catálogos y Lote Institucional

Fecha: 2026-04-03

## Objetivo

Alinear el alta manual, edición y carga masiva de participantes para que todos lleguen al mismo contrato institucional, sin depender de texto libre como fuente principal.

## Alcance aplicado

### 1. Modelo de participante ampliado con referencias canónicas

Se extendió la entidad de participante para soportar referencias institucionales y snapshots legibles:

- `programId`
- `programNameSnapshot`
- `campusId`
- `campusNameSnapshot`
- `academicAreaId`
- `academicAreaNameSnapshot`

Archivo:

- [Student.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/domain/entities/Student.ts)

### 2. Persistencia compatible hacia Firestore

El repositorio ya guarda y recupera esos campos nuevos sin romper registros legacy.

También limpia valores `undefined` antes de escribir.

Archivo:

- [FirebaseStudentRepository.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/infrastructure/repositories/FirebaseStudentRepository.ts)

### 3. Alta manual alineada a catálogos

La creación manual de participantes ya no usa carrera como campo libre principal.

Ahora exige selección desde catálogos para:

- recinto;
- programa;
- área académica opcional ligada al recinto.

Archivo:

- [graduates/create/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/graduates/create/page.tsx)

### 4. Edición manual alineada a catálogos

La edición de participantes quedó alineada al mismo contrato que el alta manual.

Archivo:

- [graduates/[id]/edit/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/graduates/%5Bid%5D/edit/page.tsx)

### 5. Actualización administrativa del participante ampliada

La API de actualización ya recibe y persiste los campos canónicos nuevos.

Archivo:

- [students/[id]/route.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/api/admin/students/%5Bid%5D/route.ts)

### 6. Importación masiva con contexto institucional del lote

La importación masiva ahora exige seleccionar primero:

- recinto;
- programa;
- área académica opcional.

Ese contexto se aplica a todo el lote para que el Excel no invente nombres institucionales.

Se mantiene compatibilidad temporal con la columna `Carrera`, pero como referencia legacy y no como fuente maestra del programa.

Archivos:

- [import-students.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/actions/import-students.ts)
- [graduates/import/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/graduates/import/page.tsx)

### 7. Listado y detalle con visibilidad del modelo institucional

La lista principal de participantes ahora puede buscar también por programa y recinto, y muestra:

- programa;
- recinto;
- área académica;
- cantidad de certificados;
- último folio emitido;
- estado del portal.

El detalle del participante también muestra los nuevos labels institucionales.

Archivos:

- [graduates/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/graduates/page.tsx)
- [graduates/[id]/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/graduates/%5Bid%5D/page.tsx)
- [studentOverview.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/server/studentOverview.ts)
- [studentOverview.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/types/studentOverview.ts)

### 8. Portal y cuentas con lectura compatible

El portal del participante y el mapeo de cuentas internas ya leen los nuevos snapshots cuando existen, con fallback a `career`.

Archivos:

- [studentPortal.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/server/studentPortal.ts)
- [studentAccounts.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/server/studentAccounts.ts)
- [student/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/student/page.tsx)

## Regla operativa que queda fijada

Para participantes:

- el usuario puede seguir importando por Excel;
- pero recinto y programa deben venir del catálogo institucional;
- el área académica depende del recinto;
- `career` queda solo como espejo temporal del nombre del programa para compatibilidad.

## Compatibilidad mantenida

No se borraron datos viejos.

Se mantuvo compatibilidad con registros previos porque:

- si no existe `programNameSnapshot`, se sigue usando `career`;
- los campos nuevos son opcionales;
- las escrituras nuevas ya salen completas sin exigir migración destructiva.

## Lo que todavía no queda cerrado

Este tramo no toca aún:

- alta manual de certificados;
- importación masiva de certificados;
- selección obligatoria de plantilla en certificados;
- selección obligatoria de firmantes institucionales en certificados;
- flujo de firma y emisión;
- publicación final como `available`.

## Riesgos conocidos

1. Puede haber participantes legacy sin vínculo resoluble a programa/recinto reales.
2. Aún no se ha corrido un backfill formal sobre participantes existentes.
3. La validación automática de tipos sigue bloqueada en este entorno por el error de `EPERM` sobre la ruta de usuario de Windows, aunque el tramo quedó revisado por consistencia de llamadas y estructura.

## Siguiente paso correcto

Abrir el Tramo 3:

1. unificar alta manual y masiva de certificados;
2. exigir plantilla desde origen;
3. exigir participante válido desde ficha existente;
4. exigir firmante institucional 1 y opcionalmente firmante 2;
5. eliminar creación silenciosa de participante desde certificado.
