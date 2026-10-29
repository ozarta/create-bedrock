# Manual de Ingeniería Mecánica — 0.3.0

Implementación sobre el proyecto existente, sin reemplazar su cinética. **No se ejecutó un cliente Minecraft ni un Realm:** abrir el objeto, presentar formularios e imágenes y comprobar tutoriales son capacidades implementadas y compiladas, todavía pendientes de verificar en el motor. Las pruebas Node sí ejecutan catálogo, navegación, renderizado lógico, validación y la regresión cinética.

## Objeto, interfaz y uso

ID conservado: `bedrockworks:guidebook`. Receta real de mesa: **1 libro + 1 lingote de cobre → 1 Manual de Ingeniería Mecánica**. Es reutilizable, no se consume al navegar y también aparece en creativo. Su nombre en inglés es Mechanical Engineering Manual.

Se añadió el componente de objeto `bedrockworks:open_manual` registrado en startup, con onUse y onUseOn. Se conserva itemUse como ruta compatible. Todos pasan por una solicitud con límite de frecuencia de 10 ticks, diferida con system.run, y una sesión exclusiva por jugador para evitar dos formularios del mismo uso. Salir/desconectarse libera la sesión; una respuesta antigua no puede modificar una sesión nueva.

La portada ofrece las once categorías: Introducción, Materiales, Generación de energía, Engranajes y transmisión, Máquinas, Procesamiento, Transporte de objetos, Automatización, Construcciones móviles, Trenes y Tutoriales. Las categorías sin implementación Bedrock muestran referencias explícitas, sin prometer que existan sus sistemas.

Buscar y filtrar permite nombre/ID en es_MX y en_US, con normalización de mayúsculas y acentos, categoría, origen Bedrock/Java/ambos y disponibilidad. Límite de consulta: 80 caracteres; listas de 16 entradas por página. Se indexan nombres en ambos idiomas, productos, ingredientes y usos, incluidos pasos de ensamblaje. Los tags Java se resuelven parcialmente con las definiciones del repositorio, con protección frente a ciclos; tags aportados por vanilla/mods externos pueden añadir usos no enumerados.

Cada ficha de componente muestra nombre, icono ampliable, descripción, funcionamiento, energía, ejemplo y errores frecuentes. Cómo se fabrica abre las recetas estructuradas y sus alternativas; Usos enlaza consumidores. Las recetas muestran ingredientes, opciones, cantidades, unidades, resultados, probabilidades o pesos, estación de fabricación, condiciones, patrón y secuencias cuando existan. Ingredientes, productos y estación llevan a sus fichas. Hay lista paginada de vínculos si una receta supera 24 referencias.

Volver restaura la pantalla, búsqueda y página anteriores. El historial tiene hasta 64 pantallas, conserva la portada y descarta el salto más antiguo al superar ese límite. Paginación y pasos de tutorial reemplazan la página actual en vez de acumular saltos. Cerrar o cancelar el formulario principal termina la sesión; cancelar una búsqueda conserva la pantalla anterior; cerrar una ilustración vuelve a su ficha.

## Un catálogo generado, no tablas escritas en las pantallas

Fuentes:

- `behavior_pack/recipes/*.json`: once recetas reales del add-on; el build deriva cantidades, ingredientes y resultados de esos mismos archivos.
- `data/guide/components.json`: explicación propia de los once objetos/bloques, sin una segunda tabla de cantidades de recetas.
- `data/guide/categories.json`, `processes.json`, `ui.json`, `tutorials.json`: categorías, nombres de procesos, textos y pasos estructurados propios en ambos idiomas.
- `data/reference/create-6.0.10-recipes.json`: instantánea técnica MIT con fuente, hash y JSON original de cada receta Java.
- Una receta nativa de mesa de trabajo, representada por sus hechos técnicos (cuatro tablones en 2×2), contrastados con [Mojang Bedrock Samples 1.26.60.5](https://github.com/Mojang/bedrock-samples/blob/15701fa9c13923f12662984c32c124327e40e3d3/behavior_pack/recipes/crafting_table.json). No se añadió esa receta al BP ni se copiaron sus recursos visuales.

`tools/generate_guide.py` genera `src/guidebook/generated.ts`, `build/guide-catalog.json` y las claves `manual.*` de ambos packs. Los archivos generados se reconstruyen antes de TypeScript y no se editan a mano. Los JSON originales del BP siguen siendo la autoridad para sus recetas. Para cambiar textos editables usar data/guide; ejecutar build después de cambiar los datos. No editar manual.* directamente en los .lang porque el generador los sustituye.

No se tradujeron/copiararon las localizaciones protegidas de Create. Los nombres de referencia usan una normalización propia; los identificadores, nombres de mods, selectores y datos técnicos se conservan como datos, incluso cuando no tienen un nombre español específico. Los once objetos actuales y todos los controles/tutoriales tienen textos propios completos en es_MX/en_US.

Disponibilidad:

| Marca | Significado actual |
|---|---|
| Disponible y funcional (nativo) | Materiales/mesa/etiqueta y receta ya provistos por Minecraft; no son una certificación de nuestro add-on |
| Disponible parcialmente | Bloques, objetos y once recetas del add-on presentes en código/JSON; integración en juego aún no verificada |
| Próximamente | Referencia Java; no se registra ni se ejecuta como receta Bedrock |

Ninguna de las 1.884 recetas Java se ha agregado como receta fabricable. Incluso una receta Java que produce un objeto también llamado eje permanece separada del eje Bedrock y de su receta propia. No se inventan ingredientes/resultados de serializadores especiales; se indica que el modelo es parcial y se ofrece el JSON técnico completo.

## API estable verificada

Se mantienen @minecraft/server **2.11.0** y @minecraft/server-ui **2.3.0**, fijados en lockfile y manifiesto. Se revisaron los tipos instalados y las fuentes oficiales de documentación del SHA MicrosoftDocs `1ee68c332206196f4fa177c32b55a0f5dad54354`:

- [ActionFormData](https://github.com/MicrosoftDocs/minecraft-creator/blob/1ee68c332206196f4fa177c32b55a0f5dad54354/creator/ScriptAPI/minecraft/server-ui/ActionFormData.md): title/body/button, iconPath, show.
- [ModalFormData](https://github.com/MicrosoftDocs/minecraft-creator/blob/1ee68c332206196f4fa177c32b55a0f5dad54354/creator/ScriptAPI/minecraft/server-ui/ModalFormData.md): textField, dropdown, submitButton, show y sus respuestas.
- [CustomForm](https://github.com/MicrosoftDocs/minecraft-creator/blob/1ee68c332206196f4fa177c32b55a0f5dad54354/creator/ScriptAPI/minecraft/server-ui/CustomForm.md): image(src, pack, options), label, button, isShowing, close y show para ilustraciones ampliadas. El identificador del RP se toma de su manifiesto.

No se incorporaron APIs beta, UI JSON de reemplazo ni stubs de @minecraft. Los mensajes se envían como traducciones RawMessage/UIRawMessage compatibles con las firmas instaladas; la búsqueda no necesita averiguar el idioma privado del cliente porque indexa ambos idiomas. La compilación estricta verifica las firmas; su comportamiento visual y admisión por Realms siguen pendientes de prueba.

## Tutoriales e ilustraciones

Tres tutoriales, doce pasos en total:

1. Primera red: fabricar materiales, orientar rueda, construir caída de agua, tender ejes, engranar grande→pequeño y medir salida.
2. Sobrecarga: conectar medidor/freno, exigir 1024 SU con capacidad de 256 y recuperar la red.
3. Separación: observar una red en marcha, romper un puente y volver a conectar.

Cada paso usa datos estructurados, fichas relacionadas e imágenes originales. Se presentan miniaturas en botones y una ilustración ampliada mediante CustomForm.image. Las ocho imágenes nuevas (seis esquemas, icono genérico de referencia y mesa) se conservan con fuente/hash en assets_source. No son capturas ni transformaciones de arte Java.

Comprobar mira **un bloque real a hasta seis bloques**, valida su ID y consulta el estado del grafo del servidor. Donde corresponde exige RPM exactas o demanda/capacidad exactas, no un texto de éxito predeterminado. Un grafo pending, un bloque diferente o una proporción equivocada no aprueban. Se comprueba el bloque observado, no la totalidad de una fábrica ni la autoría del jugador. Los pasos son navegables sin aprobarlos; no es un sistema de misiones y no se guarda progreso permanente.

El manual **no coloca bloques ni ejecuta comandos**. Explica cómo construir la escena y, para un mundo de prueba vacío y respaldado, muestra el comando existente `/function bedrockworks/kinetic_demo` con sus límites de volumen. Su ejecución queda a elección explícita del jugador. No hay Ponder tridimensional ni simulación holográfica prometida: son formularios, ilustraciones y comprobaciones sobre el mundo.

## Validaciones y pruebas

`npm run build` regenera datos, compila y valida; `npm test` añade las pruebas Node. `tools/validate-guide.mjs` comprueba:

- Ingredientes/productos declarados; IDs Bedrock existentes mediante registros del pack y vanilla-data 1.26.60; tags nativos explícitamente permitidos.
- Recetas, objetos, categorías, procesos, estaciones y tutoriales sin IDs duplicados.
- Referencias a ingredientes, máquinas, tags, pasos e imágenes; UUID del RP y traducciones de cada campo.
- Correspondencia exacta del JSON técnico nativo y de sus cantidades normalizadas con el BP.
- Correspondencia de referencias Java con la instantánea y su commit; ninguna promoción a fabricable.
- Recetas funcionales con máquina implementada y evidencia cuando el contenido es personalizado; una mesa vanilla no convierte automáticamente un objeto propio en probado.

Las pruebas añaden búsqueda bilingüe, filtros, cantidades, alternativas/usos, pesos de secuencias, fluidos, renderizado lógico de todas las fichas/recetas, historial, comprobaciones de tutorial y sesiones simultáneas/obsoletas. Se conservan todos los tests cinéticos y la demostración Node.

Pendiente en juego: disparo real de ambos eventos del libro, receta y consumo, formas/ilustraciones/idiomas, navegación cancelada o con chat abierto, dos jugadores, desconexión, carga de catálogo y rendimiento en Realm. Ver PRUEBAS_MANUALES.md. No describir las pruebas Node como ejecución de la interfaz Minecraft.

## Evidencia de entrega

- `npm run package`: **72 pruebas Node aprobadas**, cero fallos y cero omitidas; compilación estricta y validación del catálogo incluidas.
- `python3 -m unittest discover -s tests -v`: **2 pruebas Python aprobadas**.
- `npm run demo`: regresión cinética confirmada en Node, rueda +8 RPM, salida −16 RPM y 128/256 SU.
- Catálogo final: **1.864 fichas** (objetos/materiales, tags y conceptos de referencia), **1.896 recetas** (once JSON del add-on, una receta nativa y 1.884 referencias Java), **27 entradas de procesos** (25 con JSON y dos tipos registrados sin lista fija), tres tutoriales/doce pasos. Traducciones: **2.184 claves por locale** contando las heredadas.
- Reextracción del tag exacto produjo la misma instantánea técnica: SHA-256 `2f98a8ac41ba78dbc08deb8ecbe0d199f8c23b3b2908c48477c91940f28f039e`.
- Se comprobó generación con locale de proceso ASCII y sin modo UTF-8 implícito: los lectores/escritores nuevos declaran UTF-8; TypeScript fija LF. Esto verifica esa condición de codificación, no una ejecución Windows.
- Dos compilaciones/empaquetados consecutivos produjeron el mismo archivo de **387.171 bytes**, SHA-256 `b2ffcebf2961e2017d4ca8deacbbaad17ddd414257b0f0eeeca9fea73823419d`.
- ZIP/CRC verificado: BP 64 archivos y RP 70, UUID conservados, once recetas nativas propias y aviso MIT incluido. Los **ocho JavaScript de cinética** empaquetados coinciden byte por byte con 0.2.0.
- Artefacto: `dist/create-bedrock-dev-0.3.0.mcaddon`; informe: `dist/validation-0.3.0.json`. No se publicó el entorno ni una release pública.

Las comprobaciones del tutorial usan también el eje nativo cuando el paso exige una orientación. Ninguna prueba anterior valida aún la apertura, presentación o rendimiento de la interfaz dentro de Minecraft/Realms; esas comprobaciones siguen pendientes en PRUEBAS_MANUALES.md.


## Actualización de fábrica 0.4.1

Prensa y embudo filtrado implementados en código con pruebas Node; integración Minecraft/Realms pendiente. Tres procesos de láminas, barriles nativos, inventarios conservadores y tutorial de supervivencia sin comandos. Ocho máquinas restantes pendientes. La descripción actual y las diferencias Java/Bedrock de esta vertical están en [FABRICA.md](FABRICA.md); las indicaciones anteriores sin procesamiento describen hitos previos.
