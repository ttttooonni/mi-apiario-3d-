# Mi Apiario 3D

Prototipo independiente para explorar un apiario en una escena tridimensional con Three.js.

## Estado
- Aplicación web React + TypeScript + Vite con escena 3D y controles día/noche.
- Cuaderno de demostración con fichas de colmenas/núcleos, revisiones, sanidad, alimentación, tareas y lotes de producción.
- Selección múltiple y acciones en lote sobre las fichas.
- Copia JSON exportable; la restauración validada está en revisión en PR #4.
- Los registros son ficticios y no se conectan a Mi Apiario real.

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
El prototipo guarda datos ficticios en el navegador bajo la clave independiente `mi-apiario-3d.demo.v1`. No modifica ni importa datos de Mi Apiario real. La restauración debe aceptar solo copias exportadas por esta aplicación y avisar antes de reemplazar los datos locales de demostración. Cualquier futura integración con Mi Apiario debe empezar en solo lectura y pasar pruebas de compatibilidad y recuperación.

## Despliegue
La publicación se realiza mediante GitHub Actions y GitHub Pages. La compilación automatizada comprueba que el proyecto puede construirse; no sustituye las pruebas funcionales manuales en móvil.

## Publicación
La aplicación de prueba se publica mediante GitHub Actions y GitHub Pages. Los datos incluidos son ficticios y no se conectan con Mi Apiario real.
