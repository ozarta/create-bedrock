# Pruebas Windows — pendientes de ejecución

**Ningún escenario de esta guía se ha ejecutado dentro de Minecraft.** Resultado inicial de todas las filas: PENDIENTE. Compilación, mocks y Node no aprueban estas filas.

## Registro

Crear un registro por ejecución con fecha UTC, responsable, hash del paquete, versión 0.4.2, versión completa Bedrock, Windows/CPU/RAM, mundo/copia/semilla, distancia de simulación, packs activos, experimentos apagados, jugadores y resultado por ID. Adjuntar Content Log disponible y evidencias sin datos privados. Estados: APROBADO, FALLÓ, BLOQUEADO, PENDIENTE. Registrar esperado/observado y conteos, no solo «parece funcionar».

| ID | Procedimiento | Criterio de aceptación |
|---|---|---|
| W01 | Importar ambos packs, crear copia y entrar dos veces | Versiones 0.4.2; dependencia del RP resuelta; sin API/JSON/componentes faltantes ni experimentos |
| W02 | Cliente es_MX, luego en_US | Nombres, once categorías, fichas, errores, HUD y embudos traducidos; parámetros correctos; ninguna clave cruda |
| W03 | Fabricar manual en supervivencia; usar en aire y sobre bloque | Consumo libro+cobre correcto, un manual; abre una sola interfaz y no se consume al usar |
| W04 | Buscar eje/shaft/cobre; filtrar; abrir usos, alternativas, imagen y Volver | Ingredientes y cantidades corresponden a JSON; filtros conservados; referencias Java no fabricables; CustomForm vuelve correctamente |
| W05 | Cerrar, cancelar, usar con chat abierto, reconectar con formulario abierto | Sin sesión bloqueada, respuestas antiguas ni excepciones repetidas; se vuelve a abrir |
| W06 | Colocar/girar/romper todos los diez bloques propios; revisar seis objetos | Drops exactos, colisiones y UV correctos, sin modelos ausentes; prensa solo X/Z; embudo gira y cambia modo con mano vacía |
| W07 | Rueda con caída de agua, ejes y pareja grande/pequeño; medir | +8 RPM rueda, ratio grande→pequeño -2; sobrecarga/conflicto detienen; agua quieta no genera |
| W08 | Montar fábrica según FABRICA.md sin comandos ni fuente de desarrollo | Entrada y salida correctas, tres metales obtenibles; a 8 RPM demanda 64 SU, capacidad de una rueda 256 SU |
| W09 | Un lingote de hierro, cobre y oro por separado; después pila de 64 | Una lámina por lingote; procesamiento de pila proporcional, entrega completa al final; ningún objeto creado por chat |
| W10 | Retirar fuente/romper eje a mitad; sobrecargar y reconectar | Ingrediente permanece; sin avance durante parada; no entrega parcial; trabajo reanuda sin duplicar |
| W11 | Llenar salida con materiales ajenos; luego liberar un slot | Embudo no sobrescribe ni extrae hacia destino lleno; producto permanece en barril de proceso y después se mueve |
| W12 | Añadir/retirar/cambiar pila activa y usar ítem nombrado/lore | Cambio reinicia trabajo; pila personalizada no se transforma ni pierde metadatos; slots ajenos intactos |
| W13 | Romper prensa, embudos y barriles en fases distintas | Romper prensa no vacía barril; drops de barril gestionados por Minecraft; conteos conservados; no copias de recuperación |
| W14 | Guardar/salir durante trabajo y justo al entregar; reabrir 20 veces | Progreso v1 válido reanuda; intento ambiguo no se repite; nunca crecen conteos sin insumos |
| W15 | Salir de distancia de simulación con TODAS las cuentas, esperar >70 segundos; volver | No producción offline; red incompleta se pausa; nodos/visualizaciones se reconstruyen; no capacidad de fuentes descargadas |
| W16 | Red cruzando límite de chunk y otra dimensión; sustituir/borrar bloques | Recálculo conservador; ningún enlace entre dimensiones; desaparecen rotores huérfanos al revalidar |
| W17 | Dos jugadores colocan/rompen y acceden al mismo barril; tolva nativa mueve ítems simultáneamente | Entradas + productos equivalentes + ítems en jugadores/drops suman el total inicial; sin overwrite, pérdida ni duplicación |
| W18 | Dos jugadores usan manuales e idiomas diferentes durante producción | Sesiones independientes, producción autoritativa, salir un jugador no detiene la simulación global |
| W19 | Guardar mundo 0.4.1 con trabajo, actualizar copia a 0.4.2; restaurar respaldo | UUID estables, objetos conservados, esquema v1 reconciliado; rollback completo documentado |
| W20 | Sonido original, compuerta de embudo, ram y giro a ±RPM y al detener | Sin clipping ni errores Molang; presentación coherente, sin visuales duplicados; pausa no aparenta producción |

## Medición de carga

En copia descartable, medir primero mundo sin fábrica, después 1/10/50 prensas, redes de 100/1.000/3.000 nodos y 256/>256 componentes visuales. Aumentar gradualmente y detener ante bloqueos, watchdog o pérdidas. La escena de supervivencia W08 se realiza sin comandos; las escenas masivas son pruebas técnicas separadas.

Mantener cada nivel 10 minutos, con 1 y 2 jugadores: registrar CPU, RAM del proceso desde herramientas Windows, latencia de apertura del manual, FPS, retraso de producción/reconexión y número de visuales. Medir antes/durante/después de alejarse >70 segundos y volver. Usar Script Profiler solo si el cliente lo ofrece sin activar experimentos; registrar ausencia si no está disponible. No deducir TPS a partir de FPS. El presupuesto total de un tick de 20 TPS es 50 ms, pero el addon solo puede medir tramos propios; no hay garantía temporal estricta ni umbral de hardware validado.

Criterios mínimos: ningún watchdog, crecimiento continuo de memoria entre ciclos equivalentes, excepción repetida o variación injustificada de conteos. Registrar retrasos y fijar el límite operativo solo tras medir. Los ensayos Node de qa-performance.json no dan un límite seguro para Windows o Realms.

Para cada prueba de conservación, contar iniciales y finales en todos los barriles, manos, inventarios y drops; las tres recetas son 1:1 y no generan sobrantes. Si falla conservación, bloquear la promoción y conservar una copia para reproducir. No reparar mediante duplicar/reponer silenciosamente objetos.
