# Vinylo/84 — Amber Workstation

Portfolio estático inspirado en estaciones UNIX y terminales ámbar de los años 80. Sin dependencias ni compilación.

## Ejecutar

```bash
python3 -m http.server 8080
```

Abre http://localhost:8080. También puede abrirse index.html directamente.

## Publicar

Crea una rama independiente en tu repositorio, copia index.html, style.css, script.js y assets/ a su raíz, prueba y publica cuando estés conforme. Conserva la versión anterior en otra rama o carpeta. No se ha modificado el repositorio original.

## Personalización

- Edita los datos profesionales y los enlaces en index.html.
- Correo profesional: void@0vinylo0.xyz. CV público en assets/cv.pdf, sin teléfono ni domicilio exacto.
- Ajusta los archivos virtuales y comandos en script.js.
- Los colores se definen en :root de style.css.
- FX desactiva efectos visuales y guarda la preferencia; se respeta prefers-reduced-motion.
- Las animaciones y la terminal son simulaciones locales, no datos de monitorización ni ejecución de comandos reales.
- El diagrama GIS es conceptual y no contiene información interna de infraestructura.

## Comandos de terminal

help, ls, cd, cat, tree, pwd, whoami, clear, man, uname, open, history. TAB para completar; flechas arriba/abajo para historial.
