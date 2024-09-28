# H5P moodle-sync-trascription


Este proyecto tiene como objetivo mejorar la interactividad y accesibilidad de los contenidos de video H5P en entornos iframe. Añade transcripciones sincronizadas, permite saltar a puntos específicos del video desde los subtítulos y adapta el diseño a dispositivos móviles utilizando Bootstrap 5.

## Características

- **Soporte para H5P**: Detecta contenido H5P embebido en iframes y modifica su estructura para mejorar la accesibilidad.
- **Subtítulos sincrónicos**: Carga archivos de subtítulos (VTT) y los muestra en una columna adyacente al video. Los subtítulos se resaltan en tiempo real conforme se reproduce el video.
- **Interactividad**: Permite que los usuarios hagan clic en los subtítulos para saltar a una parte específica del video.
- **Diseño adaptable**: Utiliza Bootstrap 5 para ajustar automáticamente el diseño a diferentes tamaños de pantalla.
- **Control de inactividad**: El sistema detecta si el usuario interactúa con la página (scroll o movimiento del ratón) y ajusta el comportamiento de desplazamiento automático de los subtítulos.

## Requisitos

- Un entorno donde se pueda integrar contenido H5P dentro de iframes.
- Un archivo de subtítulos en formato `.vtt`.

## Instalación

1. Clona el repositorio a tu máquina local:
   ```bash
   git clone https://github.com/INOXBEAT/moodle-sync-trascription.git