# Primera fábrica — incrementos 0.4.0 y 0.4.1

Estado: código y adaptadores compilados; pruebas Node aprobadas. **No se ha ejecutado Minecraft Windows ni Realms.** La aceptación dentro del juego sigue pendiente. No se marca ninguna receta nueva como verificada en el motor. No se publica un release.

## Alcance entregado

0.4.0 incorpora prensa, lámina de hierro, receta, motor de procesos y barril inferior. Build conservado por separado y 87 pruebas Node aprobadas. 0.4.1 añade láminas de cobre/oro, dos recetas de prensado, embudo filtrado, integración con el manual, tutorial de fábrica y demostración Node; 95 pruebas Node. No son diez máquinas decorativas: solo se registran los componentes con comportamiento implementado.

`src/machines/processor.ts` implementa trabajo y conservación de materiales. `src/machines/runtime.ts` adapta el motor al mundo. `src/recipes/` y `data/processing/` definen máquina, entradas, salidas, duración, velocidad y calor. `src/logistics/` implementa traslados filtrados. `src/multiplayer/inventory-locks.ts` comparte exclusión síncrona entre procesos y traslados. Los sistemas cinético y del manual anteriores permanecen activos.

## Fuente y diferencias con Java

Fuente exclusiva: Create Java 6.0.10 / Minecraft 1.21.1, tag `mc1.21.1-6.0.10`, commit `ac0c444d9828da3453ae8cc65338e8de063286fb`. Clases bajo `src/main/java/com/simibubi/create/content/` en ese commit. [Repositorio fijado](https://github.com/Creators-of-Create/Create/tree/ac0c444d9828da3453ae8cc65338e8de063286fb).

| Componente | Fuente consultada (relativa a content/) | Comportamiento Java y situación Bedrock |
|---|---|---|
| Prensa | kinetics/press/MechanicalPressBlockEntity.java y PressingBehaviour.java | Prensado en mundo/cinta y compactado en cuenco. Se implementa prensado en barril inferior, eje X/Z, impacto 8 SU/RPM; no cuenco, cinta ni ítems caídos. |
| Mezcladora | kinetics/mixer/MechanicalMixerBlockEntity.java | Cuenco, ingredientes y condiciones de recetas/temperatura. Pendiente: reserva conjunta de entradas, fluidos y salida. |
| Trituradoras | kinetics/crusher/CrushingWheelBlockEntity.java y CrushingWheelControllerBlockEntity.java | Pareja con controlador, trituración y alternativas de molienda. Pendiente: pareja válida y resultados múltiples/probabilísticos sin duplicación. |
| Molino | kinetics/millstone/MillstoneBlockEntity.java | Entrada e inventario de salidas, recetas y resultados probabilísticos. Pendiente: plan de salidas múltiples y capacidad antes de consumir. |
| Ventilador | kinetics/fan/EncasedFanBlockEntity.java y AirCurrent.java | Corriente según giro, alcance y obstrucciones; procesamiento contextual. Pendiente: corriente acotada, condiciones y reservas de procesos. |
| Sierra | kinetics/saw/SawBlockEntity.java | Corte de recetas y bloques/árboles. Pendiente: modo estacionario y después protección/loot de bloques. |
| Taladro | kinetics/drill/DrillBlockEntity.java y kinetics/base/BlockBreakingKineticBlockEntity.java | Rotura frontal dependiente de velocidad y dureza. Pendiente: permisos/protecciones, loot y entrega segura en Bedrock. |
| Cinta | kinetics/belt/transport/BeltInventory.java | TransportedItemStack, separación y retención durante procesamiento. Pendiente: inventario persistente por tramo y cruces; no se usan entidades de objeto como sustituto. |
| Embudo | logistics/funnel/FunnelBlockEntity.java | Inserción/extracción con inventarios y filtros. Implementado parcialmente: solo barriles horizontales a ambos lados, modos lingotes/láminas, pilas completas, sin mezclar, sin redstone ni filtros arbitrarios. No consume energía. |
| Depósito | logistics/depot/DepotBlockEntity.java | Pila transportada expuesta y procesamiento. Pendiente: no se presenta el barril nativo como depósito propio. |

La prensa usa `CYCLE=240` y avance `floor(1 + 59 × min(1, abs(RPM)/512))` de PressingBehaviour; máximo admitido por nuestro motor 256 RPM. Java aplica resultados a mitad del golpe; aquí al completar el trabajo para reducir escrituras y estados ambiguos. Cada lingote cuesta 240 unidades. Una pila de N lingotes requiere 240×N y se reemplaza completa al final, por igual número de láminas. No reproduce el prensado simultáneo de pilas de Java. A 8 RPM, un lingote requiere 240 visitas (~12 segundos a 20 TPS con una fábrica pequeña). Las máquinas grandes comparten presupuesto: no se promete ese tiempo bajo carga.

Recetas técnicas consultadas: `src/generated/resources/data/create/recipe/pressing/{iron_ingot,copper_ingot,gold_ingot}.json`: un lingote → una lámina. Bedrock admite estos tres identificadores nativos concretos; no expande tags de otros mods. Sus salidas son originales `bedrockworks:{iron_sheet,copper_sheet,golden_sheet}`. La fabricación de los bloques es original del add-on: prensa = bloque de hierro + eje + pistón + tablones de roble; embudo = tolva + cobre + redstone. El manual genera cantidades/ingredientes desde sus definiciones reales.

Se consultó código/datos técnicos bajo MIT conservando avisos; no se copió arte Java. PNG, geometrías, ram animado y compuerta de dos poses son originales, con generadores y procedencia en `assets_source/`. El sonido mecánico original existente se conserva; no se extraen sonidos del mod.

## Inventarios y fallos

Los ingredientes permanecen en un slot real de un barril vanilla. El motor solo acepta pilas simples, sin nombres, lore o propiedades personalizadas. Un cambio de tipo/cantidad reinicia el trabajo. No escribe en inventarios de jugadores. Verifica estado energético y pila otra vez antes de una única `Container.setItem` de salida. Entrada y salida comparten slot; no hay una etapa de retirar ingredientes y después crear ítems en otra entidad.

El registro persistente guarda fase, receta, slot, entrada esperada y trabajo; **no posee objetos ni salidas pendientes**. Se guarda `committing` antes del reemplazo. Recuperar una operación ambigua descarta su progreso; nunca vuelve a producir ni restaura una copia de ingredientes. Esto puede costar tiempo tras un fallo, incluso con entrada idéntica repuesta, sin reutilizar trabajo completado. Romper la prensa borra solo su progreso: el barril y sus objetos pertenecen al motor nativo.

El embudo llama una sola vez a `Container.moveItem` hacia un slot vacío y nunca implementa traslado mediante copiar y borrar en JavaScript. Usa la misma clave de exclusión del barril que la prensa. No mezcla pilas, ni mueve ítems desconocidos o personalizados. Destino lleno: no hay extracción. Error después de mover: no hay compensación que duplique. Estos contratos se compilan contra tipos estables `@minecraft/server` 2.11.0 instalados. La API pública no expone una transacción ACID multiinventario; no se promete durabilidad ante cortes de energía o rollback externo de mundos. Comportamiento nativo y coordinación con jugadores/tolvas/otros add-ons requieren la prueba real.

## Autoridad y presupuesto

Todo el trabajo sucede en el servidor del mundo. Ningún formulario ni cliente decide producción. Callbacks de bloques descubren posiciones; no hay búsqueda global. La prensa visita como máximo ocho posiciones distintas por tick y tiene presupuesto blando de 3 ms. El embudo visita como máximo ocho cada 20 ticks, presupuesto blando 2 ms. Cada operación examina hasta cuatro slots por lado; los cursores continúan en visitas posteriores. Los límites temporales no interrumpen una llamada nativa ya iniciada.

Sin energía, red pendiente, sobrecarga o chunk no disponible no se produce. Las posiciones descargadas salen de la caché activa; el onTick del bloque permite redescubrirlas al cargar. No hay producción fuera de línea ni compensación de ticks omitidos. Los objetos están siempre en contenedores nativos; el progreso se conserva como propiedad dinámica. Un barril reemplazado durante descarga puede reiniciar o reutilizar tiempo parcial si vuelve a tener una entrada indistinguible: el registro no reconoce identidades persistentes de contenedores; nunca contiene una reclamación de salida adicional. Eliminar/reponer una prensa cargada descarta el registro. Los visuales cinéticos conservan el tope global previo de 256: producción no depende de ver una animación.

## Aceptación reproducible sin comandos

Fabrica el Manual de Ingeniería Mecánica con libro+cobre. Abre Tutoriales → Primera fábrica de láminas sin comandos. Obtén hierro, cobre, redstone, madera y demás ingredientes mediante supervivencia; consulta las recetas reales del libro. No uses la fuente creativa/de desarrollo.

1. Reserva una zona y toma posiciones relativas. Prensa en `(0,2,0)`, barril de proceso en `(0,1,0)`; ejes en `(1,2,0)`, `(2,2,0)` y rueda en `(3,2,0)`, todos con eje X. Gira la prensa agachándote e interactuando: solo X/Z.
2. Haz caer agua en `(3,2,1)` con agua inmediatamente arriba `(3,3,1)`, mediante un canal contenido. No sirve agua quieta: se conserva la condición hidráulica documentada en CINETICA.md. Confirma la prensa a 8 RPM con el tutorial; su demanda es 64 SU sobre 256 SU disponibles.
3. A Y=1,Z=0 coloca barril de entrada X=2, embudo X=1, barril de proceso X=0, embudo X=-1 y barril de salida X=-2. Ambos embudos apuntan al oeste. **Mano vacía**, agacharse+interactuar gira, interacción normal cambia modo y muestra modo/dirección. X=1 debe ser entrada; X=-1 salida.
4. Coloca un único lingote de hierro en entrada y espera transporte+240 visitas. Debe aparecer exactamente una lámina en salida. Repite con cobre y oro. Guarda conteos antes/después. El tutorial comprueba colocación/energía; recoger productos se verifica manualmente.
5. Interrumpe energía a mitad, espera y confirma que la entrada no desaparece; reconecta. Repite con sobrecarga, barril lleno, pila cambiada, romper prensa y barril, guardar/cerrar/reabrir, salir/entrar en chunks y dos jugadores interactuando. No añadir a la pila activa salvo al probar reinicio de trabajo.
6. Comprueba animación del ram durante trabajo, pausa sin energía y compuerta de embudo al trasladar; es_MX/en_US, recetas y navegación del manual; Content Log sin errores. Repite en copia respaldada de Realm con dos cuentas.

Ninguna de estas comprobaciones se declara aprobada dentro de Minecraft. El build se entrega para realizarlas. El paso siguiente es cerrar esta aceptación nativa y ampliar el backend para salidas múltiples antes de molino/mezcladora; las ocho máquinas pendientes no se anuncian fabricables.

## Reproducir pruebas y builds

`npm ci --ignore-scripts`, `npm test`, `npm run demo:factory`, `python3 -m unittest discover -s tests -v`, `python3 tools/package_addon.py`. La demostración Node utiliza el controlador cinético real, agua simulada y los mismos procesadores/traslados: 8 RPM, 64/256 SU, dos láminas de hierro, una de cobre y una de oro. **No ejecuta Minecraft.**

La entrega conserva `dist/create-bedrock-dev-0.4.0.mcaddon` y genera `dist/create-bedrock-dev-0.4.1.mcaddon`, con SHA-256 junto a cada archivo. Los validadores cubren JSON, UUID/API, identificadores, modelos/texturas/animaciones, huesos, traducciones, procedencia y catálogo. Las pruebas nuevas cubren relaciones con el grafo, sobrecarga, duración, lotes, persistencia, recuperación ambigua, concurrencia síncrona, metadatos, salida llena, escaneo acotado y flujo de fábrica. Las regresiones anteriores se mantienen.
