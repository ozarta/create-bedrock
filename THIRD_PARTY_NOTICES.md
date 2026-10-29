# Dependencias y avisos

En 0.2.0 se consultaron las reglas cinéticas y la documentación/código de Create Java 6.0.10, tag `mc1.21.1-6.0.10`, SHA `ac0c444d9828da3453ae8cc65338e8de063286fb`. La conexión de ejes/engranajes/cajas y las fórmulas de esfuerzo se reimplementaron en TypeScript para este proyecto. Se conserva el aviso MIT completo de The Create Team / The Creators of Create en `licenses/Create-code-MIT.txt` y dentro del Behavior Pack. En 0.3.0 también se extrajeron los datos técnicos MIT de 1.884 JSON de recetas y los tags disponibles, fuera de assets, conservando rutas y hashes en data/reference. Se redistribuyen como referencia dentro del catálogo, con el mismo aviso MIT. No se incorporaron recursos artísticos de Create; su carpeta `src/main/resources/assets/` es All Rights Reserved conforme al LICENSE.md de ese commit. No se incorporaron las dependencias Java del mod.

Fuentes: https://github.com/Creators-of-Create/Create/blob/ac0c444d9828da3453ae8cc65338e8de063286fb/LICENSE.md y las rutas citadas en docs/CINETICA.md. El grafo incremental, la caducidad, la adaptación Bedrock del agua y los recursos visuales son trabajo nuevo; las diferencias con Java están documentadas.

Dependencias instaladas solo para desarrollo, según sus metadatos npm y package-lock.json:

| Paquete | Versión | Licencia declarada |
|---|---|---|
| @minecraft/server | 2.11.0 | MIT |
| @minecraft/server-ui | 2.3.0 | MIT |
| @minecraft/common | 1.3.0 | MIT |
| @minecraft/vanilla-data | 1.26.60 | MIT |
| typescript | 5.9.3 | Apache-2.0 |

El .mcaddon no incluye estos paquetes ni el compilador: contiene JavaScript propio con referencias a módulos provistos por Minecraft. No se redistribuyeron sus definiciones TypeScript ni documentación oficial. Para redistribuir las herramientas/dependencias completas, conservar sus avisos y licencias correspondientes; TypeScript incluye LICENSE.txt y ThirdPartyNoticeText.txt en su distribución npm. Los paquetes @minecraft consultados declaran MIT en package.json pero no traían un LICENSE separado; no se inventó su texto/copyright.

Python/Node y FFmpeg se usan como herramientas del entorno; sus binarios no se empaquetan. FFmpeg/libvorbis codifican un WAV sintetizado desde cero, no un sample externo. La licencia de una herramienta no se atribuye automáticamente a los archivos de sonido creados con ella.

Los recursos propios se registran en assets_source/provenance.json, con hash y fuente. La licencia pública de código/arte propios queda pendiente de decisión del titular del proyecto. No atribuir MIT a todo el add-on por las licencias de sus herramientas.
