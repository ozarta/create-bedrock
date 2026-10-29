# Problemas y límites conocidos — 0.4.2

Estado: candidato de desarrollo para pruebas, **no producción**. No hay evidencia de importación, funcionamiento Windows o Realms. Las limitaciones siguientes se conservan explícitas.

| ID | Riesgo o límite | Mitigación / comprobación necesaria |
|---|---|---|
| QA01 | Importación, callbacks de bloques/objeto, CustomForm, Molang y contenedores nativos aún no ejecutados | Bloquea declarar compatibilidad de juego; ejecutar PRUEBAS_WINDOWS y PRUEBAS_REALMS |
| QA02 | No hay transacciones ACID públicas entre propiedades dinámicas e inventario; crash/rollback puede desincronizar guardados nativos | Un reemplazo nativo por proceso y un movimiento nativo por traslado; nunca compensar mediante copias; respaldos y W14/R08. No se garantiza durabilidad frente a cualquier fallo del motor |
| QA03 | Un intento `committing` ambiguo descarta progreso | Es deliberado para no repetir salida; puede requerir rehacer tiempo, sin prometer recuperación exacta del avance |
| QA04 | Barril/prensa reemplazados mientras están descargados no tienen identidad persistente propia | Entradas indistinguibles pueden conservar tiempo parcial en esa coordenada; no existe una salida adicional guardada. Probar reemplazo, explosión, comandos y recarga |
| QA05 | Progreso huérfano si un bloque se elimina estando descargado y nunca vuelve a muestrearse | No contiene objetos; puede acumular propiedades del mundo. No hay recolector global de propiedades ni migración desde futuros esquemas; vigilar tamaño de mundo. No borrar propiedades de terceros |
| QA06 | Catálogo completo y primer índice se construyen síncronamente al primer uso | En Node ~3,18 MB de JSON y ~6,5 MB de heap para datos+índice. Latencia/memoria en Bedrock sin medir; ejecutar apertura y carga con dos clientes |
| QA07 | Presupuestos de tiempo son blandos; llamadas nativas no interrumpibles | Cinética hasta ~6 ms, prensa ~3 ms/tick, embudos ~2 ms cada 20 ticks; no equivalen a límites garantizados ni se extrapolan desde Node |
| QA08 | Redes muy grandes pueden caducar antes de revalidarse; producción disminuye con presupuestos compartidos | Parada conservadora por datos antiguos. Medir escala real; ninguna cifra de nodos se presenta como capacidad certificada |
| QA09 | Máximo 256 visuales cinéticos rastreados, muestreo de rotores acotado | Puede faltar animación en fábricas grandes; física independiente. Recarga adopta/elimina entidades para limitar huérfanos, pero ese adaptador requiere prueba nativa |
| QA10 | Prensa admite solo hierro/cobre/oro simples, un tipo/slot y salida en ese mismo slot | Rechaza nombre/lore/datos personalizados. Pila completa tarda proporcionalmente y se entrega al terminar; cambiarla reinicia trabajo. Sin cuenco, compactado, fluidos, cintas ni ítems caídos |
| QA11 | Embudo es un subconjunto pasivo entre dos barriles horizontales | Mueve pila completa solo a slot vacío, sin mezclar, partir ni filtros arbitrarios/redstone. Entrada admite lingotes de prensa; salida admite sus láminas. Rotación/mode con mano vacía; comprobar orientación visual vs funcional |
| QA12 | Ocho máquinas prioritarias pendientes | Mezcladora, trituradoras, molino, ventilador, sierra, taladro, cinta y depósito no tienen implementación. El barril vanilla no es un depósito propio |
| QA13 | Paridad parcial de rueda y conflictos cinéticos | Agua descendente verificable sustituye vector de flujo Java; sin generación con eje Y. Fuentes incompatibles detienen la red, no reproducen todas las reglas Java |
| QA14 | No hay producción en chunks descargados ni simulación offline | Se pausan redes incompletas. Nodos no disponibles se retiran tras 1.200 ticks desde detección, hasta 16 por avance; descubrimiento nativo los reconstruye |
| QA15 | Inventario completo de Create y registros dinámicos no auditados exhaustivamente | 1.884 recetas JSON del commit exacto verificadas; ocho familias dinámicas sin enumeración Java en ejecución. Referencias futuras no se anuncian fabricables |
| QA16 | Licencia pública propia y revisión legal de distribución pendientes | Aviso MIT de Create incluido; arte procedural propio con procedencia. Comparación de hashes detecta copias exactas, no toda obra derivada; no es certificación legal. Release público bloqueado |
| QA17 | No hay coordinación transaccional con todos los add-ons o protecciones ajenos | Probar tolvas nativas y dos jugadores; incompatibilidades externas requieren reproducción. El lock solo serializa callbacks síncronos propios |

## Correcciones de esta revisión

- Retención de nodos descargados limitada en el controlador; vecinos permanecen conservadoramente incompletos hasta revalidar. Tres pruebas nuevas cubren retirada acotada, recarga y puente desconocido.
- Recarga de entidades visuales adopta las existentes bajo el tope, elimina duplicados y reinicia RPM; no se considera validada en el motor.
- JSON de progreso ilegible se descarta como registro corrupto y deja volver a procesar; antes podía causar fallo permanente en esa prensa. Prueba de recuperación aprobada.
- Validaciones adicionales: cobertura artística total, procedencia duplicada, geometrías/texturas de permutaciones, parámetros de traducción, módulos adicionales/entidades experimentales y cantidades reales de prensado.
- Parser estricto para todos los JSON del contenido/fuentes/configuración: rechaza claves duplicadas y NaN. Se ejecuta en el build.

No se encontró duplicación en los escenarios automáticos disponibles. Eso **no demuestra ausencia de duplicación en el motor** ni sustituye conteos de W09–W17 y R04/R08/R11.
