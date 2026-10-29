# Recetas y procesos — revisión 0.3.0

Se extrajeron **1.884 JSON técnicos de recetas**, **25 tipos materializados**, del tag exacto `mc1.21.1-6.0.10`, SHA `ac0c444d9828da3453ae8cc65338e8de063286fb`, para Java 1.21.1. Se inspeccionaron AllRecipeTypes, proveedores de datagen y clases de reglas dinámicas del mismo commit. No se copió arte ni localización de `src/main/resources/assets/`.

La instantánea `data/reference/create-6.0.10-recipes.json` conserva por receta ID, tipo, ruta, SHA-256 de archivo y JSON técnico sin modificar, además de tags disponibles, clases proveedoras, serializadores registrados y ocho familias dinámicas con fuente y hash. `tools/extract_create_recipes.py` solo acepta el commit exacto sin cambios y recorre `src/generated/resources/data/*/recipe` y `src/main/resources/data/*/recipe`. Un ID duplicado detiene la extracción para revisar sobrescrituras. No se usa una rama posterior.

El LICENSE.md exacto asigna MIT a estos archivos fuera de assets; se conserva aviso completo dentro del BP y en licenses/. No se atribuye esa licencia a dependencias, arte de Create o recursos de otros mods.

## Conteos materiales por tipo

| Tipo técnico | JSON |
|---|---|
| create:compacting | 7 |
| create:crushing | 211 |
| create:cutting | 32 |
| create:deploying | 167 |
| create:emptying | 5 |
| create:filling | 19 |
| create:haunting | 22 |
| create:item_application | 8 |
| create:item_copying | 1 |
| create:mechanical_crafting | 4 |
| create:milling | 246 |
| create:mixing | 14 |
| create:pressing | 43 |
| create:sandpaper_polishing | 1 |
| create:sequenced_assembly | 3 |
| create:splashing | 52 |
| create:toolbox_dyeing | 1 |
| minecraft:blasting | 27 |
| minecraft:campfire_cooking | 1 |
| minecraft:crafting_shaped | 375 |
| minecraft:crafting_shapeless | 274 |
| minecraft:smelting | 37 |
| minecraft:smithing_transform | 6 |
| minecraft:smoking | 1 |
| minecraft:stonecutting | 327 |

Crafting con/sin patrón, mechanical crafting, mixing, pressing, crushing, milling, washing (splashing), smoking, blasting, compacting, cutting, deploying, filling, emptying y sequenced assembly están presentes. También se detectaron smelting, stonecutting, smithing_transform, campfire_cooking, haunting, sandpaper_polishing, item_application, item_copying y toolbox_dyeing. El menú traduce sus nombres y conserva sus identificadores. Basin y conversion también están registrados en AllRecipeTypes, aunque no tienen JSON materializados aquí: se muestran como familias sin recetas fijas, no como procesos Bedrock disponibles.

## Cobertura dinámica y límite real

**No se afirma haber enumerado todas las recetas de un mundo Java en ejecución.** Se estudiaron estas familias, registradas por separado sin inventar ingredientes ni cantidades fijas:

| Familia | Clase relativa a src/main/java/com/simibubi/create/ | Hallazgo |
|---|---|---|
| Ventilador smoking/blasting | content/kinetics/fan/processing/AllFanProcessingTypes.java | Consulta registros del mundo; blasting resuelve smelting/blasting y considera resultado smoking; exclusión manual_only |
| Shapeless en cuenco | content/processing/basin/BasinRecipe.java | Convierte recetas aptas, dependientes del registro actual |
| Pociones mezcladas | content/fluids/potion/PotionMixingRecipes.java | Combina envases y registros de pociones/mezclas vanilla y de mods; fluidos 1000 mB y calor HEATED |
| Llenado genérico | content/fluids/transfer/GenericItemFilling.java | Botellas y capacidades válidas; la cantidad depende del recipiente y fluido |
| Vaciado genérico | content/fluids/transfer/GenericItemEmptying.java | Pociones, recetas explícitas y capacidades; drenado hasta 1000 mB en la ruta genérica |
| Teñido de cajas | content/equipment/toolbox/ToolboxDyeingRecipe.java | Una caja y un tinte, conservando componentes; serializador especial |
| Copiado | foundation/recipe/ItemCopyingRecipe.java | Fuente y destinos compatibles según componentes; serializador especial |
| Conversiones JEI | compat/jei/ConversionRecipe.java | Relaciones visuales; matches devuelve false, no son recetas fabricables |

Para expandir registros dinámicos se necesita ejecutar/configurar Java 1.21.1 y sus registros, tags, datapacks y mods; las capacidades pueden admitir objetos con componentes arbitrarios. No se ejecutó ese mundo ni datagen durante esta entrega. Los JSON ya generados se extrajeron íntegros. Las definiciones de tags del repositorio no incluyen necesariamente todos los miembros vanilla o aportados por otras dependencias. Las condiciones neoforge:conditions permanecen intactas; una receta condicional no se presenta como siempre activa.

## Semántica preservada

El modelo normalizado separa cantidad de objetos y mB Java, alternativas de ingredientes, tags de objetos y fluidos, catalizadores keep_held_item, resultados, probabilidades independientes, pesos del pool secuenciado, loops y pasos, calor, tiempo, componentes de fluidos y condiciones de carga. Se conserva el JSON completo para no perder restricciones de componentes/serializadores no expandidos.

En precision_mechanism el valor 120 es **peso**, no 120% ni 12000%. Los pesos faltantes usan el valor predeterminado de la secuencia; el JSON original sigue disponible. Los selectores no interpretados y los dos serializadores especiales se marcan parciales; no se inventa una receta vacía fabricable.

## Recetas Bedrock y manual

Las **once recetas del BP** siguen siendo originales del add-on y se generan en el catálogo directamente desde sus JSON. Se añade como referencia funcional nativa la receta ya existente de la mesa de trabajo (cuatro tablones, patrón 2×2), contrastada con las muestras oficiales 1.26.60.5, sin añadir otra receta al pack. Total mostrado: **1.896 recetas**, de las cuales **1.884 son Java no fabricables**, once son definiciones propias con verificación de juego pendiente y una es nativa.

No se promueve una receta por aparecer en el catálogo. La fabricación de cada bloque propio sigue requiriendo importar el pack y verificar su receta en Minecraft. Las estaciones de procesamiento de Java todavía no están implementadas. Véanse MANUAL.md para navegación y CINETICA.md para reglas actuales.

Reproducir extracción: `python3 tools/extract_create_recipes.py /ruta/al/checkout/exacto`. Compilar catálogo local sin red: `npm run build`. La referencia es una instantánea técnica del repositorio, no un paquete Java ni una copia de sus texturas.


Los serializadores del mismo SHA confirman `processing_time`, `heat_requirement`, `keep_held_item` y `accept_mirrored` (snake_case). Se comprobaron 489 tiempos, seis requisitos de calor y 165 herramientas/catalizadores conservados. ProcessingOutput.rollOutput tira por cada unidad; los pesos de secuencias son otra semántica. SequencedAssemblyRecipeSerializer declara loops predeterminado 1 en el codec aunque el constructor tenga otro valor inicial: se usa el codec, no una suposición de otra versión.

La asociación de fabricación distingue aplicación manual sobre bloque, herramientas como lija y líneas secuenciadas con una estación por paso. No se atribuye item_application a la mesa ni todo sequenced_assembly a un desplegador; campfire_cooking usa fogata. Las dos fichas conceptuales de acción/línea están marcadas como referencias, no como bloques futuros fabricables.


## Actualización de fábrica 0.4.1

Prensa y embudo filtrado implementados en código con pruebas Node; integración Minecraft/Realms pendiente. Tres procesos de láminas, barriles nativos, inventarios conservadores y tutorial de supervivencia sin comandos. Ocho máquinas restantes pendientes. La descripción actual y las diferencias Java/Bedrock de esta vertical están en [FABRICA.md](FABRICA.md); las indicaciones anteriores sin procesamiento describen hitos previos.
