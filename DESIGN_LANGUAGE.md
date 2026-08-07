# Design Language — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> Esto no es un Design System (los tokens implementables viven en [`PDS.md`](./PDS.md) §6)
> — es el **por qué** detrás de esos tokens: la personalidad que hace que el producto se
> sienta como sí mismo y no como una plantilla genérica.

## Personalidad

Si Pendientes Pro fuera una persona: alguien organizado pero no rígido, cálido pero no
informal, rápido pero no apurado. No es el compañero de trabajo que llena la sala de
post-its de colores (ruidoso) ni el que usa una libreta en blanco y negro sin decoración
(frío). Es el que tiene su escritorio ordenado, con luz cálida de tarde, y encuentra
cualquier cosa en dos segundos porque cada cosa tiene un solo lugar.

## Tono visual

**Cálido, translúcido, disciplinado.** Tres palabras que en la mayoría de productos de
productividad son mutuamente excluyentes — la calidez tiende a la decoración
(TickTick), la disciplina tiende a la frialdad (Linear, Things). Pendientes Pro apuesta
a sostener las tres a la vez: superficies de vidrio (`.glass`) sobre un fondo ambiental
cálido, con una disciplina de composición que jamás deja que esa calidez se convierta en
ruido visual.

## Emociones que el producto busca generar

| Momento | Emoción objetivo | Cómo se logra |
|---|---|---|
| Abrir la app a la mañana | Calma, no presión | Hoy muestra lo esencial, no todo lo pendiente del universo (`PDS.md` §2.11) |
| Capturar algo rápido | Alivio inmediato | La captura confirma con un destello suave, sin pedir más datos de los necesarios |
| Completar una tarea | Satisfacción breve | El rebote `ease-spring` (`PDS.md` §7.3) es la firma táctil de "logrado" |
| Encontrar algo vencido | Urgencia clara, sin ansiedad | Rojo reservado y usado con moderación — nunca parpadeante, nunca en loop |
| Volver tras días sin usarla | Reencuentro, no culpa | Sin contadores de racha rota ni notificaciones de "extrañamos verte" |
| Personalizar el espacio (widgets) | Propiedad, "esto es mío" | El sistema de widgets (`WORKSPACE_SYSTEM.md`) hace que cada escritorio se vea distinto sin dejar de sentirse parte del mismo producto |

## Ritmo

El ritmo visual de Pendientes Pro es de **respiración lenta, respuesta rápida**. Lento
en composición: los bloques de contenido tienen aire generoso entre sí (rejilla de 4px
aplicada con generosidad, no al mínimo posible — `PDS.md` §6.1). Rápido en interacción:
ninguna acción frecuente tarda más de 220ms en responder (`PDS.md` §7.1). Este
contraste deliberado —pantalla tranquila, interacción ágil— es lo que distingue el
ritmo de este producto del de Notion (lento en ambos: composición y respuesta densas) y
del de Linear (rápido en ambos, sin momentos de calma visual).

## Espacios

El espacio en blanco no es lo que sobra — es lo que separa lo importante de lo
secundario (Principio implícito, ver `PRODUCT_PRINCIPLES.md`). La rejilla de 4px
(`PDS.md` §6.1) no es una restricción técnica, es la herramienta de este ritmo: cada
salto de espaciado (de 16 a 24, de 24 a 32) es una declaración de "esto termina una idea
y empieza otra". Un espaciado ambiguo (ni claramente junto ni claramente separado) es
el error visual más silencioso y más común — este lenguaje lo prohíbe por diseño, no
por revisión manual caso a caso.

## Jerarquía

Tres niveles, nunca más (`PDS.md` §6.3: Display, Cuerpo, Metadato). La jerarquía no se
logra por combinaciones creativas de tamaño y peso — se logra por **repetición
disciplinada** de tres relaciones ya definidas. Un usuario que aprende a leer una
pantalla de Pendientes Pro aprende a leerlas todas, porque la jerarquía nunca se
reinventa vista por vista.

## Filosofía del color

El color en este producto tiene tres trabajos, y cada uno vive en su propia capa —
nunca mezclados (`PDS.md` §6.4, Principio 9 de `PRODUCT_PRINCIPLES.md`):

1. **Marca** (índigo-violeta 250°): significa "esto es la app hablándote" — navegación
   activa, foco, la acción principal de cada pantalla. Es deliberadamente cálido dentro
   de la familia de los violetas (no el azul frío de Linear/Notion), porque la marca
   tiene que sentirse tan cálida como el fondo que la rodea.
2. **Semántico** (rojo/ámbar/verde): significa "esto es un estado del mundo, no una
   opinión de la app" — vencido, en curso, completado. Reservado, nunca decorativo.
3. **Ambiental** (los radiales cálidos de fondo): significa "estás en tu espacio" — es
   atmósfera, nunca portador de información que el usuario necesite leer con precisión.

La regla que sostiene todo esto: **si dos elementos usan el mismo color, deben
significar lo mismo.** El error más caro que un competidor comete (y que la crítica de
`PDS.md` §1.8 documentó en la captura de referencia) es reusar un color por conveniencia
visual sin preguntarse si ya tiene un significado asignado en otro lugar de la pantalla.

## Filosofía de la tipografía

Tres familias con tres trabajos (`PDS.md` §6.3, ya presentes en la app real: Space
Grotesk para Display, Plus Jakarta Sans para Cuerpo, JetBrains Mono para datos/código).
Space Grotesk existe para dar carácter — sus formas geométricas con un toque de
personalidad son lo que hace que un título de Pendientes Pro no se confunda con un
título de una plantilla de sistema operativo genérica. Plus Jakarta Sans existe para
desaparecer — cuando el usuario está leyendo una descripción o un comentario, la
tipografía no debe notarse. JetBrains Mono existe para precisión — cualquier dato que
deba leerse exactamente (una hora, un conteo, código) usa una fuente monoespaciada
donde cada carácter ocupa el mismo ancho, eliminando ambigüedad visual.

## Filosofía del movimiento

El movimiento en Pendientes Pro nunca es gratuito (Principio 11 de
`PRODUCT_PRINCIPLES.md`) — cada transición existe para responder una de estas tres
preguntas: *¿qué acabo de hacer?* (confirmación), *¿de dónde vino esto?* (origen
espacial), o *¿qué tan importante es este cambio?* (jerarquía de atención). La firma de
marca es el rebote `ease-spring` (`PDS.md` §7.2) — una curva con un leve
sobre-impulso que comunica "logrado" sin la formalidad de un simple fade. Se usa con
moderación deliberada: si apareciera en cada interacción, dejaría de sentirse especial.

## Por qué el producto se siente diferente

Ningún competidor de referencia combina estas cinco decisiones a la vez: paleta cálida
(no fría) + tres capas de color estrictamente separadas + tres niveles tipográficos sin
excepción + rejilla de espaciado disciplinada + una firma de movimiento reconocible y
usada con moderación. Cada una por separado existe en algún competidor — Craft tiene
calidez, Linear tiene disciplina de jerarquía, Things tiene moderación de motion. Ninguno
tiene las cinco juntas. Esa combinación, sostenida con consistencia a través de cada
pantalla nueva que se agregue, es la identidad que este documento existe para proteger.
