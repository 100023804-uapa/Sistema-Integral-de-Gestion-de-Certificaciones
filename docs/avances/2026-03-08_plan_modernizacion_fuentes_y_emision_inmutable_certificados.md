# 2026-03-08 - Plan de modernizacion de fuentes y emision inmutable de certificados

## Objetivo

Dejar trazado el plan completo para evolucionar el sistema de plantillas y certificados desde un modelo fragil basado en fuentes externas y PDF regenerado, hacia un modelo controlado por el sistema con fuentes internas, render coherente y documento final persistido.

## Diagnostico resumido

Se detectaron estas deficiencias estructurales:

- el editor de plantillas permite usar fuentes remotas sin control del sistema,
- no existe un modulo de fuentes internas,
- la plantilla no guarda referencias formales de fuentes,
- el certificado emitido sigue dependiendo de la plantilla viva por `templateId`,
- la descarga PDF no es un archivo definitivo persistido,
- visor y PDF pueden diferir aunque la plantilla sea la correcta.

## Decision de arquitectura

La direccion adoptada es:

- importar fuentes al sistema en lugar de consumirlas en vivo,
- referenciarlas desde las plantillas,
- unificar el render en todos los puntos de visualizacion,
- congelar el estado visual del certificado emitido,
- generar y persistir un PDF final.

## Fases definidas

1. Biblioteca de fuentes del sistema.
2. Nuevo apartado de fuentes en el editor HTML/CSS.
3. Modelo de plantilla con referencias a fuentes.
4. Render unificado con fuentes internas.
5. Emision inmutable del certificado.
6. PDF definitivo y persistido.
7. Migracion y compatibilidad de plantillas existentes.

## Resultado esperado

Al finalizar el plan:

- el editor guiara el uso de fuentes estables,
- las plantillas nuevas dejaran de depender de Google Fonts como base operativa,
- preview, validacion publica y PDF usaran la misma base visual,
- un certificado emitido no cambiara si la plantilla se edita despues,
- la descarga correspondera al documento final real.

## Siguiente paso

Iniciar con la Fase 1, centrada en la biblioteca de fuentes del sistema y la infraestructura minima para subir, registrar y reutilizar tipografias internas.
