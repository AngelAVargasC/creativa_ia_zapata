# Backup — fondo original del login (aurora CSS)

Respaldo del fondo procedural (aurora + orbes + rejilla + grano) que estaba en
`src/app/login/login.module.css` antes de reemplazarlo por imágenes de fondo.
Para revertir: restaurar el `background` de `.split` (dark y light) a estos valores
y volver a mostrar las capas `.aurora`, `.grid`, `.grain` en el JSX del login/registro.

## `.split` — fondo base (variante OSCURA, por defecto)

```css
--lg-bg:
  radial-gradient(70% 90% at 42% 50%, rgba(140, 16, 22, 0.4) 0%, rgba(140, 16, 22, 0) 60%),
  radial-gradient(140% 120% at 100% 0%, #170606 0%, rgba(23, 6, 6, 0) 55%),
  linear-gradient(155deg, #0a0303 0%, #000000 60%);
```

## `:global([data-theme='light']) .split` — variante CLARA

```css
--lg-bg:
  radial-gradient(70% 90% at 42% 50%, rgba(251, 67, 57, 0.1) 0%, rgba(251, 67, 57, 0) 60%),
  radial-gradient(140% 120% at 100% 0%, #ffe2df 0%, rgba(255, 226, 223, 0) 55%),
  linear-gradient(155deg, #fdf3f2 0%, #ffffff 62%);
```

## Capas procedurales (aurora / rejilla / grano)

Los orbes (`.orb1`..`.orb5`), la `.aurora` (blur + mix-blend), la `.grid` (rejilla
técnica con máscara radial) y `.grain` (ruido SVG) formaban el fondo animado.
Sus reglas siguen en `login.module.css`; si se revierte, hay que volver a renderizar
`<div className={styles.aurora}>…</div>`, `<span className={styles.grid} />` y
`<span className={styles.grain} />` en `page.tsx` (login y registro).

## Reemplazo actual

- Oscuro: `/media/fondos login/Fondo Dark.png`
- Claro: `/media/fondos login/fondo ligth.png`
</content>
</invoke>
