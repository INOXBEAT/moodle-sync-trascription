window.onload = function () {
    const h5pContent = document.querySelector('.h5p-iframe-wrapper iframe');

    if (h5pContent) {
        try {
            const h5pDocument = h5pContent.contentDocument || h5pContent.contentWindow.document;

            if (h5pDocument) {
                const isInteractiveVideo = h5pDocument.querySelector('.h5p-video-wrapper');
                const isCoursePresentation = h5pDocument.querySelector('.h5p-slide');

                if (isInteractiveVideo) {
                    console.log('Recurso identificado: Interactive Video');

                    const h5pContainer = h5pDocument.querySelector('.h5p-content');
                    if (h5pContainer) {
                        console.log('Contenido H5P encontrado en Interactive Video.');

                        const trackElements = h5pDocument.querySelectorAll('track');
                        if (trackElements.length === 0) {
                            console.log('No se encontró ninguna etiqueta <track> en el contenido H5P.');
                            return;
                        }

                        const link = h5pDocument.createElement('link');
                        link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css";
                        link.rel = "stylesheet";
                        link.crossOrigin = "anonymous";
                        h5pDocument.head.appendChild(link);

                        const container = h5pDocument.createElement('div');
                        container.classList.add('container-fluid');
                        h5pDocument.body.appendChild(container);

                        const row = h5pDocument.createElement('div');
                        row.classList.add('row');
                        container.appendChild(row);

                        const colH5P = h5pDocument.createElement('div');
                        colH5P.classList.add('col-12', 'col-sm-8');
                        colH5P.style.maxHeight = '520px';
                        colH5P.style.overflow = 'hidden';
                        colH5P.appendChild(h5pContainer);
                        row.appendChild(colH5P);

                        const colText = h5pDocument.createElement('div');
                        colText.classList.add('col-12', 'col-sm-4');
                        colText.id = 'captions-container';
                        colText.style.overflowY = 'auto';
                        colText.style.maxHeight = '520px';
                        row.appendChild(colText);

                        let isUserInteracting = false;
                        let inactivityTimeout;

                        trackElements.forEach((track, i) => {
                            const trackSrc = track.getAttribute('src');
                            if (trackSrc) {
                                fetch(trackSrc)
                                    .then(response => response.text())
                                    .then(vttData => {
                                        const captions = processVTT(vttData);
                                        colText.innerHTML = '';

                                        captions.forEach((caption, index) => {
                                            const captionElement = h5pDocument.createElement('span');
                                            captionElement.id = `caption-${index}`;
                                            captionElement.textContent = caption.text.trim();
                                            captionElement.style.fontSize = '24px';
                                            captionElement.style.display = 'block';
                                            captionElement.style.cursor = 'pointer';
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
                                                            centerCaptionInContainer(captionElement, colText);
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
                            }
                        });
                    }
                } else if (isCoursePresentation) {
                    console.log('Recurso identificado: Course Presentation');

                    const slides = h5pDocument.querySelectorAll('.h5p-slide');
                    if (slides.length > 0) {
                        let currentVideo = null;
                        let syncEventHandler = null;

                        const handleSlideChange = () => {
                            const currentSlide = h5pDocument.querySelector('.h5p-current');

                            if (currentSlide) {
                                const slideIndex = Array.from(slides).indexOf(currentSlide);
                                console.log(`--- Diapositiva actual: ${slideIndex + 1} ---`);

                                if (currentVideo && syncEventHandler) {
                                    currentVideo.removeEventListener('timeupdate', syncEventHandler);
                                    syncEventHandler = null;
                                }

                                const videoElement = currentSlide.querySelector('video');
                                const trackElement = videoElement ? videoElement.querySelector('track') : null;

                                if (videoElement && trackElement) {
                                    console.log(`Diapositiva ${slideIndex + 1}: El video tiene subtítulos.`);

                                    const vttSrc = trackElement.getAttribute('src');
                                    if (vttSrc) {
                                        fetch(vttSrc)
                                            .then(response => response.text())
                                            .then(vttData => {
                                                const captions = processVTT(vttData);
                                                const container = createGridLayout(h5pDocument, currentSlide, videoElement, captions, slideIndex);

                                                currentSlide.innerHTML = '';
                                                currentSlide.appendChild(container);

                                                syncEventHandler = () => syncSubtitles(videoElement, captions, h5pDocument, slideIndex);
                                                videoElement.addEventListener('timeupdate', syncEventHandler);
                                                currentVideo = videoElement;
                                            })
                                            .catch(error => console.error(`Error al obtener el archivo VTT: ${error.message}`));
                                    }
                                } else {
                                    console.log(`Diapositiva ${slideIndex + 1}: El video no tiene subtítulos o no es un video.`);
                                }
                            }
                        };

                        const observer = new MutationObserver(handleSlideChange);
                        slides.forEach(slide => {
                            observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
                        });

                        handleSlideChange();
                    }
                } else {
                    console.log('Recurso no compatible: No es Interactive Video ni Course Presentation.');
                }
            }
        } catch (error) {
            console.error('Error accediendo al contenido del iframe H5P.', error.message);
        }
    }
};

// Funciones auxiliares
function processVTT(vttData) {
    const lines = vttData.split('\n');
    const captions = [];
    let currentCaption = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === 'WEBVTT') continue;

        if (line.includes('-->')) {
            const times = line.split(' --> ');
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

function parseTime(timeString) {
    const timeParts = timeString.split(":");
    if (timeParts.length === 2) {
        const minutes = parseInt(timeParts[0], 10) * 60;
        const secondsParts = timeParts[1].split('.');
        const seconds = parseInt(secondsParts[0], 10);
        const milliseconds = secondsParts[1] ? parseInt(secondsParts[1], 10) / 1000 : 0;
        return minutes + seconds + milliseconds;
    }
    return 0;
}

function createGridLayout(document, slide, videoElement, captions, slideIndex) {
    const container = document.createElement('div');
    container.classList.add('container', 'mt-4');

    const row = document.createElement('div');
    row.classList.add('row');

    const colVideo = document.createElement('div');
    colVideo.classList.add('col-12', 'col-md-8');
    colVideo.appendChild(videoElement);
    row.appendChild(colVideo);

    const colText = document.createElement('div');
    colText.classList.add('col-12', 'col-md-4');
    colText.id = `captions-container-slide-${slideIndex}`;
    colText.style.overflowY = 'auto';
    colText.style.maxHeight = '520px';

    captions.forEach((caption, index) => {
        const captionElement = document.createElement('span');
        captionElement.id = `caption-${slideIndex}-${index}`;
        captionElement.textContent = caption.text.trim();
        captionElement.style.display = 'block';
        captionElement.style.cursor = 'pointer';
        captionElement.onclick = () => {
            videoElement.currentTime = caption.start;
            videoElement.play();
        };
        colText.appendChild(captionElement);
    });

    row.appendChild(colText);
    container.appendChild(row);
    return container;
}

function syncSubtitles(videoElement, captions, document, slideIndex) {
    const colText = document.getElementById(`captions-container-slide-${slideIndex}`);
    let isUserInteracting = false;
    let inactivityTimeout;

    videoElement.addEventListener('timeupdate', () => {
        const currentTime = videoElement.currentTime;
        captions.forEach((caption, index) => {
            const captionElement = document.getElementById(`caption-${slideIndex}-${index}`);
            if (currentTime >= caption.start && currentTime <= caption.end) {
                captionElement.style.fontWeight = 'bold';
                captionElement.style.backgroundColor = '#a9c1c7';
                if (!isUserInteracting) {
                    const scrollTo = captionElement.offsetTop - (colText.clientHeight / 2) + (captionElement.offsetHeight / 2);
                    colText.scrollTo({ top: scrollTo, behavior: 'smooth' });
                }
            } else {
                captionElement.style.fontWeight = 'normal';
                captionElement.style.backgroundColor = 'transparent';
            }
        });
    });

    const resetInactivityTimer = () => {
        isUserInteracting = true;
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
            isUserInteracting = false;
        }, 3500);
    };

    colText.addEventListener('scroll', resetInactivityTimer);
    colText.addEventListener('mousemove', resetInactivityTimer);
}

function centerCaptionInContainer(captionElement, colText) {
    const scrollTo = captionElement.offsetTop - (colText.clientHeight / 2) + (captionElement.offsetHeight / 2);
    colText.scrollTo({ top: scrollTo, behavior: 'smooth' });
}
