# Cinética 0.2.0 — implementación y límites

Estado: código TypeScript compilable, dominio y adaptador de lectura de mundo probados en Node; **no ejecutado en Minecraft Windows ni Realms**. No se publicó el entorno ni se creó otro proyecto. Se preservaron UUID e IDs anteriores y se incrementó la versión de ambos packs a 0.2.0.

## Referencia Java exacta

Se consultó el tag **mc1.21.1-6.0.10**, commit **ac0c444d9828da3453ae8cc65338e8de063286fb**. `gradle.properties:7` declara mod_version 6.0.10 y `:8` Minecraft 1.21.1. El checkout de referencia se conserva fuera del proyecto, en /tmp; no se empaqueta. Se leyeron README, comentarios/Javadoc, registros, clases cinéticas y LICENSE.md del mismo commit, sin usar una rama posterior ni documentación wiki sin versión para definir las reglas.

Enlaces permanentes, todos en ese SHA:

| Fuente | Evidencia utilizada |
|---|---|
| [LICENSE.md](https://github.com/Creators-of-Create/Create/blob/ac0c444d9828da3453ae8cc65338e8de063286fb/LICENSE.md) | Assets bajo src/main/resources/assets: All Rights Reserved; resto MIT |
| [RotationPropagator.java](https://github.com/Creators-of-Create/Create/blob/ac0c444d9828da3453ae8cc65338e8de063286fb/src/main/java/com/simibubi/create/content/kinetics/RotationPropagator.java#L34) | Conexión axial, engranajes, cambios de signo, gearbox, conflictos |
| [KineticNetwork.java](https://github.com/Creators-of-Create/Create/blob/ac0c444d9828da3453ae8cc65338e8de063286fb/src/main/java/com/simibubi/create/content/kinetics/KineticNetwork.java) | Capacidad y consumo multiplicados por velocidad absoluta |
| [WaterWheelBlockEntity.java](https://github.com/Creators-of-Create/Create/blob/ac0c444d9828da3453ae8cc65338e8de063286fb/src/main/java/com/simibubi/create/content/kinetics/waterwheel/WaterWheelBlockEntity.java#L118) | Score de flujo proyectado, producto con tangente, burbujas, generación sign(score) × 8 |
| [WaterWheelBlock.java](https://github.com/Creators-of-Create/Create/blob/ac0c444d9828da3453ae8cc65338e8de063286fb/src/main/java/com/simibubi/create/content/kinetics/waterwheel/WaterWheelBlock.java) | Puertos del eje y actualización por vecinos |
| [GearboxBlock.java](https://github.com/Creators-of-Create/Create/blob/ac0c444d9828da3453ae8cc65338e8de063286fb/src/main/java/com/simibubi/create/content/kinetics/gearbox/GearboxBlock.java) | Cuatro caras con eje distinto al eje bloqueado |
| [AllBlocks.java](https://github.com/Creators-of-Create/Create/blob/ac0c444d9828da3453ae8cc65338e8de063286fb/src/main/java/com/simibubi/create/AllBlocks.java#L572) | Rueda pequeña: capacidad base 32, velocidad 8; transmisiones y gauges sin impacto |
| [KineticBlockEntity.java](https://github.com/Creators-of-Create/Create/blob/ac0c444d9828da3453ae8cc65338e8de063286fb/src/main/java/com/simibubi/create/content/kinetics/base/KineticBlockEntity.java#L155) | Sobrecarga y separación de velocidad teórica/efectiva |
| [CKinetics.java](https://github.com/Creators-of-Create/Create/blob/ac0c444d9828da3453ae8cc65338e8de063286fb/src/main/java/com/simibubi/create/infrastructure/config/CKinetics.java#L14) | Máximo predeterminado de 256 RPM |

La auditoría es del subconjunto cinético, no un inventario completo de Create ni de sus dependencias. Se incluyó el aviso MIT del código en el BP y en licenses/. Ninguna textura, modelo, sonido, animación, texto de manual o escena Ponder proviene del arte de Create.

## Componentes, controles y recetas originales

Todos los ingredientes se combinan en mesa sin patrón. Cada resultado es una unidad. Estas recetas son diseño Bedrock propio, no copia de recetas Java ni paridad de progresión.

| ID bedrockworks: | Función declarada | Receta |
|---|---|---|
| shaft | Dos puertos sobre el eje seleccionado | Hierro → shaft_component → shaft |
| gear | Engranaje pequeño | Cobre + pepita de hierro → gear_component → gear |
| large_gear | Engranaje grande | gear + cobre + hierro |
| gearbox | Cuatro puertos, eje seleccionado bloqueado | 2 gear + hierro |
| water_wheel | Fuente ±8 RPM; capacidad 32 × 8 = 256 SU | shaft + 2 tablones de roble + cobre |
| test_source | Fuente de desarrollo, inicialmente apagada | gearbox + redstone + diamante |
| speed_meter | Aguja y lectura real de RPM | shaft + brújula + cobre |
| stress_meter | Aguja de esfuerzo; freno configurable de prueba | speed_meter + hierro |

Colocación: la cara pulsada elige el eje (caras arriba/abajo → Y, este/oeste → X, norte/sur → Z). **Agacharse e interactuar alterna X/Y/Z** en los ocho bloques. En la caja, ese eje es el par de caras sin puertos.

Interacción normal con test_source alterna apagada, +8/+16/+32/+64 y -8/-16/-32/-64 RPM, aportando 32 SU por RPM absoluta. Es un recurso explícitamente de desarrollo, con receta solicitada, no una fuente equilibrada de supervivencia ni un componente atribuido a Create.

Interacción normal con stress_meter alterna freno **0/8/64 SU por RPM**. En 0 es pasivo como Java; los otros modos son una extensión de prueba que disipa capacidad para demostrar sobrecarga antes de introducir máquinas. El efecto es real en el cálculo: puede detener toda la red y las animaciones. La barra de acción al mirar un medidor muestra RPM efectivas, demanda/capacidad y estado; no se generan mensajes de chat para representar energía.

El manual tiene ocho páginas traducidas con controles, conexiones y recetas. No hay todavía transferencia de energía a máquinas de procesamiento: esas máquinas quedan fuera de esta fase.

## Reglas del grafo

`src/kinetic/model.ts` define nodo = dimensión + coordenadas enteras, clase, eje, fuente, coeficiente de capacidad, impacto y disponibilidad. Un índice Map por coordenada evita explorar el mundo. Solo se consultan 18 vecinos candidatos (caras y diagonales de dos ejes).

- Extremos de ejes compatibles: ratio +1.
- Pequeños en el mismo plano y adyacentes por cara perpendicular a su eje: -1.
- Grande y pequeño, mismo eje, diagonal de una unidad en cada uno de los otros dos ejes: grande→pequeño -2; pequeño→grande -0.5. No conectar grande/pequeño por una simple cara lateral.
- Grandes con ejes distintos, diagonal en esos dos ejes: signo según el desplazamiento de ambos ejes, como RotationPropagator. Grandes paralelos solo conectan coaxialmente.
- Caja: dos ejes de puertos, cada par opuesto invierte y el par perpendicular ajusta el signo según entrada/salida. El RPM interno de la caja se expresa en un marco de puertos propio; comparar sus salidas, no su escalar interno, con Java.

`network.ts` resuelve cada componente con BFS iterativo y factores relativos. Las relaciones son potencias de dos y signos representables exactamente en el rango normal de Number; tolerancia relativa 1e-9 para comprobar ciclos. No hay propagación recursiva ni expansión repetida por un ciclo. Valores numéricos fuera de rango detienen la red y mantienen diagnósticos finitos.

Capacidad = suma de coeficiente_fuente × abs(RPM_generadas). Consumo = suma de impacto × abs(RPM_teóricas_locales). Las transmisiones no consumen; el freno sí. Si consumo > capacidad, RPM efectiva = 0 en todo el componente, conservando RPM teórica para diagnóstico y recuperación. Se admite el límite exacto; más de 256 RPM detiene por overspeed.

**Diferencia deliberada con Java:** dos fuentes que exijan RPM incompatibles, aunque giren en la misma dirección, detienen el componente. Java puede imponer la fuente más rápida y romper bloques ante conflictos/velocidad excesiva. Esta versión no destruye construcciones automáticamente. Fuentes exactamente compatibles suman capacidad. Ciclos contradictorios también detienen sin destruir.

## Invalidación, presupuesto y concurrencia

Una mutación invalida de inmediato los componentes anteriores de esa posición y sus vecinos; la consulta autoritativa devuelve 0/pending mientras se recalculan. No se recorren todos sus miembros dentro del evento. Iteradores de miembros antiguos siembran las partes divididas por pasos, de modo que ambas mitades se resuelvan aunque la rotura haya eliminado el único puente.

El cálculo tiene fases incrementales de descubrimiento, fuentes, esfuerzo y publicación. Ningún resultado se considera válido hasta que todos sus nodos estén preparados. Si cambia un nodo observado o un vecino durante el cálculo, se cancela la tarea. Cambios en otra red conservan válidos sus resultados. No hay await en la mutación de bloques: las interacciones de varios jugadores se serializan en el servidor.

El adaptador usa intervalos de un tick: 1 relectura de un nodo conocido y hasta 3 pendientes; hasta 128 operaciones del grafo; hasta 4 actualizaciones visuales y 4 limpiezas. Ventanas blandas medidas con Date.now: muestreo hasta +2 ms, grafo hasta +4 ms y presentación hasta +6 ms. **No es una garantía de 6 ms del motor:** una llamada nativa no se puede interrumpir y el rendimiento real debe medirse. No se añadió una prueba de rendimiento del juego ficticia.

Cada bloque cargado pide revisión mediante minecraft:tick cada 20 ticks. Colocación y rotura usan componentes estables registrados en startup y eventos posteriores. Cambios por comandos, explosiones y fluidos tienen además revalidación periódica; no se asume que todos emitan eventos idénticos. El muestreo de nodos conocidos tiene turno propio aunque la cola de descubrimiento esté llena.

## Agua: implementación Bedrock y diferencias

Java consulta FluidState.getFlow en los cuatro lados del plano de la rueda pequeña, proyecta el vector al plano, lo normaliza y puntúa su tangente; contempla lava y columnas de burbujas. `sign(flowScore) × 8` define velocidad. Un flujo horizontal también puede moverla.

Los tipos estables @minecraft/server 2.11.0 inspeccionados no ofrecen el equivalente del vector de fluido Java; métodos de permiso de flujo de un bloque no son ese vector. Se implementó una alternativa comprobable con estados:

- Eje X: examinar vecinos Z−/Z+; eje Z: vecinos X−/X+.
- Contar solo water/flowing_water con **liquid_depth >= 8** y otro bloque de agua inmediatamente encima. Las columnas descendentes en lados opuestos se cancelan.
- Eje X, caída en Z+ → +8 RPM; eje Z, caída en X+ → -8 RPM; el otro lado invierte. Eje Y permanece apagado.
- Agua quieta, flujo horizontal, lava, burbujas y waterlogging no aportan energía en esta versión. Una lectura no disponible pausa el componente. La frontera es conservadora: se revisan todas las posiciones candidatas, así que una posición vecina desconocida puede pausar incluso sin una conexión confirmada a ese lado.

La interpretación de liquid_depth y la formación de la cascada están implementadas y cubiertas con fixtures; la simulación nativa de agua **aún necesita la prueba dentro del juego**. No se afirma que la demostración haya corrido en Minecraft.

## Chunks, persistencia y recuperación

No hay un evento estable de descarga de chunk usado por este adaptador. getBlock sin resultado o con error se trata como desconocido, nunca como aire. Se conserva la conectividad conocida y se pausa el componente, evitando convertir una fuente descargada en capacidad gratuita.

Las lecturas cargadas renuevan una vigencia de 200 ticks. Un min-heap indexado permite refrescar/caducar sin escanear todo el registro; se caducan hasta 16 nodos por tick. Un nodo no revisado a tiempo se marca no disponible, invalida su red y se agenda para revalidar. Redes demasiado grandes para el presupuesto **pueden pausarse**, en vez de seguir funcionando con información antigua. No se garantiza latencia instantánea de descarga: hay muestreo y presupuesto. El test de 3.000 nodos valida el solver puro, no una fábrica de ese tamaño a 20 TPS en Realms.

Estado persistente necesario = estados nativos del bloque: eje, RPM seleccionadas de test_source y freno. El grafo, cálculos y handles no se guardan como verdad del mundo; se reconstruyen desde los bloques al volver sus ticks o al descubrir vecinos cargados. Una reinicialización empieza con RPM visuales 0. No hay inventarios ni trabajos propios, por lo que no se promete producción offline.

Pistones: bloques cinéticos immovable; no se pretende soportar contraptions ni trasladar referencias de grafo mediante pistones. Se verificó el componente oficial minecraft:movable (requiere formato mínimo 1.21.100) y se usa ese formato. Cualquier reemplazo por comandos se corrige mediante muestreo.

## Presentación original y límites

Los ocho componentes tienen textura/icono, geometría de base y de rotor, animación original, loot, receta y traducción. El bloque es la autoridad; la entidad visual es una superposición sin colisión, persistente y no invocable por comandos. No almacena energía ni inventarios. El visual de inventario usa minecraft:item_visual, disponible desde formato 1.21.60 según las fuentes oficiales consultadas.

El servidor sincroniza RPM con signo, eje numérico y proporción de esfuerzo. Molang integra delta_time × RPM × 6 para evitar saltos de fase al cambiar velocidad. El rotor se orienta al eje; las agujas muestran RPM o porcentaje de esfuerzo. No se intenta ejecutar una animación de entidad directamente en un bloque.

Se limpian visuales al romper, se reconcilian duplicados locales, se validan sus anclajes por presupuesto y se reinician propiedades a 0 en entityLoad. Máximo **256 visuales activos en el registro**; al alcanzar el límite sigue el cálculo, pero puede no mostrarse un rotor actualizado. Los bloques siguen existiendo y los medidores consultan el grafo. Pendiente evaluar otra técnica de representación si este límite no basta. Pueden existir ventanas breves de presentación antigua durante invalidación, limpieza o resincronización: no son autoridad para futuras máquinas.

La caja usa un rotor interno ilustrativo; no se replican las animaciones/siluetas Java. Los modelos de rueda y engranaje grande sobresalen visualmente del cubo; colisión y selección conservan un bloque completo. Falta validar render, selección, interacción y consumo visual real con dos clientes.

## Demostración reproducible

`npm run demo` ejecuta el mismo diseño en un puerto de mundo Node. Comprueba rueda +8 RPM, salida -16 RPM, capacidad 256 SU y consumo 128 SU en una red de 11 bloques. La escena pasa por dos ejes, grande→pequeño, otros ejes, medidores y caja con cambio de eje. Las pruebas también retiran el agua, eliminan un eje y aplican freno de 64 para comprobar parada real del grafo.

En Minecraft, usar **únicamente un mundo de prueba respaldado y un volumen vacío** X[-1,8], Y[0,4], Z[-1,4] relativo a los pies del ejecutor. La función sobrescribe las posiciones indicadas; no se ejecuta desde el build ni automáticamente:

```mcfunction
/function bedrockworks/kinetic_demo
```

`config/kinetic-demo.json` define la escena y `tools/generate_demo.py` genera los comandos reales de colocación. El canal de vidrio deja caer agua desde (0,3,1) sobre el lado Z+ de la rueda en (0,1,0). Esperar la caída nativa del agua y el recálculo, luego mirar los medidores en (5,2,1) o (7,2,3).

Comprobar -16 RPM y 128/256 SU. Interactuar con el medidor de esfuerzo en (6,2,1): 8→64 debe detener la red por 1024/256 SU; otra interacción 64→0 la libera. Retirar la fuente de agua debe apagarla cuando termine de drenar. Romper el eje (2,1,0) debe dejar la parte derecha sin fuente. Recolocarlo sobre el extremo de un eje para eje X, o agacharse hasta X. El medidor del eje Z confirma el giro después de la caja.

## Validación y pendientes

Las pruebas Node cubren relaciones y signos, ciclos consistentes/contradictorios, sobrecarga y recuperación, fuentes compatibles/conflictivas, separación y reconexión, mutaciones durante cálculo, aislamiento entre redes, disponibilidad, caducidad, presupuestos, 3.000 nodos y demostración con agua ficticia verificable. Se mantienen pruebas del manual/validadores y pruebas Python del ZIP.

Pendiente: importación 0.2.0, carga de componentes, formación nativa del agua, visuales/Molang, rendimiento real, dos jugadores y Realms con reinicio/chunks. No declarar esos resultados como aprobados hasta ejecutar PRUEBAS_MANUALES.md. Consultar `bedrockworks:last_error` como propiedad dinámica de diagnóstico desde un script de mantenimiento si hay errores del adaptador; no se guarda ningún secreto.

## Evidencia de entrega 0.2.0

| Área | Implementación presente | Verificación realizada |
|---|---|---|
| Grafo, ratios, signos, esfuerzo, división y ciclos | TypeScript de dominio | Pruebas Node aprobadas |
| Agua, frontera y caducidad | Puerto de mundo + control de vigencia | Fixtures Node aprobados; fluidos nativos pendientes |
| Eventos, propiedades nativas, reconstrucción y visuales | Adaptador @minecraft/server y JSON enlazados | Compilación estricta y referencias; ejecución de motor pendiente |
| Recursos y ocho recetas/páginas | Modelos/texturas/animaciones, JSON de mesa y .lang | Rutas, geometrías y traducciones verificadas; importación/render/consumo pendientes |
| Distribución | Dos packs 0.2.0 con UUID conservados, función demo y aviso MIT | ZIP/CRC, checksum y reproducción local aprobados |

`npm run package`: **43 pruebas Node aprobadas**, 0 fallos, 0 omitidas. `python3 -m unittest discover -s tests -v`: **2 pruebas aprobadas**. `npm run demo`: salida -16 RPM, 128/256 SU, rueda +8 RPM y 11 miembros. Validación local: **82 JSON, 16 geometrías, 11 IDs bloque/objeto y 54 claves por locale**.

Artefacto: `dist/create-bedrock-dev-0.2.0.mcaddon`, **55.341 bytes**, SHA-256 `92c40b25653dcf96626908d9f3d189b59bc39d036ea508569d5597f4c230deb9`. Dos empaquetados desde recompilación consecutiva dieron el mismo hash con este toolchain. BP: 60 archivos; RP: 62; aviso MIT y función de demostración comprobados dentro del ZIP. Informe legible por herramientas: `dist/validation-0.2.0.json`.

Release público rechazado correctamente por `licenses_reviewed`, `windows_tested` y `realms_tested`. No se publicó ningún cambio del entorno. Las pruebas de motor siguen sin ejecutarse; no llamar a esta entrega una versión ya validada en Windows o Realms.
