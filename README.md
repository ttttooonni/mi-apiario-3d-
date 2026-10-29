# Mi Apiario 3D

Prototipo independiente para explorar un apiario en una escena tridimensional con Three.js.

## Estado
- Aplicación web React + TypeScript + Vite.
- Escena 3D con terreno, vegetación, camino y seis colmenas ficticias seleccionables.
- Selector de día/noche y ficha lateral de demostración.
- No usa datos reales ni se conecta a Mi Apiario.
- Las imágenes de concepto generadas durante el diseño son referencias visuales; no representan la interfaz funcional actual.

## Requisitos
Node.js 20+ y npm.

## Ejecutar
```bash
npm install
npm run dev
```

## Verificar compilación
```bash
npm run build
```

## Integridad de datos
Este prototipo utiliza datos ficticios en memoria. No modifica ni importa datos de Mi Apiario. Cualquier integración futura deberá comenzar en modo de solo lectura y pasar pruebas de compatibilidad y recuperación antes de habilitar escrituras.

## Despliegue
Aún no está configurado GitHub Pages. La publicación se hará después de comprobar la compilación y probar la experiencia en escritorio y móvil.


## Publicación
La aplicación de prueba se publica mediante GitHub Actions y GitHub Pages. Los datos incluidos son ficticios y no se conectan con Mi Apiario real.
