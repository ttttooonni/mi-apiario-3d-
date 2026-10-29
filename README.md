# Mi Apiario 3D (demostración)

Prototipo independiente para explorar un apiario en 3D (React 19 + TypeScript + Vite + three.js) con un cuaderno apícola de práctica.
Web: https://ttttooonni.github.io/mi-apiario-3d-/

**Todos los datos son ficticios.** No hay ninguna conexión con [Mi Apiario](https://github.com/ttttooonni/mi-apiario): no lee, importa ni modifica sus datos.

## Qué puedes probar
- Escena 3D con 10 colmenas: girar (arrastrar / un dedo), zoom (rueda, pellizco o ＋/−), vista general ⌂, vista superior ▦ y colmena anterior/siguiente ‹ ›.
- Al seleccionar una colmena se abre su tapa; tocando un cuadro se registra una inspección. Alternativa sin 3D: botón «Inspeccionar un cuadro» en la ficha.
- Tutorial guiado de 4 pasos que avanza solo al hacer cada acción (seleccionar colmena, inspeccionar cuadro, guardar observación, crear tarea). Botones «Anterior» y «Salir del tutorial»; se retoma desde «🎓 Tutorial».
- Cuaderno: revisiones, sanidad, alimentación (crear, editar, borrar con confirmación), tareas (crear, editar, completar, borrar con confirmación), producción por lotes, fichas nuevas y acciones por lote.
- Color de reina calculado del año con el código internacional (1/6 blanco, 2/7 amarillo, 3/8 rojo, 4/9 verde, 5/0 azul).

## Datos en el navegador
- `mi-apiario-3d.demo.v1`: datos de demostración (colmenas, registros, tareas, lotes).
- `mi-apiario-3d.tutorial.started`: indica que ya viste la bienvenida.

Cada cambio se escribe y se relee; si falla (sin espacio, modo privado, almacenamiento bloqueado) la app lo dice y no afirma haber guardado. Si los datos guardados están dañados no se sobrescriben y puedes descargar el contenido original.

**Exportar:** «⇩ Copia JSON». **Importar:** «⇧ Importar JSON» valida el archivo completo antes de tocar nada, pide confirmación y descarga antes una copia de lo actual. Un archivo inválido no cambia nada.

## Ejecutar y comprobar
Requiere Node.js 22.
```bash
npm ci            # instalación reproducible
npm run dev       # desarrollo
npm test          # pruebas unitarias y de flujo (Vitest + jsdom)
npm run build     # TypeScript + compilación de producción
npx playwright install chromium
npm run test:e2e  # navegador real, escritorio y móvil, servido en /mi-apiario-3d-/
```

## Despliegue
`.github/workflows/deploy.yml`: en cada push a `main` instala con `npm ci`, ejecuta `npm audit`, las pruebas, la compilación y las pruebas de navegador; solo si todo pasa sube `dist/` como artefacto y lo publica en GitHub Pages. Los despliegues no se solapan (`concurrency`). En los pull requests solo se verifica.
Requisito en GitHub: *Settings → Pages → Build and deployment → Source: GitHub Actions*.

## Diferencias con Mi Apiario original
Es un prototipo aparte: modelo de datos propio y simplificado, sin fotos, sin cierres de año ni pérdidas, sin sincronización. La información sanitaria es solo de ejemplo; no es diagnóstico ni recomendación veterinaria.

## Limitaciones conocidas
- La vegetación y los detalles se dibujan como mallas individuales (sin instanciado); en móviles modestos puede ir menos fluido. Las sombras ya son más ligeras en pantallas táctiles.
- La alimentación se anota como texto libre (no se validan cantidades); producción sí valida cantidad y fecha.
- El nombre de una ficha no se puede editar después de crearla; el estado sí.
- La selección de un cuadro tocando la escena no tiene prueba automática de navegador (sí la selección de colmena y el botón alternativo).
