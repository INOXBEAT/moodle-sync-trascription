window.onload = function () {
    const outerIframe = document.querySelector('iframe');

    if (outerIframe) {
        try {
            const outerIframeDocument = outerIframe.contentDocument || outerIframe.contentWindow.document;

            if (outerIframeDocument) {
                const innerIframe = outerIframeDocument.querySelector('iframe');

                if (innerIframe) {
                    try {
                        const innerIframeDocument = innerIframe.contentDocument || innerIframe.contentWindow.document;

                        if (innerIframeDocument) {
                            const h5pContainer = innerIframeDocument.querySelector('.h5p-content');
                            if (h5pContainer) {
                                console.log('Contenido H5P encontrado!');

                                // Añadir el enlace a Bootstrap 5
                                const link = innerIframeDocument.createElement('link');
                                link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css";
                                link.rel = "stylesheet";
                                link.crossOrigin = "anonymous";
                                innerIframeDocument.head.appendChild(link);

                                // Crear contenedor principal con grid de Bootstrap
                                const container = innerIframeDocument.createElement('div');
                                container.classList.add('container-fluid');
                                container.style.maxHeight = '520px'; // Limitar la altura del grid
                                container.style.overflow = 'hidden'; // Asegurar que el contenido no sobrepase los límites
                                innerIframeDocument.body.appendChild(container);

                                // Crear la fila (row)
                                const row = innerIframeDocument.createElement('div');
                                row.classList.add('row');
                                container.appendChild(row);

                                // Columna para el contenido H5P (col-8)
                                const colH5P = innerIframeDocument.createElement('div');
                                colH5P.classList.add('col-12', 'col-sm-8');
                                colH5P.style.maxHeight = '520px'; // Limitar la altura del video
                                colH5P.style.overflow = 'hidden'; // Evitar que crezca más
                                colH5P.appendChild(h5pContainer); // Mover el contenido H5P al col-8
                                row.appendChild(colH5P);

                                // Columna para el texto (col-4)
                                const colText = innerIframeDocument.createElement('div');
                                colText.classList.add('col-12', 'col-sm-4');
                                colText.id = 'random-text';
                                colText.style.overflowY = 'auto'; // Agregar scroll vertical
                                colText.style.maxHeight = '520px'; // Limitar el tamaño del contenedor de subtítulos
                                row.appendChild(colText);

                                let isUserInteracting = false;
                                let inactivityTimeout;

                                function resetInactivityTimer() {
                                    isUserInteracting = true;
                                    clearTimeout(inactivityTimeout);
                                    inactivityTimeout = setTimeout(() => {
                                        isUserInteracting = false;
                                    }, 3500); // 3.5 segundos de inactividad
                                }

                                // Escuchar eventos de interacción del usuario (scroll y mousemove)
                                colText.addEventListener('scroll', resetInactivityTimer);
                                colText.addEventListener('mousemove', resetInactivityTimer);

                                // Añadir los subtítulos en col-4
                                const trackElements = innerIframeDocument.querySelectorAll('track');

                                if (trackElements.length > 0) {
                                    console.log(`Se encontraron ${trackElements.length} etiquetas <track>.`);
                                    trackElements.forEach((track, i) => {
                                        const trackSrc = track.getAttribute('src');

                                        if (trackSrc) {
                                            console.log(`Track encontrado: ${trackSrc}`);

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

                                                    colText.innerHTML = ''; // Limpiar el contenedor de subtítulos

                                                    // Crear un enlace <a> para cada subtítulo
                                                    captions.forEach((caption, index) => {
                                                        const captionElement = innerIframeDocument.createElement('a');
                                                        captionElement.id = `caption-${index}`;
                                                        captionElement.href = '#';
                                                        captionElement.textContent = caption.text.trim();
                                                        captionElement.style.transition = 'color 0.3s, background-color 0.3s';
                                                        captionElement.style.display = 'block'; // Cada línea en un bloque
                                                        captionElement.style.cursor = 'pointer'; // Mostrar puntero de clic
                                                        captionElement.style.fontSize = '20px'; // Tamaño de la fuente grande
                                                        captionElement.style.textDecoration = 'none'; // Eliminar apariencia de enlace
                                                        captionElement.style.color = 'black';
                                                        captionElement.onclick = function () {
                                                            const videoElement = innerIframeDocument.querySelector('video');
                                                            videoElement.currentTime = caption.start; // Saltar al tiempo de inicio del frame
                                                            videoElement.play(); // Reproducir el video
                                                        };
                                                        colText.appendChild(captionElement);
                                                    });

                                                    // Actualizar el scroll automáticamente según el subtítulo resaltado
                                                    innerIframeDocument.querySelector('video').addEventListener('timeupdate', function () {
                                                        const currentTime = this.currentTime;

                                                        captions.forEach((caption, index) => {
                                                            const captionElement = innerIframeDocument.getElementById(`caption-${index}`);

                                                            if (currentTime >= caption.start && currentTime <= caption.end) {
                                                                captionElement.style.fontWeight = 'bold'; 
                                                                captionElement.style.backgroundColor = '#a9c1c7';
                                                                
                                                                // Si no hay interacción del usuario, centrar el subtítulo resaltado
                                                                if (!isUserInteracting) {
                                                                    const scrollTop = colText.scrollTop;
                                                                    const containerHeight = colText.clientHeight;
                                                                    const elementOffset = captionElement.offsetTop;
                                                                    const elementHeight = captionElement.offsetHeight;
                                                                    
                                                                    // Calcular la nueva posición del scroll
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
                                                })
                                                .catch(error => {
                                                    console.error('Error al procesar el archivo .vtt:', error.message);
                                                    colText.textContent = 'Error al cargar los subtítulos.';
                                                });
                                        } else {
                                            console.error('La etiqueta <track> no tiene un atributo src.');
                                            colText.textContent = 'No se encontró ninguna pista de subtítulos.';
                                        }
                                    });
                                } else {
                                    console.error('No se encontró ninguna etiqueta de track dentro del contenido H5P.');
                                    colText.textContent = 'No se encontró ninguna pista de subtítulos.';
                                }
                            } else {
                                console.error('No se encontró ningún contenido H5P dentro del segundo iframe.');
                            }
                        } else {
                            console.error('No se puede acceder al contenido del segundo iframe.');
                        }
                    } catch (error) {
                        console.error('Error accediendo al contenido del segundo iframe.', error.message);
                    }
                } else {
                    console.error('No se encontró el segundo iframe dentro del primer iframe.');
                }
            } else {
                console.error('No se puede acceder al contenido del primer iframe.');
            }
        } catch (error) {
            console.error('Error accediendo al contenido del primer iframe.', error.message);
        }
    } else {
        console.error('No se encontró el primer iframe.');
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
