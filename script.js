window.onload = function () {
    const h5pContent = document.querySelector('.h5p-iframe-wrapper iframe'); // Identifica el iframe del contenido H5P

    if (h5pContent) {
        try {
            const h5pDocument = h5pContent.contentDocument || h5pContent.contentWindow.document;

            if (h5pDocument) {
                // Identificar el tipo de recurso
                const isInteractiveVideo = h5pDocument.querySelector('.h5p-video-wrapper');
                const isCoursePresentation = h5pDocument.querySelector('.h5p-slide'); // Verifica si es una presentación de curso

                if (isInteractiveVideo) {
                    console.log('Recurso identificado: Interactive Video');

                    const h5pContainer = h5pDocument.querySelector('.h5p-content');
                    if (h5pContainer) {
                        console.log('Contenido H5P encontrado en Interactive Video.');

                        // Verificar si existen <track> en el documento H5P
                        const trackElements = h5pDocument.querySelectorAll('track');
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
                        colH5P.style.maxHeight = '520px';
                        colH5P.style.overflow = 'hidden';
                        colH5P.appendChild(h5pContainer);
                        row.appendChild(colH5P);

                        // Crear la columna para los subtítulos (col-4)
                        const colText = h5pDocument.createElement('div');
                        colText.classList.add('col-12', 'col-sm-4');
                        colText.id = 'captions-container';
                        colText.style.overflowY = 'auto';
                        colText.style.maxHeight = '520px';
                        row.appendChild(colText);

                        let validCaptionsFound = false;
                        let isUserInteracting = false;
                        let inactivityTimeout;

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

                                        validCaptionsFound = true;
                                        colText.innerHTML = '';

                                        captions.forEach((caption, index) => {
                                            const captionElement = h5pDocument.createElement('span');
                                            captionElement.id = `caption-${index}`;
                                            captionElement.textContent = caption.text.trim();
                                            captionElement.style.display = 'block';
                                            captionElement.style.cursor = 'pointer';
                                            captionElement.style.fontSize = '24px';
                                            captionElement.style.color = 'black';
                                            captionElement.style.marginBottom = '10px';
                                            captionElement.onclick = function () {
                                                const videoElement = h5pDocument.querySelector('video');
                                                videoElement.currentTime = caption.start;
                                                videoElement.play();
                                            };
                                            colText.appendChild(captionElement);
                                        });

                                        const videoElement = h5pDocument.querySelector('video');
                                        if (videoElement) {
                                            videoElement.addEventListener('timeupdate', function () {
                                                const currentTime = this.currentTime;

                                                captions.forEach((caption, index) => {
                                                    const captionElement = h5pDocument.getElementById(`caption-${index}`);
                                                    if (currentTime >= caption.start && currentTime <= caption.end) {
                                                        captionElement.style.fontWeight = 'bold';
                                                        captionElement.style.backgroundColor = '#a9c1c7';

                                                        if (!isUserInteracting) {
                                                            const scrollTop = colText.scrollTop;
                                                            const containerHeight = colText.clientHeight;
                                                            const elementOffset = captionElement.offsetTop;
                                                            const elementHeight = captionElement.offsetHeight;
                                                            const scrollTo = elementOffset - (containerHeight / 2) + (elementHeight / 2);

                                                            colText.scrollTo({
                                                                top: scrollTo,
                                                                behavior: 'smooth'
                                                            });
                                                        }
                                                    } else {
                                                        captionElement.style.fontWeight = 'normal';
                                                        captionElement.style.backgroundColor = 'transparent';
                                                    }
                                                });
                                            });
                                        }

                                        const resetInactivityTimer = () => {
                                            isUserInteracting = true;
                                            clearTimeout(inactivityTimeout);
                                            inactivityTimeout = setTimeout(() => {
                                                isUserInteracting = false;
                                            }, 3500);
                                        };

                                        colText.addEventListener('scroll', resetInactivityTimer);
                                        colText.addEventListener('mousemove', resetInactivityTimer);
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
                } else if (isCoursePresentation) {
                    console.log('Recurso identificado: Course Presentation');
                    // Implementación de lógica para Course Presentation en el futuro
                } else {
                    console.log('Recurso no compatible: No es Interactive Video ni Course Presentation.');
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
        if (line === 'WEBVTT') continue;

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
