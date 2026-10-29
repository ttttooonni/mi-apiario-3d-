# Plan de mejoras Mi Apiario 3D

Este plan guía la evolución desde un prototipo visual hasta un cuaderno apícola utilizable. Cada bloque debe compilar, probarse y revisarse antes de integrarse.

## Estado de avance

- [x] Escena 3D inicial con seis colmenas ficticias, terreno y selector día/noche.
- [x] Fichas de colmena/núcleo, registros, tareas y producción de demostración.
- [x] Guardado local aislado bajo la clave `mi-apiario-3d.demo.v1`.
- [x] Exportación de copia JSON.
- [x] Selección múltiple y acciones en lote: estado común y creación de tareas por colonia.
- [ ] Restauración de copias JSON con validación y confirmación (PR #4; pendiente de compilación y revisión).
- [ ] Pruebas automatizadas de almacenamiento, exportación, restauración, datos corruptos y migraciones.
- [ ] Múltiples apiarios: alta, edición, selección y ubicación.
- [ ] Ficha apícola completa: reina (color, año y fecha de introducción), población, cría, reservas, tipo de colmena y observaciones.
- [ ] Revisiones estructuradas con fuerza, cría, reservas, comportamiento y próxima visita.
- [ ] Sanidad: muestreos de varroa con método, fecha, resultado y cálculo documentado; historial de tratamientos y plazos de seguimiento. No recomendar dosis ni sustituir criterio veterinario.
- [ ] Alimentación estructurada: tipo, cantidad, unidad, fecha, motivo y próxima comprobación.
- [ ] Inventario de material: alzas, medias alzas, cuadros, núcleos y movimientos entre apiarios.
- [ ] Pérdidas e incidencias: enjambrazón, orfandad, baja, unión y recuperación de colonia, siempre con historial.
- [ ] Producción por apiario/colmena, producto, cosecha y trazabilidad de lotes.
- [ ] Panel de tareas: filtros por fecha, prioridad, estado, apiario y colonia; avisos y acciones en lote.
- [ ] Informes imprimibles/PDF y resumen anual.
- [ ] Fotografías y adjuntos locales con límites de tamaño y copia de seguridad.
- [ ] Etiquetas QR para abrir fichas de forma rápida.
- [ ] Escena 3D: colocar, mover y girar colmenas; terreno y vegetación canaria; cámara y selección táctil fiables.
- [ ] Accesibilidad, controles móviles, rendimiento y modo offline/PWA.
- [ ] Migración/importación desde Mi Apiario solo después de definir un formato explícito, validar copias y probar recuperación. Empezar en solo lectura.

## Reglas de seguridad de datos

1. **Los datos son sagrados.** Nunca reemplazar datos por un estado vacío ni borrar historial de forma implícita.
2. Este proyecto usa datos ficticios y una clave de almacenamiento independiente. No leer ni escribir en el almacenamiento de Mi Apiario real.
3. Rechazar copias con aplicación, versión, estructura o relaciones incompatibles; no intentar “arreglarlas” silenciosamente.
4. Antes de restaurar, avisar claramente de que reemplaza los datos locales de demostración y ofrecer exportación previa.
5. Toda modificación de esquema requiere versión y migración reversible o una copia de seguridad verificada.
6. Cada bloque debe pasar compilación, pruebas relevantes y revisión manual en móvil antes de publicarse.
7. No presentar datos de ejemplo como alertas o resultados apícolas reales.

## Orden recomendado

1. Fiabilidad de copias y pruebas automatizadas.
2. Fichas completas, múltiples apiarios y revisiones estructuradas.
3. Sanidad y alimentación con trazabilidad.
4. Inventario, incidencias y producción.
5. Tareas, informes, fotos y QR.
6. Experiencia 3D, accesibilidad, PWA y rendimiento.
7. Evaluación separada de una posible integración con Mi Apiario.
