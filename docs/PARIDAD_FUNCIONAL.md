# Paridad funcional propuesta

Objetivo: máxima paridad funcional técnicamente demostrable; no prometer equivalencia de motores. La base 0.1.0 fija el destino interno `[1,26,60]` a partir del tag oficial estable v1.26.60.5 y usa tipos estables server 2.11.0 / UI 2.3.0. Véase BASE_TECNICA.md. La versión 0.2.0 implementa el subconjunto cinético y el manual descritos en CINETICA.md, con pruebas Node. El resto sigue siendo evaluación preliminar. Nada está probado dentro del juego.

| Sistema | Evaluación preliminar | Dependencias estables a verificar | Límite y criterio de aceptación |
|---|---|---|---|
| Bloques y objetos propios | Viable en principio | Componentes custom, estados, eventos de interacción | Colocación/rotura, orientación, drops y creativo sin experimentos |
| Redes cinéticas estáticas | Viable como simulación propia | Lectura de bloques, eventos, scheduler, persistencia | Relaciones, signo y esfuerzo deterministas; nada corre sobrecargado |
| Prensa y molino | Viable como estación lógica | ItemStack, contenedores, eventos, persistencia | Sin pérdida ni duplicación al romper, salir o reconectar |
| Recetas vanilla | Viable para formatos soportados | Esquemas y tipos vigentes | Libro/mesa/horno según formato; validar en juego |
| Recetas Create | Motor propio necesario | Inventarios y catálogo propio | No asumir que JSON Java se ejecuta en Bedrock |
| Cintas, filtros y brazos | Aproximación | Inventarios, entidades visuales, consultas acotadas | Conservación de objetos y orden estable; límite de objetos visuales |
| Fluidos y calor | Aproximación lógica | Persistencia, eventos y reglas de bloques | Unidades enteras, sin fluido Java continuo ni nuevos fluidos nativos supuestos |
| Deployer | Subconjunto de acciones | Uso/rotura/colocación disponibles y permisos | Sin emulación general del jugador falso o sus mods |
| Redstone | Aproximación temporal | Lectura de señal/eventos soportados | Documentar latencia; no prometer ticks idénticos a Java |
| Manual interactivo | Viable en principio | server-ui estable, interacción con objeto | Navegación y recetas en es_MX/en_US, cancelación segura |
| Contraptions | Paridad completa no sustentada | Transformaciones de entidades, bloques, pasajeros | No asumir bloques móviles arbitrarios con colisión e inventario intactos |
| Trenes | Investigación de alto riesgo | Entidades, rutas y disponibilidad de chunks | No prometer movimiento por chunks descargados ni física ferroviaria Java |
| Realms | Condicional | Packs y módulos estables admitidos por el servicio | Probar mundo real con dos clientes, reinicio y actualización |
| Recursos originales | Viable como producción artística | Formatos de textura, geometría, animación, audio | Procedencia documentada y ausencia de recursos upstream |

No se puede garantizar equivalencia de contraptions, trenes, timings redstone, carga permanente de chunks, NBT arbitrario o integración con mods Java. Las alternativas son diseños por probar, no imposibilidades absolutas atribuidas a una API aún no consultada.

El presupuesto de CPU, almacenamiento persistente y tamaños de propiedades debe medirse en la versión elegida. No se inventan límites numéricos del motor. El rendimiento debe degradarse pausando trabajos, nunca eliminando recursos del jugador. Todas las mecánicas deben aplicar las mismas reglas autoritativas en creativo y supervivencia; creativo solo altera obtención conforme al diseño explícito.


## Actualización de fábrica 0.4.1

Prensa y embudo filtrado implementados en código con pruebas Node; integración Minecraft/Realms pendiente. Tres procesos de láminas, barriles nativos, inventarios conservadores y tutorial de supervivencia sin comandos. Ocho máquinas restantes pendientes. La descripción actual y las diferencias Java/Bedrock de esta vertical están en [FABRICA.md](FABRICA.md); las indicaciones anteriores sin procesamiento describen hitos previos.
