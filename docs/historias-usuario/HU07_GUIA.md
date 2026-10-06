 HU-07 — Espacio de consulta de actuaciones mejoradas e innovaciones

## Historia de usuario

**Como** estudiante y profesor,  
**quiero** acceder a un espacio de consulta con ejemplos de actuaciones mejoradas e innovaciones pedagógicas destacadas,  
**para** inspirarme, orientar mis propias prácticas y conocer estándares de excelencia.

## Criterios de aceptación

1. Estudiantes y profesores autenticados pueden acceder a la biblioteca.
2. Los ejemplos se organizan por tipo de innovación y se pueden filtrar por categoría y texto.
3. Cada caso ofrece una vista de detalle clara y estructurada.

## Alcance implementado

- La vista compartida está disponible desde la navegación de estudiantes y profesores en `/estudiante/innovaciones` y `/docente/innovaciones`.
- La biblioteca permite buscar por título, descripción, categoría, etiquetas y contexto, y filtrar por categoría.
- Cada tarjeta permite abrir un detalle con el desafío pedagógico, la actuación, pasos para adaptarla, resultados esperados y etiquetas.
- La vista muestra el total de resultados y un estado vacío con una acción para limpiar la búsqueda y el filtro.
- El diseño es adaptable a móvil, tablet y escritorio y utiliza los componentes globales `Button` y `Modal`.

## Catálogo de referencia

Los casos incorporados en esta primera versión son ejemplos pedagógicos ilustrativos, no experiencias verificadas ni resultados atribuidos a establecimientos reales. Se presentan sin nombres de personas, colegios, cursos ni datos que permitan identificarlos. Antes de publicar experiencias reales, se debe contar con autorización editorial, revisar la anonimización y respaldar cualquier resultado comunicado.

El catálogo reside en el frontend como contenido de referencia. No hay publicación, edición ni persistencia de casos desde la interfaz. Una futura integración puede reemplazar el catálogo local por un servicio y una fuente editorial revisada sin cambiar los criterios de búsqueda y presentación.

## Validación manual

1. Iniciar sesión con un perfil estudiante y abrir **Innovaciones** desde el menú.
2. Iniciar sesión con un perfil profesor y abrir **Innovaciones** desde el menú docente.
3. Comprobar que se muestran tarjetas y categorías; elegir una categoría y confirmar que la lista cambia.
4. Buscar por palabras del título, categoría o etiquetas y comprobar que la búsqueda se combina con el filtro.
5. Buscar un texto sin coincidencias y confirmar el mensaje de estado vacío; limpiar los criterios y comprobar que reaparece el catálogo.
6. Abrir un caso, revisar que el detalle presenta sus secciones de forma ordenada y cerrarlo con el botón o Escape.
7. Repetir la consulta en una ventana de 360 px y comprobar que no aparece desplazamiento horizontal.

## Pendientes para una siguiente etapa

- Definir responsables y flujo de revisión/publicación de experiencias reales.
- Conectar el catálogo a una fuente persistente cuando se defina su gobernanza editorial.
- Acordar si la biblioteca incluirá criterios de excelencia o evidencia para distinguir casos destacados.
