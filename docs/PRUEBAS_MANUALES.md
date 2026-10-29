> Estado vigente QA 0.4.2: [ESTADO_FUNCIONAL.md](ESTADO_FUNCIONAL.md). Esta página conserva el historial; las pruebas nativas actuales están en [PRUEBAS_WINDOWS.md](PRUEBAS_WINDOWS.md) y [PRUEBAS_REALMS.md](PRUEBAS_REALMS.md).

# Comprobaciones manuales — todas pendientes

No hay cliente Windows ni Realm en este entorno. Registrar versión completa, hash del .mcaddon, dispositivos, modo, experimentos (deben permanecer apagados), Content Log y resultado por escenario. No marcar aprobado por compilar TypeScript.

- [ ] Importar ambos packs sin errores de versión, UUID o dependencias; cargar mundo sin errores de Script API/JSON en Content Log.
- [ ] Confirmar carga efectiva de server 2.11.0 y server-ui 2.3.0 en Bedrock 26.60 y Realm.
- [ ] Cambiar idioma a es_MX y en_US: nombres de packs, bloques, objetos, entidad y manual; ninguna clave cruda visible.
- [ ] Obtener manual en creativo y supervivencia, usarlo en aire y sobre bloque; comprobar que itemUse se emite. Navegar recetas y cerrar. Si el evento no se emite para el objeto, corregir su interacción usando un componente estable antes de aprobar.
- [ ] Usar manual con otro formulario/chat abierto y durante desconexión; no excepciones repetidas ni bloqueo permanente de sesión.
- [ ] Dos jugadores abren/cancelan el manual simultáneamente sin interferencia; desconectar/reconectar y volver a abrir.
- [ ] Localizar engranaje, eje y componentes en creativo; iconos sin magenta/negro ni UV fuera de textura.
- [ ] Colocar los ocho bloques en distintas superficies, probar los ejes X/Y/Z y las cuatro caras de gearbox; revisar geometría, selección y colisión declaradas. Agacharse e interactuar debe alternar eje.
- [ ] Romper cada bloque en supervivencia y comprobar su drop exacto; creativo no debe duplicar drops.
- [ ] Mesa: cobre + pepita de hierro → componente de engranaje; hierro → componente de eje; componente → bloque correspondiente; libro + cobre → manual. Verificar consumo y cantidades; son recetas originales de desarrollo.
- [ ] Invocar entidad de muestra, ver rotación suave del rotor sin avisos de render/animación, comprobar que no parece una máquina funcional; eliminarla al terminar.
- [ ] Ejecutar playsound del evento propio y comprobar ausencia de clipping/molestias y volumen razonable; audio espacial y recepción por segundo cliente.
- [ ] Guardar/reabrir mundo con bloques de muestra; descargar/recargar chunks sin desaparición ni errores. No hay trabajos o inventarios propios que persistir aún.
- [ ] Subir copia del mundo a Realm, verificar descarga del RP por segundo cliente y repetir manual, bloques, animación, sonido y recetas.
- [ ] Reiniciar Realm; comprobar persistencia de bloques y reapertura de manual. Medir comportamiento básico antes de ampliar contenido.
- [ ] Ensayar actualización conservando UUID, incrementando versiones y respaldo; restaurar el backup en caso de fallo.

Si un escenario falla, conservar diagnóstico concreto y corregir el pack. No habilitar API beta o experimentos como solución silenciosa. La distribución pública requiere completar revisión legal y pruebas; el artefacto actual es de desarrollo.


## Cinética 0.2.0 — pruebas de integración pendientes

- [ ] Completar la demostración de CINETICA.md en un área de prueba vacía. El comando sobrescribe las posiciones listadas; comprobar previamente el volumen y el backup.
- [ ] Validar que el agua nativa que desciende adquiere liquid_depth >= 8 con agua encima, enciende la rueda a +8 RPM y produce -16 RPM y 128/256 SU en los medidores de la escena.
- [ ] Verificar rotación con signo y parada de los ocho rotores; agujas coherentes y sin modelos duplicados/z-fighting. El HUD debe traducirse a es_MX/en_US y corresponder al grafo.
- [ ] Medidor de esfuerzo: 8→64 produce sobrecarga y cero RPM; 64→0 recupera. Retirar agua, usar agua quieta, inundar ambos lados y cambiar el eje de rueda a Y deben apagarla conforme al criterio documentado.
- [ ] Romper y reponer un eje; separar la red en tres ramas; eliminar una fuente durante el cálculo; confirmar que ninguna mitad sin fuente sigue girando.
- [ ] Dos jugadores colocan/rompen/rotan componentes y fuentes simultáneamente: no duplicación, publicación parcial ni excepción repetida. Fuentes incompatibles deben detener sin destruir bloques.
- [ ] Descargar y recargar un chunk que cruce la red; interrumpir el servidor; reiniciar el Realm. RPM de visuales se reinician en 0 y solo vuelven tras reconstrucción. Eje, selección de fuente y modo de freno deben persistir.
- [ ] Probar sustituciones por /setblock, explosiones y rotura creativa: limpiar visuales huérfanos y conservar drops correctos. No se permite mover bloques cinéticos mediante pistones.
- [ ] Incrementar redes bajo carga y registrar latencia, TPS y cantidad de visuales. Confirmar pausa conservadora tras caducar lecturas y límite de 256 visuales; no extrapolar el test puro de 3.000 nodos a rendimiento real en Realms.


## Manual 0.3.0 — pruebas de integración pendientes

- [ ] Fabricar 1 Manual de Ingeniería Mecánica con 1 libro + 1 cobre; revisar consumo, cantidad, nombre e icono en supervivencia y creativo. No debe consumirse al abrirlo.
- [ ] Abrir mediante uso en aire y sobre bloque. Comprobar ambos callbacks registrados y fallback itemUse sin abrir dos formularios, aun manteniendo pulsado usar.
- [ ] Abrir con chat/otro inventario abierto; cancelar o cerrar; volver a abrir después del límite de 10 ticks. No bloquear sesión ni cerrar pantallas ajenas por fuerza.
- [ ] Revisar las once categorías, filtros de origen/estado y búsquedas como eje, shaft, latón y brass; verificar acentos, vacío y texto muy largo.
- [ ] Desde caja de engranajes, consultar ingredientes, cantidades, usos del engranaje, receta relacionada, alternativas y Volver. Deben conservarse búsqueda y página previas.
- [ ] Comparar las once recetas mostradas con su fabricación real. El libro no debe mostrar recetas Java como fabricables aunque compartan nombre con un bloque propio.
- [ ] Abrir una secuencia Java: ver loops, pasos y pesos; un peso 120 no debe presentarse como porcentaje. Consultar fluidos mB y condiciones de calor/mods sin ejecutarlas en Bedrock.
- [ ] Abrir imágenes ampliadas en CustomForm y comprobar el UUID del RP, PNG, botones y retorno; revisar ambas localizaciones y que ningún texto muestre claves crudas.
- [ ] Recorrer los doce pasos de los tres tutoriales; comprobación debe fallar con otro bloque, RPM equivocadas o grafo pendiente. Aprobar únicamente al mirar el bloque y valores correctos; no debe construirse nada al pulsar comprobar.
- [ ] Dos jugadores buscan/navegan de forma independiente; uno se desconecta con un formulario abierto y regresa. Las respuestas de su sesión antigua no deben afectar la nueva.
- [ ] Importar la actualización preservando UUID; volver a probar la demo cinética, funcionamiento del agua, sobrecarga, división y recarga de chunks mientras alguien consulta el manual.
- [ ] Repetir en Realm con RP descargado en ambos clientes. Medir tiempo de primera apertura y memoria/carga del catálogo; las pruebas Node no sustituyen el rendimiento real.


## Actualización de fábrica 0.4.1

Prensa y embudo filtrado implementados en código con pruebas Node; integración Minecraft/Realms pendiente. Tres procesos de láminas, barriles nativos, inventarios conservadores y tutorial de supervivencia sin comandos. Ocho máquinas restantes pendientes. La descripción actual y las diferencias Java/Bedrock de esta vertical están en [FABRICA.md](FABRICA.md); las indicaciones anteriores sin procesamiento describen hitos previos.
