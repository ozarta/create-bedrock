> Estado vigente QA 0.4.2: [ESTADO_FUNCIONAL.md](ESTADO_FUNCIONAL.md). Esta página conserva el historial; las pruebas nativas actuales están en [PRUEBAS_WINDOWS.md](PRUEBAS_WINDOWS.md) y [PRUEBAS_REALMS.md](PRUEBAS_REALMS.md).

# Licencias y procedencia

Se leyó LICENSE.md del tag mc1.21.1-6.0.10, SHA ac0c444d9828da3453ae8cc65338e8de063286fb: arte bajo `src/main/resources/assets/` All Rights Reserved; los demás archivos MIT. Se reimplementaron reglas de código cinético en TypeScript, con aviso MIT completo en `licenses/Create-code-MIT.txt` y dentro del BP. No se incorporó arte, escenas ni manual de Create. En 0.3.0 se extrajeron únicamente los JSON técnicos de recetas/tags fuera de assets, cubiertos por MIT, con aviso y procedencia. No se certifica una licencia uniforme de sus dependencias ni se las incluye.

Política del proyecto: no copiar, extraer, adaptar ni empaquetar recursos All Rights Reserved sin permiso. Toda textura, modelo, sprite, interfaz, animación, escena tutorial y sonido será original. Inspirarse en mecánicas industriales no autoriza copiar su expresión artística o marcas.

## Matriz legal pendiente

| Componente | Evidencia necesaria | Estado / acción |
|---|---|---|
| Código Create | LICENSE.md, cabeceras, SHA y avisos | LICENSE.md verificado para el subconjunto cinético; rutas/commit en CINETICA.md |
| Recursos de Create | Licencias específicas y excepciones por carpeta/archivo | Restricción All Rights Reserved verificada; excluidos de importación |
| Dependencias de Create | Build, lockfiles, submódulos y licencias individuales | Lista por extraer; no asumir MIT |
| Flywheel, Ponder u otras bibliotecas candidatas | Confirmar si están presentes en el commit y su licencia | Sin verificar; no se integran automáticamente |
| Minecraft Script API / herramientas Microsoft | Metadatos npm y lockfile | server 2.11.0, server-ui 2.3.0, common 1.3.0 y vanilla-data 1.26.60 declaran MIT; tipos solo para desarrollo, no redistribuidos en el pack |
| TypeScript y herramientas de build | Paquete y licencia local | TypeScript 5.9.3, Apache-2.0; instalado como herramienta, excluido del pack |
| Arte y sonido propios | Fuentes y hashes en assets_source/provenance.json | Ejemplos originales generados para este proyecto; licencia pública pendiente |
| Nombre, logos y distribución Minecraft | Guías de marca, EULA y términos vigentes | Por revisar; proyecto independiente sin afiliación |

## Si se reutiliza código MIT

Guardar URL permanente, commit, ruta, autor/copyright y licencia aplicable; conservar aviso de copyright y texto completo de permiso en las copias o porciones sustanciales y en la distribución donde corresponda. Registrar modificaciones y atribución en `THIRD_PARTY_NOTICES.md`. Una implementación nueva de la mecánica no debe presentarse como copia auditada. No añadir un aviso MIT genérico que pretenda cubrir recursos o dependencias distintas.

Cada asset propio deberá registrar en `assets_source/provenance.json` ID, autor, fecha, tipo, ruta fuente, SHA-256, licencia acordada y herramientas usadas. Si se emplea generación asistida, documentar instrucciones y posterior revisión, sin referencias visuales protegidas copiadas. No hay entradas ficticias de autoría.

No se seleccionó una licencia global de distribución para el proyecto ni se afirmó propiedad sobre Minecraft/Create. La elección de licencia del código propio y cesiones de colaboradores se resolverá antes del lanzamiento. El empaquetado público queda bloqueado hasta completar esta revisión y los avisos necesarios.

La entrega 0.2.0 incluye un paquete **de desarrollo** solicitado expresamente. El bloqueo de distribución pública se conserva en `npm run package:release`; no se usa la licencia de Create para autorizar estos ejemplos propios. Véase [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

El catálogo técnico 0.3.0 conserva sus avisos MIT y fuente/hash por receta. Los nombres y explicaciones en español/inglés y las ocho imágenes del manual son propios. No se copiaron archivos de idioma protegidos. La información factual de la mesa vanilla se contrastó con Mojang sin asumir que las licencias de todas sus herramientas/recursos sean MIT.


## Actualización de fábrica 0.4.1

Prensa y embudo filtrado implementados en código con pruebas Node; integración Minecraft/Realms pendiente. Tres procesos de láminas, barriles nativos, inventarios conservadores y tutorial de supervivencia sin comandos. Ocho máquinas restantes pendientes. La descripción actual y las diferencias Java/Bedrock de esta vertical están en [FABRICA.md](FABRICA.md); las indicaciones anteriores sin procesamiento describen hitos previos.
