> Estado vigente QA 0.4.2: [ESTADO_FUNCIONAL.md](ESTADO_FUNCIONAL.md). Esta página conserva el historial; las pruebas nativas actuales están en [PRUEBAS_WINDOWS.md](PRUEBAS_WINDOWS.md) y [PRUEBAS_REALMS.md](PRUEBAS_REALMS.md).

# Windows, Realms y multijugador

Compatibilidad de ejecución solicitada, todavía no verificada. Ya existe un artefacto de desarrollo con packs enlazados y tipos oficiales estables; véanse CINETICA.md y PRUEBAS_MANUALES.md. No hay mundo de prueba, cliente Windows ni Realm accesible en esta tarea. La validación local de JSON no demuestra funcionamiento en Realms.

Diseño base: behavior pack + resource pack, módulos oficiales estables, sin API beta, sin experimentos requeridos, sin mods Java, plugins de servidor, ejecutables externos o servicios de red como parte del gameplay. Verificar las condiciones vigentes del servicio antes de declarar compatibilidad. Realms puede actualizarse independientemente; comprobar tanto versión del cliente como del mundo/servidor.

## Prerrequisitos y matriz de aceptación

| Prueba | Escenario | Criterio | Estado |
|---|---|---|---|
| Importación Windows | Instalar .mcaddon en versión estable confirmada | Ambos packs enlazados, sin errores de contenido/API | No ejecutada |
| Supervivencia | Obtener materiales y usar primera máquina sin comandos | Progresión completa y drops correctos | No ejecutada |
| Creativo | Buscar, colocar y romper todos los IDs publicados | Estados y orientaciones válidos | No ejecutada |
| Realm | Subir copia respaldada del mundo y packs | Arranque sin flags experimentales ni APIs faltantes | No ejecutada |
| Dos jugadores | Interacción simultánea con inventario y manual | Una sola transacción, sin duplicaciones | No ejecutada |
| Idiomas | Clientes es_MX y en_US | Textos y formato correctos por jugador | No ejecutada |
| Desconexión | Salir en mitad de trabajo/UI | Sin consumo por UI cancelada ni pérdida | No ejecutada |
| Reinicio y restauración | Descargar/subir mundo y reiniciar Realm | Persistencia y recuperación idempotentes | No ejecutada |
| Chunks/dimensiones | Alejarse y volver, cambiar dimensión | Pausa segura y reconstrucción de redes | No ejecutada |
| Actualización de pack | Migración con backup y rollback ensayado | Inventarios preservados, UUID estables | No ejecutada |
| Carga sostenida | Fábricas crecientes con dos clientes | Medir ticks, memoria y colas; fijar límites reales | No ejecutada |

No prometer trenes ni fábricas activas en chunks descargados. No confiar en un jugador concreto como propietario del tick global. La animación local puede degradarse con latencia, pero los objetos y trabajos son del servidor. Respetar las restricciones de cada mundo y no asumir que scripts pueden reproducir todas las reglas de protección de plugins externos.

Guardar resultados con versión completa del cliente, módulos, pack, modo de juego, experimentos, dimensiones, semilla/mundo de prueba y logs sin datos personales. La publicación requiere backup, evidencia Windows y Realm, y prueba de recuperación. Estas pruebas necesitan acceso real al juego/servicio; el pipeline no las marcará automáticamente como aprobadas.


## Actualización de fábrica 0.4.1

Prensa y embudo filtrado implementados en código con pruebas Node; integración Minecraft/Realms pendiente. Tres procesos de láminas, barriles nativos, inventarios conservadores y tutorial de supervivencia sin comandos. Ocho máquinas restantes pendientes. La descripción actual y las diferencias Java/Bedrock de esta vertical están en [FABRICA.md](FABRICA.md); las indicaciones anteriores sin procesamiento describen hitos previos.
