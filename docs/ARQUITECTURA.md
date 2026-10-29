> Estado vigente QA 0.4.2: [ESTADO_FUNCIONAL.md](ESTADO_FUNCIONAL.md). Esta página conserva el historial; las pruebas nativas actuales están en [PRUEBAS_WINDOWS.md](PRUEBAS_WINDOWS.md) y [PRUEBAS_REALMS.md](PRUEBAS_REALMS.md).

# Arquitectura propuesta

Estado actual: cinética y manual compilables 0.3.0 en `behavior_pack/`, `resource_pack/`, `src/` y `assets_source/`. Manifiestos enlazados, TypeScript estricto con lockfile, ejemplos visuales/sonoros originales y manual básico declarados. Compilación y pruebas locales verificadas; ejecución en Minecraft pendiente. Véase [BASE_TECNICA.md](BASE_TECNICA.md) para archivos y versiones. Namespace: `bedrockworks`; confirmar unicidad antes de publicar.

La red cinética y su adaptador están implementados en `src/kinetic/{model,network,controller,leases,water,runtime}.ts`, con pruebas Node. El diseño aplicado, presupuestos, persistencia nativa de estados y límites de representación se detallan en [CINETICA.md](CINETICA.md). Inventarios, trabajos, máquinas de procesamiento y persistencia transaccional siguen siendo diseño futuro.

## Capas

1. Dominio TypeScript puro: grafos cinéticos, inventarios lógicos, recetas y trabajos; sin importaciones de Minecraft. Facilita pruebas deterministas.
2. Adaptador servidor: eventos, scheduler, bloques, contenedores, persistencia y validación de interacción según API estable seleccionada.
3. Presentación: modelos, animaciones, partículas y sonido; nunca fuente de verdad del inventario ni del esfuerzo.
4. Manual: catálogo compartido con recetas, páginas, búsqueda por categoría y tutoriales; UI por jugador y traducciones es_MX/en_US.
5. Build: compilar TS, validar JSON, validar esquemas oficiales fijados, copiar recursos propios, generar BP/RP con UUID estables y crear `.mcaddon`.

No introducir servicios externos, binarios nativos, Java en runtime o experimentos como requisito de Realms. Java y Gradle solo servirían para inspeccionar/generar datos upstream con licencia comprobada y JDK obtenido del build exacto.

## Grafo cinético

Nodo = dimensión + coordenada entera + tipo y orientación; puertos declaran ejes, caras y reglas de conexión. Las aristas transportan una relación racional con signo: `rpm_b = rpm_a * ratio(a,b)`. Se auditaron ratios y signos del subconjunto en Create 6.0.10; véase CINETICA.md. Los factores usados ahora son dyádicos con comprobación de ciclos; para relaciones futuras arbitrarias habrá que ampliar el modelo numérico. Los engranajes grandes/pequeños deben producir relaciones coherentes en ciclos, no redondear velocidades repetidamente.

Recalcular componentes afectados al colocar/romper/conmutar, no explorar todo el mundo cada tick. BFS/DFS con presupuesto y continuación. Un ciclo con relaciones inconsistentes o fuentes incompatibles se marca conflicto y detiene el componente. La política exacta de selección de fuentes, suma de capacidad y propagación será tomada del commit verificado; inicialmente no inferirla del aspecto visual.

Modelo candidato: capacidad total `C = suma(capacidad_fuente(abs(rpm)))`; demanda `D = suma(impacto_maquina(abs(rpm)))`; sobrecarga si `D > C`. La forma de la suma está verificada en KineticNetwork.java de 6.0.10; las recetas y el freno opcional son decisiones propias Bedrock. Esfuerzo es una unidad de simulación, no torque físico. La rueda pequeña usa 32 SU/RPM a ±8 RPM; transmisiones/medidores son pasivos salvo el freno de prueba opcional. Las fuentes incompatibles detienen la red en esta versión, a diferencia de la política Java de imposición/rotura. La animación lee el estado resuelto y nunca hace funcionar una máquina detenida.

## Inventarios y trabajos

Servidor autoritativo: una interacción valida dimensión, distancia, bloque actual, disponibilidad, permisos y revisión del inventario. Identificar stacks por tipo y componentes relevantes (daño, nombre, lore u otros soportados); no mezclar indiscriminadamente objetos personalizados.

Trabajo propuesto: `idle → reserved → processing → output_pending → committed`, con estados de pausa por energía o salida llena. Reservar entradas una sola vez, persistir progreso y resultado probabilístico antes de entregarlo. No volver a sortear tras recarga. Verificar capacidad de salida antes de consumir. Mantener journal con ID y revisión para recuperación idempotente; no asumir transacciones atómicas entre contenedor del juego y dynamic properties. Prototipar ventanas de interrupción y definir reconciliación antes de usar almacenamiento virtual en supervivencia.

Romper una máquina debe resolver exactamente una devolución o entrega. Si la API no permite demostrar recuperación consistente, la primera versión debe restringir la operación y documentarla, no ocultar riesgo de duplicación. No destruir inventario de terceros para resolver un conflicto.

## Persistencia y chunks

Separar definición del pack, estado de mundo versionado, estado de máquina, rutas y sesión UI. Persistencia particionada por dimensión/chunk con migraciones y respaldo previo a cambio de esquema; probar límites reales de la API. No serializar objetos del runtime ni guardar referencias a entidades inválidas.

Al descargar chunks, suspender trabajos y marcar redes incompletas. No simular conexiones desconocidas ni forzar carga permanente. Al reactivar, validar bloques existentes, reconstruir índices y reconciliar trabajos. Consultas fallidas por chunk no disponible son pausas, no bloques de aire. No prometer producción offline.

## Scheduler y seguridad multijugador

Colas acotadas para cambios de topología, trabajos y presentación. Procesar con turnos justos por dimensión/red para evitar que una fábrica monopolice el tick. Los valores iniciales están fijados en el adaptador y documentados en CINETICA.md; requieren medición en juego antes de considerarse adecuados para Realms. Telemetría local: tiempo de resolución, nodos pendientes, trabajos activos y pausas; sin datos personales.

Dos jugadores pueden interactuar con una máquina en el mismo tick: usar revisión y serialización del dominio. Formularios se abren fuera de contextos de evento restringidos si la API lo exige; cancelar o desconectar no consume ingredientes. Nunca confiar en respuestas UI como autorización para crear objetos.

## Recursos y manual

Modelos Blockbench bedrock originales, fuentes `.geo.json` conservadas y editables en Blockbench; textura, UV, paleta, animaciones y sonido propios. Identidad industrial de hierro, cobre y latón, con siluetas y motivos propios. No trazar UV, sprites, sonidos o escenas Ponder de Create. El manual mostrará entradas, cantidades, probabilidades, velocidad mínima, calor y tutoriales desde el catálogo validado, incluyendo advertencias de aproximaciones Bedrock.

La estructura de páginas se diseñará para botones/etiquetas de formularios soportados. No se presupone navegador embebido ni pantalla Java. es_MX principal; en_US de respaldo; verificar sustituciones y soporte de locale con ambos clientes.


## Manual 0.3.0

`data/guide` y los JSON de recetas del BP alimentan `tools/generate_guide.py`; la referencia MIT fijada vive en data/reference. `src/guidebook/model.ts` resuelve índices de producción/uso, búsqueda bilingüe y representación de ingredientes. `navigation.ts` mantiene historial acotado; `screens.ts` produce mensajes/acciones independientes del motor; `guidebook.ts` adapta a formularios estables 2.3.0, usa sesiones por jugador y consulta el grafo para comprobaciones. No escribe inventarios ni bloques.

El catálogo generado y los prefijos manual.* no son fuentes editables. No hay tablas de cantidades incrustadas en pantallas. Los scopes Bedrock/Java, estados de disponibilidad y evidencia se mantienen separados. Se conserva toda la regresión cinética; el manual se añade sin modificar algoritmos de red. Véase MANUAL.md para límites, imágenes y pruebas pendientes.


## Actualización de fábrica 0.4.1

Prensa y embudo filtrado implementados en código con pruebas Node; integración Minecraft/Realms pendiente. Tres procesos de láminas, barriles nativos, inventarios conservadores y tutorial de supervivencia sin comandos. Ocho máquinas restantes pendientes. La descripción actual y las diferencias Java/Bedrock de esta vertical están en [FABRICA.md](FABRICA.md); las indicaciones anteriores sin procesamiento describen hitos previos.
