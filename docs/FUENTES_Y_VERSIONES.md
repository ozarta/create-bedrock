> Estado vigente QA 0.4.2: [ESTADO_FUNCIONAL.md](ESTADO_FUNCIONAL.md). Esta página conserva el historial; las pruebas nativas actuales están en [PRUEBAS_WINDOWS.md](PRUEBAS_WINDOWS.md) y [PRUEBAS_REALMS.md](PRUEBAS_REALMS.md).

# Evidencia y versiones

Fecha de revisión: 2026-10-29. Las mecánicas de paridad siguen siendo propuestas sin auditoría contra el código 6.0.10.

## Actualización — manual 0.3.0

Se extrajeron 1.884 archivos JSON técnicos de 25 tipos desde el mismo SHA Java verificado; se estudiaron ocho familias dinámicas, sin afirmar su enumeración de ejecución. Se revisó la documentación oficial de formularios e imágenes server-ui 2.3.0 y la receta factual nativa de mesa en las muestras Mojang 1.26.60.5. Véanse MANUAL.md y RECETAS.md. No hubo ejecución Minecraft/Realms.

## Actualización — cinética 0.2.0

Se verificó y consultó Create mc1.21.1-6.0.10, SHA ac0c444d9828da3453ae8cc65338e8de063286fb, para las reglas cinéticas y LICENSE.md. La evidencia y diferencias Bedrock están en CINETICA.md. El inventario integral, recetas Java restantes y licencias de dependencias siguen pendientes. No se ejecutó Minecraft.

## Actualización — fase de base técnica

Se recuperó acceso a npm/GitHub mediante permisos ampliados del ejecutor. Se verificó el tag estable oficial Bedrock v1.26.60.5, el mínimo interno `[1,26,60]`, y la publicación estable de server 2.11.0 / server-ui 2.3.0, ambos publicados en npm el 27 de octubre de 2026. Se instalaron dependencias con integridad del lockfile sin desactivar TLS. Véase [BASE_TECNICA.md](BASE_TECNICA.md). No se volvió a auditar Create ni se ejecutó Minecraft. Las secciones siguientes registran la **fase anterior** y no describen los artefactos disponibles ahora.

## Evidencia local

Base recibida: commit `a1e27cfe276ede084a2fdb8da62c5dbed975fb25`, mensaje `Init`, único archivo README.md vacío. `git fsck --full` pasó durante la preparación del entorno. No hay fuentes de Create disponibles.

Se intentó `git ls-remote https://github.com/Creators-of-Create/Create.git 'refs/tags/*6.0.10*'`. Falló con `Failed to connect to proxy port 8080`. También fallaron consultas HTTPS a Microsoft Learn y Minecraft Updates por el mismo motivo. La plataforma reporta política restringida aplicada y conectividad general, pero las operaciones concretas fallaron. No es evidencia de ausencia del tag ni de falta de credenciales.

## Fuentes a consultar cuando se restablezca la red

| Fuente | Propósito | Estado |
|---|---|---|
| https://github.com/Creators-of-Create/Create | Identificar tag/commit 6.0.10 y compatibilidad Java 1.21.1 | No consultada |
| LICENSE.md y avisos dentro del commit exacto | Separar código, arte y dependencias | No consultados |
| https://www.minecraft.net/en-us/updates | Confirmar lanzamiento estable y número de Bedrock | No consultada |
| https://learn.microsoft.com/en-us/minecraft/creator/documents/ | Formatos de packs y compatibilidad | No consultada |
| https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/ | Firmas y versiones estables de server y server-ui | No consultada |
| https://learn.microsoft.com/en-us/minecraft/creator/documents/realms | Localizador tentativo; confirmar URL y documentación Realms vigente | No consultada |

Microsoft Learn y minecraft.net no figuran entre los dominios personalizados autorizados actuales. Una vez restaurado el proxy, confirmar la política efectiva y solicitar su incorporación en ajustes si se deniega el acceso; no sustituir listas desconocidas ni eludir el proxy.

## Procedimiento reproducible pendiente

1. Listar tags completos, localizar release 6.0.10 y resolver su commit. No inventar el nombre del tag. Si no aparece, buscar evidencia de release y commit; registrar ausencia si no hay vínculo verificable.
2. Comprobar en los archivos de construcción del mismo commit Minecraft 1.21.1, versión de Create, loader, submódulos y dependencias. Guardar SHA completo, tag, URL permanente y fecha en config/research.json.
3. Auditar registros, builders, datagen, tags, loot, recetas estáticas y generadas. Recorrer variantes y bloques/objetos sin receta; distinguir integración opcional. Nunca sustituir por HEAD de main.
4. Verificar release estable Bedrock 26.60; si no es estable o no existe evidencia, mantener el objetivo bloqueado y documentar la versión estable comprobada sin cambiar silenciosamente el destino.
5. Seleccionar versiones estables de @minecraft/server y @minecraft/server-ui compatibles. Comprobar cada API usada y ejecutar una prueba mínima en Windows y Realm sin experimentos.
6. Guardar citas permanentes con rutas y líneas, conteos por registro/receta y copia de avisos legalmente redistribuibles. Solo entonces resolver bloqueos de empaquetado.

No se descargó código externo ni se copiaron assets. No hay comprobación dentro de Minecraft en esta máquina.

## Validación de esta entrega

- `python3 tools/project.py validate`: pasó; 27 familias preliminares y JSON locales coherentes.
- `python3 -m unittest discover -s tests -v`: 3 pruebas ejecutadas y aprobadas; cubren bloqueo de distribución, IDs duplicados y ausencia de manifiestos incluso con gates marcados.
- `python3 tools/project.py package`: rechazó la operación con código 1 por investigación, licencias, API, pruebas de juego y manifiestos pendientes; resultado esperado. No se generó .mcaddon.
- `python3 tools/project.py audit-source /workspace/create-bedrock`: rechazó el checkout con modificaciones/no rastreados; resultado esperado, no es auditoría de Create ni verificación de su versión. El recorrido de una fuente upstream limpia sigue sin ejecutarse.
- `git diff --check`: pasó. No se ejecutaron pruebas de Minecraft, Realms, compilación TypeScript, esquemas oficiales ni validación de assets.
