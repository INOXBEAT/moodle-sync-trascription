window.onload = function () {
    const h5pContent = document.querySelector('.h5p-iframe-wrapper iframe'); // Identifica el iframe del contenido H5P

    if (h5pContent) {
        try {
            const h5pDocument = h5pContent.contentDocument || h5pContent.contentWindow.document;

            if (h5pDocument) {
                const h5pContainer = h5pDocument.querySelector('.h5p-content'); // Busca el contenido H5P
                if (h5pContainer) {
                    console.log('Contenido H5P encontrado!');

                    // Aquí validamos si existen <track> en el documento H5P
                    const trackElements = h5pDocument.querySelectorAll('track');

                    // Si no hay subtítulos (track elements), no aplicar cambios y dejar el recurso H5P tal cual
                    if (trackElements.length === 0) {
                        console.log('No se encontró ninguna etiqueta <track> en el contenido H5P.');
                        return; // No se hace nada si no hay subtítulos
                    }

                    console.log(`Se encontraron ${trackElements.length} etiquetas <track>.`);

                    // Añadir el enlace a Bootstrap 5
                    const link = h5pDocument.createElement('link');
                    link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css";
                    link.rel = "stylesheet";
                    link.crossOrigin = "anonymous";
                    h5pDocument.head.appendChild(link);

                    // Crear el elemento <style> para agregar las reglas CSS
                    const style = h5pDocument.createElement('style');
                    style.type = 'text/css';
                    style.innerHTML = `
                        .container-fluid {
                            max-height: 520px;
                            overflow: hidden;
                        }

                        .col-12, .col-sm-8, .col-sm-4 {
                            max-height: 520px;
                            overflow: hidden;
                        }

                        /* Asegura que el video se ajuste al alto del contenedor */
                        video {
                            width: 100%;
                            height: 100%;
                            object-fit: contain;
                            max-height: 100%;
                        }

                        @media (max-width: 768px) {
                            .container-fluid {
                                max-height: 100vh;
                                height: 100vh;
                                display: flex;
                                flex-direction: column;
                                justify-content: space-between;
                            }

                            .row {
                                display: flex;
                                flex-direction: column;
                                height: 100%;
                            }

                            .col-sm-8 {
                                order: 1;
                                height: 60vh;
                                width: 100%;
                                max-height: none; /* Eliminar la restricción de altura */
                            }

                            .col-sm-4 {
                                order: 2;
                                height: 40vh;
                                width: 100%;
                                max-height: none; /* Eliminar la restricción de altura */
                                overflow-y: auto;
                            }
                        }
                    `;
                    h5pDocument.head.appendChild(style);

                    // Crear el contenedor principal con grid de Bootstrap
                    const container = h5pDocument.createElement('div');
                    container.classList.add('container-fluid');
                    h5pDocument.body.appendChild(container);

                    // Crear la fila (row)
                    const row = h5pDocument.createElement('div');
                    row.classList.add('row');
                    container.appendChild(row);

                    // Crear la columna para el video (col-8) y subtítulos (col-4)
                    const colH5P = h5pDocument.createElement('div');
                    colH5P.classList.add('col-12', 'col-sm-8');
                    colH5P.style.maxHeight = '520px'; // Limitar la altura del video en pantallas grandes
                    colH5P.style.overflow = 'hidden'; // Evitar que crezca más
                    colH5P.appendChild(h5pContainer); // Mover el contenido H5P al col-8
                    row.appendChild(colH5P);

                    // Crear la columna para los subtítulos (col-4) solo si existen pistas de subtítulos
                    const colText = h5pDocument.createElement('div');
                    colText.classList.add('col-12', 'col-sm-4');
                    colText.id = 'captions-container';
                    colText.style.overflowY = 'auto'; // Scroll vertical
                    colText.style.maxHeight = '520px'; // Limitar el tamaño del contenedor de subtítulos
                    row.appendChild(colText);

                    let validCaptionsFound = false; // Bandera para determinar si hay subtítulos válidos

                    trackElements.forEach((track, i) => {
                        const trackSrc = track.getAttribute('src');

                        if (trackSrc) {
                            console.log(`Track encontrado: ${trackSrc}`);

                            // Fetch del archivo VTT
                            fetch(trackSrc)
                                .then(response => response.text())
                                .then(vttData => {
                                    if (!vttData || vttData.trim() === "") {
                                        throw new Error("El archivo VTT está vacío o no tiene contenido válido.");
                                    }

                                    const captions = processVTT(vttData);

                                    if (!captions || captions.length === 0) {
                                        throw new Error("No se encontraron subtítulos válidos en el archivo VTT.");
                                    }

                                    validCaptionsFound = true; // Se encontraron subtítulos válidos
                                    colText.innerHTML = ''; // Limpiar el contenedor de subtítulos

                                    // Crear un span para cada subtítulo
                                    captions.forEach((caption, index) => {
                                        const captionElement = h5pDocument.createElement('span');
                                        captionElement.id = `caption-${index}`;
                                        captionElement.textContent = caption.text.trim();
                                        captionElement.style.display = 'block'; // Cada línea en un bloque
                                        captionElement.style.cursor = 'pointer'; // Mostrar puntero de clic
                                        captionElement.style.fontSize = '16px'; // Tamaño de la fuente
                                        captionElement.style.color = 'black'; // Color del texto
                                        captionElement.style.textDecoration = 'none'; // Eliminar subrayado de enlace
                                        captionElement.style.marginBottom = '10px'; // Espacio entre subtítulos
                                        captionElement.onclick = function () {
                                            const videoElement = h5pDocument.querySelector('video');
                                            videoElement.currentTime = caption.start; // Saltar al tiempo de inicio del subtítulo
                                            videoElement.play(); // Reproducir el video
                                        };
                                        colText.appendChild(captionElement);
                                    });

                                    // Sincronizar subtítulos con el tiempo del video
                                    const videoElement = h5pDocument.querySelector('video');
                                    if (videoElement) {
                                        videoElement.addEventListener('timeupdate', function () {
                                            const currentTime = this.currentTime;

                                            captions.forEach((caption, index) => {
                                                const captionElement = h5pDocument.getElementById(`caption-${index}`);

                                                if (currentTime >= caption.start && currentTime <= caption.end) {
                                                    captionElement.style.fontWeight = 'bold';
                                                    captionElement.style.backgroundColor = '#a9c1c7';
                                                } else {
                                                    captionElement.style.fontWeight = 'normal';
                                                    captionElement.style.backgroundColor = 'transparent';
                                                }
                                            });
                                        });
                                    }
                                })
                                .catch(error => {
                                    console.error('Error al procesar el archivo .vtt:', error.message);
                                });
                        } else {
                            console.error('La etiqueta <track> no tiene un atributo src.');
                        }
                    });
                } else {
                    console.error('No se encontró ningún contenido H5P dentro del iframe.');
                }
            } else {
                console.error('No se puede acceder al contenido del iframe H5P.');
            }
        } catch (error) {
            console.error('Error accediendo al contenido del iframe H5P.', error.message);
        }
    } else {
        console.error('No se encontró el iframe H5P.');
    }
};

// Función para procesar el archivo VTT y extraer los frames de inicio, fin y el texto correspondiente
function processVTT(vttData) {
    const lines = vttData.split('\n');
    const captions = [];
    let currentCaption = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === 'WEBVTT') {
            continue;
        }

        if (line.includes('-->')) {
            const times = line.split(' --> ');
            if (!times[0] || !times[1]) {
                console.error(`Línea de tiempo malformada: ${line}`);
                continue;
            }
            currentCaption = {
                start: parseTime(times[0].trim()),
                end: parseTime(times[1].trim()),
                text: ''
            };
        } else if (line.length > 0) {
            currentCaption.text += line + ' ';
        }

        if ((line.length === 0 || i === lines.length - 1) && currentCaption.text) {
            captions.push(currentCaption);
            currentCaption = {};
        }
    }

    return captions;
}

// Función para convertir el formato de tiempo "MM:SS.milliseconds" a segundos
function parseTime(timeString) {
    const timeParts = timeString.split(":");

    if (timeParts.length === 2) {
        const minutes = parseInt(timeParts[0], 10) * 60;
        const secondsParts = timeParts[1].split('.');
        const seconds = parseInt(secondsParts[0], 10);
        const milliseconds = secondsParts[1] ? parseInt(secondsParts[1], 10) / 1000 : 0;
        return minutes + seconds + milliseconds;
    }

    console.error(`Formato de tiempo inválido: ${timeString}`);
    return 0;
}
