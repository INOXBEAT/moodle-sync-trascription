window.onload = function() {
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
                            const videoElement = innerIframeDocument.querySelector('video');

                            if (videoElement) {
                                console.log('Video encontrado!');

                                innerIframeDocument.body.style.boxSizing = 'border-box';
                                innerIframeDocument.body.style.height = 'auto';
                                innerIframeDocument.body.style.padding = '20px';
                                innerIframeDocument.body.style.overflow = 'visible';

                                const randomTextContainer = document.createElement('div');
                                randomTextContainer.id = 'random-text';
                                randomTextContainer.style.marginTop = '20px';
                                randomTextContainer.style.paddingBottom = '20px';
                                randomTextContainer.style.fontSize = '36px';
                                randomTextContainer.style.textAlign = 'center';
                                randomTextContainer.style.whiteSpace = 'pre-wrap';
                                randomTextContainer.textContent = 'Cargando subtítulos...';
                                innerIframeDocument.body.appendChild(randomTextContainer);

                                const videoContainer = videoElement.parentElement;
                                videoContainer.style.display = 'flex';
                                videoContainer.style.flexDirection = 'column';
                                videoContainer.style.alignItems = 'center';
                                videoContainer.style.width = '100%';

                                function adjustIframeSize() {
                                    outerIframe.style.height = innerIframeDocument.body.scrollHeight + 'px';
                                }

                                adjustIframeSize();

                                const trackElements = videoElement.getElementsByTagName('track');

                                if (trackElements.length > 0) {
                                    console.log(`Se encontraron ${trackElements.length} etiquetas <track>.`);
                                    for (let i = 0; i < trackElements.length; i++) {
                                        const trackSrc = trackElements[i].getAttribute('src');

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

                                                    randomTextContainer.innerHTML = '';

                                                    // Crear un enlace <a> para cada subtítulo
                                                    captions.forEach((caption, index) => {
                                                        const captionElement = document.createElement('a');
                                                        captionElement.id = `caption-${index}`;
                                                        captionElement.href = '#';
                                                        captionElement.textContent = caption.text.trim();
                                                        captionElement.style.transition = 'color 0.3s, background-color 0.3s';
                                                        captionElement.style.display = 'block'; // Cada línea en un bloque
                                                        captionElement.style.cursor = 'pointer'; // Mostrar puntero de clic
                                                        captionElement.onclick = function() {
                                                            videoElement.currentTime = caption.start; // Saltar al tiempo de inicio del frame
                                                            videoElement.play(); // Opcional: reproducir video
                                                        };
                                                        randomTextContainer.appendChild(captionElement);
                                                    });

                                                    videoElement.addEventListener('timeupdate', function() {
                                                        const currentTime = videoElement.currentTime;

                                                        captions.forEach((caption, index) => {
                                                            const captionElement = innerIframeDocument.getElementById(`caption-${index}`);

                                                            if (currentTime >= caption.start && currentTime <= caption.end) {
                                                                captionElement.style.color = 'white';
                                                                captionElement.style.backgroundColor = 'blue';
                                                            } else {
                                                                captionElement.style.color = 'black';
                                                                captionElement.style.backgroundColor = 'transparent';
                                                            }
                                                        });
                                                    });

                                                    adjustIframeSize();
                                                })
                                                .catch(error => {
                                                    console.error('Error al procesar el archivo .vtt:', error.message);
                                                    randomTextContainer.textContent = 'Error al cargar los subtítulos.';
                                                    adjustIframeSize();
                                                });
                                        } else {
                                            console.error('La etiqueta <track> no tiene un atributo src.');
                                            randomTextContainer.textContent = 'No se encontró ninguna pista de subtítulos.';
                                            adjustIframeSize();
                                        }
                                    }
                                } else {
                                    console.error('No se encontró ninguna etiqueta de track dentro del video.');
                                    randomTextContainer.textContent = 'No se encontró ninguna pista de subtítulos.';
                                    adjustIframeSize();
                                }
                            } else {
                                console.error('No se encontró ninguna etiqueta de video dentro del segundo iframe.');
                            }
                        } else {
                            console.error('No se puede acceder al contenido del segundo iframe.');
                        }
                    } catch (error) {
                        console.error('Error accediendo al contenido del segundo iframe:', error.message);
                    }
                } else {
                    console.error('No se encontró el segundo iframe dentro del primer iframe.');
                }
            } else {
                console.error('No se puede acceder al contenido del primer iframe.');
            }
        } catch (error) {
            console.error('Error accediendo al contenido del primer iframe:', error.message);
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
