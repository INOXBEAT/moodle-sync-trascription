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
  
                  // Ajustar el tamaño del body para incluir video y subtítulos
                  innerIframeDocument.body.style.height = 'auto';
                  innerIframeDocument.body.style.overflow = 'visible'; // Para evitar el scroll dentro del iframe
  
                  // Crear el contenedor para mostrar el contenido del VTT debajo del video
                  const randomTextContainer = document.createElement('div');
                  randomTextContainer.id = 'random-text';
                  randomTextContainer.style.marginTop = '20px';
                  randomTextContainer.style.fontSize = '36px';
                  randomTextContainer.style.textAlign = 'center';
                  randomTextContainer.style.whiteSpace = 'pre-wrap'; // Para preservar los saltos de línea
                  randomTextContainer.textContent = 'Cargando subtítulos...'; // Mensaje inicial mientras se carga el VTT
                  innerIframeDocument.body.appendChild(randomTextContainer);
  
                  // Ajustar el contenedor del video para que el video y el texto se alineen correctamente
                  const videoContainer = videoElement.parentElement;
                  videoContainer.style.display = 'flex';
                  videoContainer.style.flexDirection = 'column'; // Alinear el video y el texto verticalmente
                  videoContainer.style.alignItems = 'center';
                  videoContainer.style.width = '100%'; // Ajustar el contenedor al 100% del ancho
  
                  // Ajustar el tamaño del iframe externo según el contenido del iframe interno
                  function adjustIframeSize() {
                    outerIframe.style.height = innerIframeDocument.body.scrollHeight + 'px'; // Ajustar altura del iframe externo
                  }
  
                  // Ajustar el tamaño del iframe después de que se carguen los subtítulos
                  adjustIframeSize();
  
                  // Obtiene todas las etiquetas <track> dentro del video
                  const trackElements = videoElement.getElementsByTagName('track');
  
                  if (trackElements.length > 0) {
                    console.log(`Se encontraron ${trackElements.length} etiquetas <track>.`);
                    for (let i = 0; i < trackElements.length; i++) {
                      const trackSrc = trackElements[i].getAttribute('src');
  
                      if (trackSrc) {
                        console.log(`Track encontrado: ${trackSrc}`);
  
                        // Realiza una solicitud para obtener el archivo .vtt
                        fetch(trackSrc)
                          .then(response => response.text())
                          .then(vttData => {
                            // Validar si el archivo vttData tiene contenido válido
                            if (!vttData || vttData.trim() === "") {
                              throw new Error("El archivo VTT está vacío o no tiene contenido válido.");
                            }
  
                            // Procesar el archivo VTT para extraer los frames de tiempo y subtítulos
                            const captions = processVTT(vttData);
  
                            // Verificar si se procesaron correctamente los subtítulos
                            if (!captions || captions.length === 0) {
                              throw new Error("No se encontraron subtítulos válidos en el archivo VTT.");
                            }
  
                            // Mostrar el contenido formateado del VTT en el contenedor
                            randomTextContainer.textContent = captions.map(c => c.text).join('\n\n');
  
                            // Monitorear el tiempo de reproducción del video
                            videoElement.addEventListener('timeupdate', function() {
                              const currentTime = videoElement.currentTime;
                              console.log(`Tiempo actual del video: ${currentTime}`);
  
                              // Verificar si el tiempo actual está dentro del rango de algún frame
                              captions.forEach(caption => {
                                if (currentTime >= caption.start && currentTime <= caption.end) {
                                  console.log(`Identificado el texto: "${caption.text}" dentro del rango ${caption.start} --> ${caption.end}`);
                                }
                              });
                            });
  
                            // Ajustar el tamaño del iframe después de cargar el contenido del VTT
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
  
      // Omitir el título "WEBVTT"
      if (line === 'WEBVTT') {
        continue;
      }
  
      // Si es una línea con tiempos "00:01.000 --> 00:03.500"
      if (line.includes('-->')) {
        const times = line.split(' --> ');
        if (!times[0] || !times[1]) {
          console.error(`Línea de tiempo malformada: ${line}`);
          continue; // Saltar esta línea si está mal formateada
        }
        currentCaption = {
          start: parseTime(times[0].trim()), // Convertir tiempo a segundos
          end: parseTime(times[1].trim()),   // Convertir tiempo a segundos
          text: ''
        };
      } else if (line.length > 0) {
        // Acumular el texto del subtítulo
        currentCaption.text += line + ' ';
      }
  
      // Cuando termina el subtítulo, agregarlo a la lista
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
    
    // Manejar tiempos en formato MM:SS.milliseconds (sin horas)
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
  