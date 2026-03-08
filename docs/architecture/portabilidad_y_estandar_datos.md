# Estándar de Portabilidad y Datos (SIGCE)

Este documento define la estrategia técnica para asegurar que el Sistema Integral de Gestión de Certificaciones (SIGCE) mantenga su independencia de proveedores de bases de datos y facilite futuras migraciones.

## 1. Independencia del Proveedor (Patrón Repositorio)

La lógica de negocio (Casos de Uso) nunca interactúa directamente con Firebase. Se utiliza una interfaz de repositorio que actúa como un **Adaptador**.

- **Contrato**: Definido en `lib/domain/repositories/`.
- **Implementación**: Localizada en `lib/infrastructure/repositories/`.

> [!TIP]
> Para migrar a PostgreSQL o MongoDB, solo necesitas crear una nueva clase que implemente la interfaz correspondiente (e.g., `PostgresCertificateRepository`) sin tocar una sola línea de la lógica de certificados.

## 2. Capa de Anti-Corrupción (Sanitización)

Dado que las bases de datos NoSQL como Firestore son sensibles a valores `undefined`, el sistema implementa una capa de sanitización estricta:

- **Estrategia**: Todo campo opcional debe convertirse explícitamente a `null` si no tiene valor antes de llamar a la persistencia.
- **Ubicación**: Se realiza preferiblemente en el Repositorio (Infraestructura) para no ensuciar el Dominio.

### Ejemplo de Estándar
```typescript
// Mal: Puede fallar en Firestore si previousState es undefined
await setDoc(docRef, { previousState });

// Bien: Garantiza portabilidad y consistencia
await setDoc(docRef, { previousState: data.previousState || null });
```

## 3. Esquema de Optimización (Indices)

El archivo `firestore.indexes.json` en la raíz del proyecto **no es solo para Firebase**. Representa el mapa de optimización del sistema:

- **Significado**: Si un campo está en este archivo, significa que el sistema realiza búsquedas complejas o filtrados sobre él (e.g., "Buscar certificados por Estudiante ORDENADOS por Fecha").
- **Versatilidad**: En una base de datos SQL, estas entradas se traducirían directamente en sentencias `CREATE INDEX`.

## 4. Checklist para el Futuro

Si decides dejar de usar Firebase:

1. **Modelado**: El modelo de datos está basado en Documentos (JSON), lo cual es compatible con la mayoría de bases NoSQL modernas.
2. **Archivos de Configuración**: Mantén siempre una copia de `firebase.json` e `indexes.json`; son los metadatos que describen el comportamiento de tu base de datos actual.
3. **Migración de Archivos**: Los archivos se gestionan mediante UploadThing, lo que ya te da independencia de los buckets de Google Cloud si así lo deseas.
