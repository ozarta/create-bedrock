# Pruebas Realms — pendientes de ejecución

No hay acceso a un Realm ni a clientes Windows desde este entorno. **Todas las pruebas de esta página están PENDIENTES.** API estable declarada y ausencia de dependencias externas no certifican compatibilidad de ejecución con Realms.

## Preparación

El propietario debe respaldar/exportar el mundo actual y elegir un slot de prueba, revisar el destino y subir la copia validada en Windows siguiendo INSTALACION.md. No reemplazar un mundo importante sin respaldo. Registrar versión completa de cada cliente, versión del servicio si es observable, hash del paquete, packs 0.4.2, distancia de simulación y experimentos apagados. Si la versión del servidor no es visible, indicarlo como no observable.

Utilizar dos cuentas reales, una es_MX y otra en_US, con permisos normales para la prueba de supervivencia. El propietario realiza la administración; el addon no necesita operador para fabricar ni producir. Confirmar descarga obligatoria del RP y ausencia de versiones antiguas activas.

| ID | Prueba | Aceptación y evidencia |
|---|---|---|
| R01 | Cargar mundo con BP/RP y entrar con dos clientes | Sin errores de módulo o recursos; packs correctos en ambos; experimentos apagados |
| R02 | Repetir W02–W12 de PRUEBAS_WINDOWS.md | Idiomas, manual, red, prensa y salida coinciden con recetas reales; no se presume herencia del resultado local |
| R03 | Fabricar y producir desde supervivencia con cuenta sin operador | Red hidráulica y tres láminas obtenibles sin comandos; entrega real en barril |
| R04 | Ambos jugadores extraen/insertan mientras la prensa completa | 50 ciclos de cada metal, conteo total conservado; no sobrescribir materiales ajenos ni ítems personalizados |
| R05 | Colocar/romper/girar fuentes y puentes simultáneamente | Redes separadas sin energía quedan detenidas; publicación parcial no activa producción |
| R06 | Uno sale con manual abierto; otro sigue en fábrica | Sesión UI liberada/reabierta; servidor continúa para el segundo; no dependencia del propietario conectado |
| R07 | Todos se alejan fuera de simulación >70 segundos, cambian dimensión y vuelven | Pausa sin producción offline, reconstrucción y visuales sin duplicación; chunk desconocido no aporta capacidad |
| R08 | Cerrar/reabrir Realm mediante controles disponibles, con trabajo activo y entrega cercana | Materiales conservados; esquema v1 reanuda o descarta tiempo ambiguo sin repetir salida; registrar tiempos y conteos |
| R09 | Descargar copia tras prueba y abrirla localmente | Inventarios, estados de bloques y progreso coherentes; ningún dato depende de caché de un cliente |
| R10 | Actualizar copia 0.4.1→0.4.2 y restaurar backup | UUID/versiones y conservación correctos; rollback del mundo completo ensayado |
| R11 | Tolvas vanilla y dos jugadores compiten con entrada/salida | Conservación incluyendo inventarios y drops; el lock JavaScript no se presenta como bloqueo del motor nativo |
| R12 | 1/10/50 prensas y redes crecientes durante 10 minutos por nivel | Sin desconexión/watchdog, retrasos sostenidos ni duplicación; registrar latencias y límites observados |

CPU/RAM internas del servidor Realms no están expuestas aquí: marcar «no medido» si el servicio no ofrece métricas. FPS del cliente no demuestra TPS del servidor. Registrar observaciones, latencia, tiempos de proceso y errores que el cliente exponga; no prometer acceso al Content Log completo del servidor.

Ante fallo: registrar pasos mínimos, ID de prueba, hash, conteos inicial/final, hora UTC y logs disponibles; detener la promoción. Restaurar el backup desde el cliente si hace falta. No activar Beta APIs, experimentos o plugins externos para dar por aprobada esta versión.

Para declarar compatibilidad verificada se requiere evidencia real de R01–R12, además de Windows aprobado, revisión de problemas críticos y versiones coincidentes. Actualmente ninguna de esas evidencias existe. No se ha publicado ni subido un mundo durante esta tarea.
