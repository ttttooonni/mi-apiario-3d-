# Arquitectura inicial

## Límites de datos
- Three.js representa únicamente objetos visuales y datos de demostración.
- No hay conexión con la base de datos de Mi Apiario.
- No se importan, transforman ni escriben registros reales.

## Próxima fase de integración
1. Revisar modelos de dominio e identificadores estables de apiarios y colmenas.
2. Definir un contrato de lectura explícito y de solo lectura para la primera integración.
3. Diseñar posiciones 3D sin alterar los registros originales.
4. Probar compatibilidad, copias de seguridad y migraciones antes de permitir escrituras.
5. Mantener una forma de desactivar la integración sin pérdida de información.

## Rendimiento y accesibilidad
La escena ajusta el renderizado al tamaño disponible. La interacción usa cámara orbital. Los controles táctiles especializados y la navegación accesible alternativa quedan pendientes.
