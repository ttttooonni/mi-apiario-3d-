# Mi Apiario 3D

Prototipo web independiente para explorar un apiario en 3D y practicar el trabajo de un cuaderno apícola.

## Qué puedes probar
- Apiario 3D con colmenas ficticias, tapa abatible y cuadros inspeccionables.
- Tutorial guiado: explorar, abrir una colmena, inspeccionar un cuadro, registrar la observación y crear una tarea.
- Fichas de colmenas y núcleos, revisiones, sanidad, alimentación, producción y tareas.
- Vista de día/noche, controles de cámara y copia de demostración en JSON.

## Seguridad e integridad de datos
- Todos los datos son de ejemplo y se guardan en el navegador bajo una clave exclusiva de esta demo.
- No se conecta a Mi Apiario real, no importa sus datos ni modifica su repositorio.
- No uses esta demo para almacenar registros apícolas reales o decisiones sanitarias.

## Requisitos y ejecución local
Node.js 20+ y npm.

```bash
npm install
npm run dev
```

Para comprobar la compilación de producción:

```bash
npm run build
```

## Publicación
GitHub Actions verifica la compilación en las solicitudes de cambio y despliega `dist` a GitHub Pages al actualizar `main`. La publicación depende de que el repositorio tenga GitHub Pages configurado para usar GitHub Actions.

URL prevista: https://ttttooonni.github.io/mi-apiario-3d-/

## Estado
Prototipo en desarrollo. Revisar en móvil y escritorio antes de usarlo como herramienta habitual.
