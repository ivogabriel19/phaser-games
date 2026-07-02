# pico_park — guía del proyecto

## Qué es esto

Un clon simplificado de *Pico Park*: varios jugadores cooperan en la misma
pantalla para llegar a una meta. Es uno de varios mini-juegos Phaser 3 del
repo (`dyno`, `pico_park`, `pokemon-map`, `race-driver`), pero **este es el
que se está puliendo activamente**.

**Objetivo del proyecto:** llegar a un MVP sólido y jugable para mostrarle a
alumnos, sirviendo tres propósitos a la vez:

1. **Referencia jugable** — algo que se pueda abrir y jugar sin fricción.
2. **Referencia de código** — ejemplo de cómo estructurar un juego Phaser
   con buenas prácticas, no un prototipo tirado.
3. **Referencia educativa** — el código tiene que poder leerse y explicarse
   en clase. Preferí claridad por sobre "cleverness".

Esto significa que **la calidad del código importa tanto como que el juego
funcione**. No es un proyecto descartable: cada feature que se agregue debe
quedar prolija, modular y fácil de explicar.

## Cómo correrlo

No hay build tool ni `package.json`: es JS vanilla con ES modules nativos,
cargado directo en `index.html`. Phaser 3.88.2 se trae por CDN (`<script>` en
`index.html`), y `src/lib/phaser.js` sólo re-exporta `window.Phaser` para que
el resto de los módulos puedan hacer `import Phaser from '...'`.

Para correrlo: servir la carpeta con un servidor estático (el proyecto está
configurado para la extensión Live Server de VS Code, puerto 5501) y abrir
`index.html`. Abrir el `index.html` con `file://` directo no funciona porque
los ES modules requieren HTTP.

## Arquitectura actual

```
index.html                 → carga Phaser (CDN) + src/game.js como module
src/config.js               → Phaser.Game config + registro de todas las escenas
src/game.js                  → arranca Phaser.Game y dispara la escena PRELOAD
src/scenes/
  scene-keys.js              → claves de escena centralizadas (evita strings sueltos)
  preload-scene.js            → carga los assets globales (sprites de jugadores) y
                              muestra la bienvenida + selector de nivel. Es la
                              escena inicial y el "menú principal".
  levels.js                  → lista de niveles jugables ({ title, sceneKey }),
                              consumida por preload-scene para armar el selector.
                              Agregar un nivel nuevo = agregar una entrada acá.
  movement-test-scene.js      → primer nivel: laboratorio de movimiento (piso,
                              3 jugadores, colliders, input WASD/flechas/IJL,
                              triple salto). Acá vive el gameplay real hoy.
src/types/phaser.d.ts       → tipos para autocompletado en el editor
assets/                     → sprites por jugador (Sprite-0001/2/3.png), más un
                              pack de personajes con animaciones completas
                              (assets/1 Pink_Monster, 2 Owlet_Monster, 3 Dude_Monster)
                              sin usar todavía — candidato natural para reemplazar
                              los sprites placeholder
art_lab/                    → sprites de trabajo (.ase de Aseprite + .png exportado)
```

Patrón de escenas: `PreloadScene` es la única que carga assets globales y
sirve de menú; cada nivel es su propia escena registrada en `config.js` y
listada en `levels.js`. Para agregar un nivel nuevo: crear la escena, sumarla
al array `scene` de `config.js`, agregar su key en `scene-keys.js` y una
entrada en `levels.js` — no hace falta tocar `preload-scene.js`.

## Estado actual (honesto)

- Física arcade con gravedad, piso estático, 3 jugadores con colliders entre
  sí y con el piso. Funciona (en `movement-test-scene.js`).
- Movimiento horizontal (WASD / flechas / IJL, un set de teclas por jugador)
  y salto con triple salto. Funciona.
- Animaciones: sólo `idle` está creada y reproducida para cada jugador. No
  hay animación de caminar ni de salto — los jugadores se deslizan sin
  animar al moverse.
- Hay una plataforma central (1/4 del ancho de pantalla) posicionada a la
  altura de un doble salto, calculada a partir de `jumpSpeed` y la gravedad
  en vez de hardcodeada — ver `createMiddlePlatform()`. No hay más
  plataformas que ésa y el piso base.
- Arriba de la pantalla se muestran los controles de cada jugador,
  coloreados igual que su sprite (`createControlsHint()`).
- Hay una meta (`createGoal()`) arriba de la plataforma central, a la altura
  de un triple salto hecho por un jugador parado sobre otro (usa el mismo
  helper `getChainedJumpHeight()` que la plataforma, sin duplicar la
  fórmula). Es un desafío repetible, no un final de nivel: cuando los 3
  jugadores la tocan a la vez se muestra un mensaje breve y la meta
  reaparece a la misma altura en una X distinta (`relocateGoal()`), para
  seguir practicando el mismo truco en otro punto del nivel.
- El selector de niveles sólo tiene una entrada (`Prueba de movimiento`) —
  es el primer nivel de una serie que se va a ir armando para enseñar
  conceptos de desarrollo, uno por escena.
- No hay tests ni linter configurado.

## Convenciones de código a seguir

- **Un archivo, una responsabilidad.** Si `preload-scene.js` sigue creciendo,
  separar en módulos (ej. `player.js` para la lógica de un jugador,
  `input.js` para el mapeo de teclas, `hud.js`, etc.) en vez de amontonar
  todo en la escena.
- **Sin números mágicos sueltos.** Cosas como velocidad de movimiento,
  fuerza de salto, cantidad máxima de saltos ya están en variables
  (`moveSpeed`, `jumpSpeed`, `maxJumps`) — seguir ese patrón para todo
  parámetro de gameplay nuevo.
- **Sin `if/else` repetido por jugador.** El código actual repite la misma
  lógica de input/salto tres veces (una por jugador). Antes de agregar un
  cuarto jugador o una feature nueva, refactorizar a una estructura de datos
  (array/clase `Player`) que itere, en vez de copiar y pegar el bloque de
  nuevo.
- **Nombres en inglés para código, comentarios y mensajes al alumno en
  español.** Mantener consistencia con lo que ya existe (`SCENE_KEYS`,
  `moveSpeed`, etc.).
- **Comentarios sólo cuando expliquen el "por qué"**, no el "qué". El código
  tiene que ser lo bastante claro como para no necesitar traducción
  línea por línea — es la mejor forma de que sirva de ejemplo.
- **No agregar dependencias ni build tooling sin necesidad real.** El
  proyecto es deliberadamente simple (CDN + ES modules) para que un alumno
  pueda leerlo de punta a punta sin entender webpack/vite primero. Si en
  algún momento hace falta un bundler, discutirlo antes de introducirlo.

## Roadmap hacia el MVP

Primer hito acordado, a construir dentro de `movement-test-scene.js`:

1. ✅ Agregar una plataforma para saltar (no sólo el piso).
2. Conectar las animaciones de caminar y salto (hoy sólo existe `idle`).
3. ✅ Agregar una meta que gane el nivel cuando los 3 jugadores la alcanzan.

La lógica de juego ya está separada de `PreloadScene` (que ahora es sólo
carga de assets + menú) hacia `movement-test-scene.js`. Si esa escena crece
mucho al agregar lo de arriba, el siguiente paso de modularización es sacar
la lógica de un jugador a su propia clase/módulo (ver "Convenciones de
código") en vez de seguir agregando todo al `create()`/`update()` de la
escena.

## Nota sobre el resto del repo

Este `CLAUDE.md` aplica sólo a `pico_park/`. Los otros juegos del repo
(`dyno`, `pokemon-map`, `race-driver`) no forman parte de este esfuerzo de
pulido; no tocarlos salvo que se pida explícitamente.
