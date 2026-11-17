---
title: "Guía de estilo del blog"
date: 2026-11-09
description: "Todo lo que se puede escribir en un post: código, gráficas, callouts e imágenes."
lang: es
draft: true
---

Este post es `draft: true`: solo se ve en `npm run dev`, nunca en producción. Úsalo como chuleta. Puedes enlazar otros posts con wikilinks, como [[maps|el post de MAPS]], ==resaltar texto== y dejar %%comentarios que no se publican%%.

## Código

Bloque con título y líneas resaltadas (`{2-3}` tras el título):

```python title="train.py" {2-3}
def train(model, loader, opt):
    for x, y in loader:
        loss = model(x).cross_entropy(y)
        opt.zero_grad()
        loss.backward()
        opt.step()
```

Diffs y resaltado con comentarios mágicos:

```ts
export function score(a: number, b: number) {
  return a + b // [!code --]
  return Math.hypot(a, b) // [!code ++]
}

const cache = new Map<string, number>() // [!code highlight]
```

```bash
npm run publish
```

## Gráficas

Una gráfica es un bloque `chart` con YAML. Colores, tipografía y modo claro/oscuro salen del sistema de diseño de la web.

```chart
type: line
title: Pérdida de validación
x: [1, 2, 3, 4, 5, 6, 7, 8]
series:
  - name: baseline
    data: [2.31, 1.92, 1.71, 1.60, 1.55, 1.52, 1.51, 1.50]
  - name: con warmup
    data: [2.20, 1.70, 1.48, 1.37, 1.31, 1.28, 1.26, 1.25]
x_label: época
y_label: loss
```

```chart
type: bar
title: Tokens por segundo
x: [A100, H100, B200]
series:
  - name: fp16
    data: [1450, 3100, 5200]
  - name: fp8
    data: [0, 4800, 8900]
caption: Batch 32, secuencia 2k.
```

## Callouts

> [!note] Nota
> Los callouts de Obsidian funcionan tal cual.

> [!warning]
> Y el tipo `warning` usa el naranja.

## Imágenes

Pega imágenes en Obsidian con normalidad (`![[captura.png]]`); `npm run sync` las encuentra en el vault y las copia a la web.

| modelo | params | MMLU |
| --- | ---: | ---: |
| small | 125M | 31.2 |
| base | 1.3B | 48.9 |
