# Inventario preliminar de Create

**No es un inventario exhaustivo de Create 6.0.10.** En 0.2.0 se verificó el tag mc1.21.1-6.0.10 y SHA ac0c444d9828da3453ae8cc65338e8de063286fb para el subconjunto cinético; el listado integral sigue pendiente. Las filas son familias candidatas para investigación y diseño; su pertenencia, nombres, cantidades y semántica en esa versión están pendientes. No se mezclaron fuentes de otras ramas: solo se consultó el tag exacto para este subconjunto.

Las rutas/clases siguientes son pistas de búsqueda recordadas, **no citas de archivos inspeccionados**. No se afirma que existan con ese nombre en la versión objetivo. El origen exacto debe registrarse como ruta, clase/registro, ID y enlace con SHA antes de confirmar cada entrada. Fuente estructurada local: `config/inventory.json`.

P0: base y primera vertical; P1: producción y transporte; P2: automatización avanzada; P3: investigación posterior. La tabla por familias se conserva como planificación del alcance completo. El estado vigente del subconjunto implementado está en la tabla individual siguiente y en CINETICA.md; todavía no hay pruebas dentro de Minecraft.

| ID | Familia candidata | Comportamiento esperado a comprobar | Clase/archivo candidato, sin verificar | Dependencias | Prioridad | Complejidad | Estado | Implementación prevista |
|---|---|---|---|---|---|---|---|---|
| K01 | Ejes, engranajes pequeños/grandes, cajas de engranajes | Transmisión, orientación, relación y signo de rotación | kinetics; Shaft, CogWheel, Gearbox | grafo y orientación | P0 | Alta | Propuesta; no implementada | Bloques estáticos con estado lógico de red |
| K02 | Manivela, rueda hidráulica, rueda grande, molino | Generación cinética y capacidad según condiciones | kinetics; HandCrank, WaterWheel, WindmillBearing | fuentes; mundo y fluidos | P0 | Alta | Propuesta; no implementada | Fuentes lógicas; criterios físicos simplificados y documentados |
| K03 | Embrague, cambio de sentido, controlador de velocidad, transmisión secuenciada | Conmutar y regular redes | kinetics; Clutch, Gearshift, SpeedController, SequencedGearshift | grafo; redstone | P1 | Alta | Propuesta; no implementada | Máquinas de estados; verificar lectura de redstone estable |
| K04 | Medidores de velocidad/esfuerzo y gafas | Diagnóstico de red y sobrecarga | kinetics; SpeedGauge, StressGauge; goggles | red; UI | P0 | Media | Propuesta; no implementada | Lectura autoritativa mediante interacción y manual |
| K05 | Caldera, motor de vapor, tanque y quemador | Producción energética de nivel superior | kinetics/steamEngine; fluids; blazeBurner | calor; agua; combustible | P2 | Muy alta | Propuesta; no implementada | Modelo discreto de calor, agua y capacidad |
| P01 | Prensa, depósito y cuenco | Prensado y compactación | kinetics/press; processing/basin | recetas; inventario; red | P0 | Alta | Propuesta; no implementada | Un trabajo transaccional con entradas reservadas |
| P02 | Molino y ruedas trituradoras | Molienda y trituración con resultados probabilísticos | kinetics/millstone; kinetics/crusher | recetas; RNG; inventario | P1 | Alta | Propuesta; no implementada | Procesamiento en estaciones fijas |
| P03 | Mezclador y quemador | Mezcla con requisitos térmicos | kinetics/mixer; processing/burner | cuenco; calor; fluidos | P1 | Alta | Propuesta; no implementada | Recetas explícitas y tanque lógico |
| P04 | Ventilador y boquilla de aire | Lavado, ahumado, cocción y exposición al aire | kinetics/fan | consulta espacial; fuego; agua | P1 | Alta | Propuesta; no implementada | Volumen acotado, sin física de fluidos Java |
| P05 | Surtidor y drenaje de objetos | Llenar y vaciar recipientes | fluids/spout; fluids/itemDrain | fluidos; recetas; inventarios | P1 | Alta | Propuesta; no implementada | Transferencia discreta y recipientes autorizados |
| P06 | Desplegador y ensamblaje secuenciado | Uso de herramientas y cadenas de procesos | kinetics/deployer; processing/sequenced | permisos; recetas; herramientas | P2 | Muy alta | Propuesta; no implementada | Acciones limitadas por lista; sin jugador falso Java |
| P07 | Crafteadores mecánicos | Ensamblaje de patrones grandes | kinetics/crafter | inventario; patrones; red | P2 | Alta | Propuesta; no implementada | Resolución de patrón lógico |
| P08 | Taladro, sierra, cosechadora, arado y colocador | Romper, cortar, cosechar y colocar con reglas | kinetics/drill; saw; contraptions/actors | loot; protección; mundo | P2 | Muy alta | Propuesta; no implementada | Primero variantes estáticas y acciones autorizadas |
| T01 | Cintas, embudos, túneles, tolvas y conductos | Mover y filtrar objetos | kinetics/belt; logistics/funnel; tunnel; chute | inventarios; rutas; filtros | P1 | Muy alta | Propuesta; no implementada | Paquetes lógicos y visualización acotada |
| T02 | Filtros, filtros de atributos, almacenamiento y bóvedas | Seleccionar objetos y ampliar almacenamiento | logistics/filter; vault | identidad de stack; persistencia | P1 | Alta | Propuesta; no implementada | Contenedores soportados o almacenamiento lógico persistente |
| T03 | Brazos mecánicos e interfaces portátiles | Transferencias dirigidas e intercambio con estructuras | kinetics/mechanicalArm; contraptions/actors/psi | rutas; animación; contraptions | P2 | Muy alta | Propuesta; no implementada | Brazos visuales y transferencias entre puntos registrados |
| T04 | Tuberías, bombas, válvulas, tanques, polea de manguera y desagüe | Transportar, almacenar y extraer fluidos | fluids | red de fluidos; mundo | P2 | Muy alta | Propuesta; no implementada | Fluidos virtuales; nunca asumir API de fluido arbitrario |
| L01 | Observadores, comparadores de stock, enlaces y controles redstone | Automatización por señales y niveles | logistics; redstone | eventos; límites temporales | P1 | Alta | Propuesta; no implementada | Sondeo acotado y estados; sin garantía de timings Java |
| L02 | Paquetes, empaquetadores, solicitudes, enlaces de stock y logística avanzada | Pedidos y distribución de materiales | logistics; package/stock — pertenencia a 6.0.10 pendiente | transacciones; destinos; UI | P3 | Muy alta | Propuesta; no implementada | Sistema propio solo si se confirma inventario de la versión |
| C01 | Pegamento, chasis, rodamientos, pistones y poleas | Ensamblar y mover estructuras | contraptions; chassis; bearing; piston; pulley | bloques; colisiones; NBT; actores | P3 | Extrema | Propuesta; no implementada | Representación limitada por entidades o movimiento discreto |
| C02 | Contraptions montadas en vagoneta y ascensores | Transporte móvil de bloques y actores | contraptions/mounted; elevator | movimiento; pasajeros; chunks | P3 | Extrema | Propuesta; no implementada | Prototipo independiente antes de prometer soporte |
| R01 | Rieles, bogies, trenes, estaciones, señales y horarios | Ruteo, pasajeros, colisiones y automatización ferroviaria | trains | grafo global; chunks; entidades | P3 | Extrema | Propuesta; no implementada | Tren lógico en rutas cargadas; paridad completa no prometida |
| M01 | Andesita, aleaciones, zinc, cobre, latón, chapas y pepitas | Progresión material y piezas intermedias | AllItems; AllBlocks; datagen | recetas; mundo; loot | P0 | Media | Propuesta; no implementada | IDs propios; obtención y cantidades por auditar |
| M02 | Mecanismos de precisión, piezas incompletas y herramientas | Progresión de ensamblaje, llave, herramientas de construcción | AllItems; processing; equipment | recetas; durabilidad; UI | P1 | Alta | Propuesta; no implementada | Objetos y estados propios; sin copiar sprites |
| D01 | Carcasas, andamios, ventanas, puertas, vías decorativas y variantes | Construcción y acabados | AllBlocks; palettes | geometrías; estados; loot | P3 | Media | Propuesta; no implementada | Recursos originales; detrás de los sistemas de supervivencia |
| U01 | Manual, recetas, escenas tutoriales y avances | Enseñar operación y progresión | ponder; advancements — localización por comprobar | UI; catálogo; traducciones | P0 | Alta | Propuesta; no implementada | Manual original con formularios y tutoriales paso a paso |
| X01 | Otros bloques, objetos, entidades, sonidos, tags, worldgen e integraciones | Cerrar cobertura sin omisiones | Todos los registros y proveedores datagen del commit verificado | auditoría upstream | P0 | Alta | Propuesta; no implementada | Desglosar cada ID y variante tras acceder a fuentes |

## Cierre de cobertura pendiente

Cada bloque, objeto, material, máquina, receta, proceso, mecanismo y sistema deberá tener una entrada individual: `upstream_id`, tipo de registro, variante, SHA, clase y archivo, comportamiento, dependencias, prioridad, complejidad, estado de evidencia, estrategia Bedrock y pruebas. Las familias no sustituyen ese desglose. Separar registros reales de tags y alias; distinguir items de bloques con forma de item y no contarlos dos veces sin explicarlo.

Inspeccionar registros centrales (candidatos `AllBlocks`, `AllItems`, `AllEntityTypes`, `AllRecipeTypes`), registro indirecto con builders, datagen, registros condicionales, recetas generadas, loot, worldgen y recursos. Confirmar también incompatibilidades y funciones retiradas. Contrastar conteos por categoría contra los registros y recursos generados del commit exacto. La herramienta de auditoría local ayuda a listar archivos; no certifica cobertura semántica.


## Subconjunto cinético 0.2.0 — orígenes comprobados

Todas las rutas parten de `src/main/java/com/simibubi/create/content/kinetics/` del SHA ac0c444d9828da3453ae8cc65338e8de063286fb; véanse enlaces permanentes en CINETICA.md. Prioridad P0; estado común: **código y pruebas Node, integración de motor sin verificar**.

| ID Bedrock | Clase/archivo Java comprobado | Comportamiento / dependencias | Complejidad | Implementación |
|---|---|---|---|---|
| shaft | simpleRelays/ShaftBlock.java; RotationPropagator.java | Eje, dos puertos; grafo/orientación | Alta | Ratio 1:1 |
| gear | simpleRelays/CogWheelBlock.java; RotationPropagator.java | Pequeño, vecino coplanar; grafo | Alta | Inversión y puertos axiales |
| large_gear | simpleRelays/CogWheelBlock.java; RotationPropagator.java | Grande, diagonales; grafo | Alta | Ratios -2/-0.5 y perpendiculares |
| gearbox | gearbox/GearboxBlock.java; GearboxBlockEntity.java; RotationPropagator.java | Cuatro puertos; marco de entrada/salida | Alta | Signo por puertos, eje bloqueado |
| water_wheel | waterwheel/WaterWheelBlockEntity.java; AllBlocks.java (registro fuera de kinetics) | ±8 RPM; 32 SU/RPM; mundo/agua | Alta | Caída verificable, alternativa documentada al vector Java |
| test_source | No equivalente exacto requerido; fuente de desarrollo propia | Control por interacción; estados nativos | Media | RPM seleccionables, inicialmente apagada |
| speed_meter | gauge/SpeedGaugeBlockEntity.java; gauge/GaugeBlock.java | Lectura de red; UI/animación | Media | Aguja + barra de acción con datos del grafo |
| stress_meter | gauge/StressGaugeBlockEntity.java; gauge/GaugeBlock.java | Consumo/capacidad; red/animación | Alta | Medidor pasivo y freno de prueba opcional (extensión Bedrock) |

Ejes/engranajes/caja: implementación en src/kinetic/model.ts y network.ts. Fuentes y mundo: controller.ts, water.ts y runtime.ts. Recursos y recetas: archivos por ID en behavior_pack y resource_pack. El manual/gafas y otros elementos de las familias originales no deben marcarse completos por esta tabla.


Actualización U01 (0.3.0): Manual de Ingeniería Mecánica por datos, búsqueda, once categorías, usos/alternativas, imágenes y tres tutoriales implementados y probados lógicamente en Node. La referencia de recetas materializadas se extrajo completa del tag fijado, con familias dinámicas sin expandir. No implica implementación de Ponder ni validación de la interfaz en juego; véanse MANUAL.md y RECETAS.md.


## Actualización de fábrica 0.4.1

Prensa y embudo filtrado implementados en código con pruebas Node; integración Minecraft/Realms pendiente. Tres procesos de láminas, barriles nativos, inventarios conservadores y tutorial de supervivencia sin comandos. Ocho máquinas restantes pendientes. La descripción actual y las diferencias Java/Bedrock de esta vertical están en [FABRICA.md](FABRICA.md); las indicaciones anteriores sin procesamiento describen hitos previos.
