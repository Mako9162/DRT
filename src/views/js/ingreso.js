var table1;

$(document).ready(function () {

    var lastUpdatedTaskId = localStorage.getItem('lastUpdatedTaskId');
    if (lastUpdatedTaskId) {
        $('#tarea').val(lastUpdatedTaskId);
        setTimeout(function() {
            $('#buscar').trigger('click');
        }, 100);
        localStorage.removeItem('lastUpdatedTaskId');
    }    

    $('#tarea').on('keypress', function(e) {
        if (e.which < 48 || e.which > 57) {
            e.preventDefault();
        }
    });

    $('#updateButton').prop('disabled', true);

    $('#chapterContent').on('input change', 'input, select', function() {
        $('#updateButton').prop('disabled', false);
    });

    function initDataTable() {
        if ($.fn.DataTable.isDataTable('#tabla_prot1')) {
            table1.destroy(); // Asegúrate de destruir la tabla antes de reinicializar
        }

        table1 = $('#tabla_prot1').DataTable({
            "dom": 'rt',
            "searching": true,
            "lengthChange": false,
            "colReorder": true,
            "bDestroy": true,
            "scrollX": true,
            "bInfo": true,
            "iDisplayLength": 15,
            "autoWidth": false,
            "language": {
                "sProcessing": "Procesando...",
                "sLengthMenu": "Mostrar _MENU_ registros",
                "sZeroRecords": "No se encontraron resultados",
                "sEmptyTable": "Sin infomación",
                "sInfo": "Mostrando un total de _TOTAL_ registros",
                "sInfoEmpty": "Mostrando un total de 0 registros",
                "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
                "sInfoPostFix": "",
                "sSearch": "Buscar:",
                "sUrl": "",
                "sInfoThousands": ".",
                "sLoadingRecords": "Cargando...",
                "oPaginate": {
                    "sFirst": "Primero",
                    "sLast": "Último",
                    "sNext": "Siguiente",
                    "sPrevious": "Anterior"
                },
                "oAria": {
                    "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
                    "sSortDescending": ": Activar para ordenar la columna de manera descendente"
                },
                "select" : {
                    "rows" : {
                        "_" : "Has seleccionado %d filas",
                        "0" : "Click en una fila para seleccionar",
                        "1" : "Has seleccionado 1 fila"
                    }
                }
            }
        });
    }

    initDataTable();

    let deletedImages = [];
    let originalImages = [];
    let newImages = []; 

    function realizarBusqueda(){
        const buscar = $('#tarea').val();

        if (buscar === '') {
            swal("Error", "Ingrese un id de Tarea", "error");
            $('#tarea').val('');
            return;
        }

        swal({
            title: "Cargando",
            text: "Espere un momento por favor...",
            imageUrl: "/img/Spinner-1s-200px2.gif",
            showConfirmButton: false,
            allowOutsideClick: false
        });

        $.ajax({
            url: "/info_tarea",
            type: "POST",
            data: {Id : buscar}
        }).done(function(data){

            swal.close();

            if ($.fn.DataTable.isDataTable('#tabla_prot1')) {
                table1.destroy();
            }

            $('#tabla_prot1 tbody').empty();

            data.forEach(function (item) {

                if (item.ESTADO_TAREA === "Terminada sin validar" || item.ESTADO_TAREA === "No Realizada") { 
                    $('#updateButton').removeAttr('hidden'); 
                } else {
                    $('#updateButton').attr('hidden', 'hidden');  
                }

                if (item.ESTADO_TAREA === "Terminada sin validar" || item.ESTADO_TAREA === "Terminada validada") {
                    $('#b_pdf').removeAttr('hidden');  
                } else {
                    $('#b_pdf').attr('hidden', 'hidden');  
                }
            
                $('#tabla_prot1 tbody').append(`
                    <tr>
                        <td>${item.ID}</td>
                        <td>${item.FECHA}</td>
                        <td>${item.EQUIPO}</td>
                        <td>${item.TAG_DMH}</td>
                        <td>${item.ESTADO_TAREA}</td>
                        <td hidden>${item.ID_PROTOCOLO}</td>
                        <td>${item.PROTOCOLO}</td>
                        <td>${item.TECNICO}</td>
                        <td>${item.GERENCIA}</td>
                        <td>${item.AREA}</td>
                        <td>${item.SECTOR}</td>
                        <td>${item.CAMBIOS === 1 ? '<button class="btn btn-sm btn-primary" id="cambios" type="button" name="cambios">Historial de cambios</button>' : '<button class="btn btn-sm btn-primary" name="cambios" disabled>Sin cambios</button>'}</td>
                    </tr>   
                `);
            });

            initDataTable();

            var id = data[0].ID;
            var idProtocolo = data[0].ID_PROTOCOLO;

            var requestData = {
                id,
                idProtocolo
            };

            $.ajax({
                url: "/consulProt",
                type: "POST", 	 	
                data: requestData,
                beforeSend: function() {
                    swal({
                        title: "Consultando",
                        text: "Espere un momento por favor...",
                        imageUrl:"/img/Spinner-1s-200px2.gif",
                        showConfirmButton: false,
                        allowOutsideClick: false
                    });
                }    
            }).done(function(data) {

                $('#chapterTabs').empty();
                $('#chapterContent').empty();

                data.forEach((chapter, index) => {

                    let isActive = index === 0 ? 'active' : '';
                    let tabId = `chapter${index}`;
                
                    let tab = `
                        <li class="nav-item">
                            <a class="nav-link ${isActive}" id="${tabId}-tab" data-toggle="tab" href="#${tabId}" role="tab" aria-controls="${tabId}" aria-selected="${isActive ? 'true' : 'false'}"><strong>${chapter.DESC_CAPITULO}</strong></a>
                        </li>
                    `;
                    $('#chapterTabs').append(tab);
                
                    let content = `
                        <div class="tab-pane ${isActive}" id="${tabId}" role="tabpanel" aria-labelledby="${tabId}-tab">
                            <div class="row">
                                ${(Array.isArray(chapter.items) ? chapter.items.map((item, index) => `
                                    <div class="col-sm-3">
                                        <label><strong>${item.DESC_CAPTURA}</strong></label>
                                        <input type="text" class="form-control" value="${item.TIPO}" hidden>
                                        <input type="text" class="form-control" value="${item.TR_CAPITULO}" hidden>
                                        <input type="text" class="form-control" value="${item.TR_CORRELATIVO}" hidden>
                                        ${item.TIPO.includes('-') 
                                            ? `<select class="form-control" 
                                                data-capitulo="${item.TR_CAPITULO}" 
                                                data-desCapitulo="${chapter.DESC_CAPITULO}" 
                                                data-desCaptura="${item.DESC_CAPTURA}"
                                                data-correlativo="${item.TR_CORRELATIVO}" 
                                                data-original-value="${item.TR_RESPUESTA}">
                                                ${item.TIPO.split('-').map(option => `
                                                        <option value="${option}" 
                                                            ${option === item.TR_RESPUESTA || (item.TR_RESPUESTA === 'SC' && option === 'No Aplica') ? 'selected' : ''}>
                                                            ${option}
                                                        </option>
                                                    `).join('')}
                                            </select>`
                                            : item.TIPO === 'Fecha' 
                                            ? `<input type="date" class="form-control" value="${item.TR_RESPUESTA}" 
                                                data-original-value="${item.TR_RESPUESTA}" 
                                                data-capitulo="${item.TR_CAPITULO}" 
                                                data-desCapitulo="${chapter.DESC_CAPITULO}" 
                                                data-desCaptura="${item.DESC_CAPTURA}"
                                                data-correlativo="${item.TR_CORRELATIVO}">`
                                            : item.TIPO === 'BD'
                                            ? `<input type="text" class="form-control" value="${item.TR_RESPUESTA === 'SC' ? '': item.TR_RESPUESTA}" readonly 
                                                data-original-value="${item.TR_RESPUESTA}" 
                                                data-capitulo="${item.TR_CAPITULO}" 
                                                data-desCapitulo="${chapter.DESC_CAPITULO}" 
                                                data-desCaptura="${item.DESC_CAPTURA}"
                                                data-correlativo="${item.TR_CORRELATIVO}">`
                                            : item.TIPO === 'Texto' || item.TIPO === 'TextoLargo'
                                            ? `<div class="input-with-counter">
                                                <input type="text" class="form-control" maxlength="300" value="${item.TR_RESPUESTA === 'SC' ? '': item.TR_RESPUESTA}" 
                                                data-original-value="${item.TR_RESPUESTA}" 
                                                data-capitulo="${item.TR_CAPITULO}" 
                                                data-desCapitulo="${chapter.DESC_CAPITULO}" 
                                                data-desCaptura="${item.DESC_CAPTURA}"
                                                data-correlativo="${item.TR_CORRELATIVO}"><span class="char-counter">300</span>
                                               </div>`
                                            : `<input type="text" class="form-control" value="${item.TR_RESPUESTA === 'SC' ? '': item.TR_RESPUESTA}" 
                                                data-original-value="${item.TR_RESPUESTA}" 
                                                data-capitulo="${item.TR_CAPITULO}" 
                                                data-desCapitulo="${chapter.DESC_CAPITULO}" 
                                                data-desCaptura="${item.DESC_CAPTURA}"
                                                data-correlativo="${item.TR_CORRELATIVO}">`}
                                        <br>
                                    </div>
                                    ${((index + 1) % 4 === 0) ? '<div class="clearfix visible-sm-block"></div>' : ''}
                                `).join('') : '<p>Sin Información.</p>')}
                            </div>
                        </div>
                    `;
                
                    $('#chapterContent').append(content);
                });
                
                initializeCharCounter();

                swal.close();
                $('#infoTarea').show();
                let firstTab = $('#chapterTabs a:first');
                firstTab.tab('show');  
                $(firstTab.attr('href')).addClass('active show');  
                // --- IMAGENES: tercera llamada ajax ---
                $.ajax({
                    url: "/consultaImagenes",
                    type: "POST",
                    data: { Id: buscar }
                }).done(function(imgData){

                    originalImages.push(imgData.archivos);

                    // Agregamos la pestaña “Imágenes” si no existe
                    if (!$('#imagenes-tab').length) {
                        $('#chapterTabs').append(`
                            <li class="nav-item">
                                <a class="nav-link" id="imagenes-tab" data-toggle="tab" href="#imagenes" role="tab"
                                aria-controls="imagenes" aria-selected="false"><strong>Imágenes</strong></a>
                            </li>
                        `);
                    }

                    let contenidoImg = '';

                    if (Array.isArray(imgData.imagenes) && imgData.imagenes.length > 0) {
                        const archivosArr = imgData.archivos.split('|');
                        contenidoImg = `
                        <div class="row m-b-1">
                            <div class="col-md-12">
                            <button class="btn btn-success add-img pull-right" title="Agregar imagen">
                                <input type="text" id="idTareaImg" hidden value="${buscar}">
                                <i class="fa fa-file-picture-o"> Agregar</i>
                            </button>
                            </div>
                        </div>
                        <div class="row" id="imagenes-contenedor">`;  // <-- ID único aquí

                        imgData.imagenes.forEach((ruta, idx) => {
                        const numero   = idx + 1;
                        const filename = archivosArr[idx] || ruta.split('/').pop();
                        const originalName = filename;  // mostramos nombre real

                        contenidoImg += `
                            <div class="col-sm-3 mb-4" data-filename="${filename}">
                            <input type="text" id="idTareaImagenes" hidden value="${buscar}">
                            <div class="card shadow-sm">
                                <img src="${ruta}" class="card-img-top img-fluid" alt="${originalName}">
                                <div class="card-body p-2">
                                <center><h3 class="card-title">${originalName}</h3></center>
                                <button class="btn btn-sm btn-danger btn-block delete-img"
                                        data-filename="${filename}">
                                    Eliminar
                                </button>
                                </div>
                            </div>
                            </div>
                        `;
                        });

                        contenidoImg += '</div>';  // cierra #imagenes-contenedor
                    } else {
                        contenidoImg =`<div class="row m-b-1">
                            <div class="col-md-12">
                            <button class="btn btn-success add-img pull-right" title="Agregar imagen">
                            <input type="text" id="idTareaImg" hidden value="${buscar}">
                                <i class="fa fa-file-picture-o"> Agregar</i>
                            </button>
                            </div>
                        </div><div class="row" id="imagenes-contenedor">`;
                    }

                    const $tabPane = $('#imagenes');
                    if ($tabPane.length) {
                        $tabPane.html(contenidoImg);
                    } else {
                        $('#chapterContent').append(`
                            <div class="tab-pane" id="imagenes" role="tabpanel" aria-labelledby="imagenes-tab">
                                ${contenidoImg}
                            </div>
                        `);
                    }
                }).fail(function() {
                    swal("Atención", "No se pudo obtener las imágenes.", "warning");
                });
                // --- FIN IMAGENES ---
            });
        });

        $('#tarea').val('');
    }

    $('#buscar').on('click', function() {
        realizarBusqueda();
    });

    // Delegación: cada vez que se hace click en “Eliminar”...
    $('#chapterContent').on('click', '.delete-img', function(e){
        const $btn     = $(this);
        const $col     = $btn.closest('.col-sm-3');
        const filename = $btn.data('filename');
        const tareaId  = $('#idTareaImagenes').val();

        swal({
            title: "¿Eliminar imagen?",
            text: `¿Seguro que quieres borrar ${filename}?`,
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false
        }, function(isConfirm){
            if (!isConfirm) return;
            $col.remove();
            swal("Eliminada", "Imagen eliminada.", "success");
            deletedImages.push(filename);
            $('#updateButton').prop('disabled', false).removeClass('btn-default').addClass('btn-success');
        });
    });

    $('#chapterContent').on('click', '.add-img', function(e) {
        e.preventDefault();
        
        // Obtener el idTarea desde el input
        const idTarea = $('#idTareaImg').val();

        const $input = $('<input type="file" accept="image/*" multiple style="display:none">');
        $('body').append($input);

        $input.on('change', async function() {
            const files = Array.from(this.files);

            // 1) Extraer los números de secuencia de las imágenes existentes en el DOM
            const existingSeqs = $('#imagenes-contenedor .col-sm-3')
                .map((i, el) => {
                    const fname = $(el).data('filename'); 
                    const m = fname.match(/_\s*(\d+)\./); 
                    return m ? parseInt(m[1], 10) : 0;
                })
                .get();

            // 2) Determinar el número máximo de secuencia
            const maxSeq = existingSeqs.length ? Math.max(...existingSeqs) : 0;

            // 3) Generar las nuevas imágenes con el correlativo
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    // Comprimir la imagen
                    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
                    const compressedFile = await imageCompression(file, options);

      
                    const seq = maxSeq + i + 1; 
                    const ext = compressedFile.name.split('.').pop(); 
                    const filename = `${idTarea}_${seq}.${ext}`; 

                    // Guardar para el envío
                    newImages.push({ file: compressedFile, filename });

                    // Previsualización en el DOM
                    const url = URL.createObjectURL(compressedFile);
                    const card = `
                        <div class="col-sm-3 mb-4" data-filename="${filename}">
                            <div class="card shadow-sm">
                                <img src="${url}" class="card-img-top img-fluid" alt="Imagen ${seq}">
                                <div class="card-body p-2">
                                    <center><h3 class="card-title">${filename}</h3></center>
                                    <button class="btn btn-sm btn-danger btn-block delete-img" data-filename="${filename}">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    $('#imagenes-contenedor').append(card);
                    $('#updateButton').prop('disabled', false).removeClass('btn-default').addClass('btn-success');
                } catch (err) {
                    console.error(err);
                    swal("Error", "No se pudo comprimir la imagen.", "error");
                }
            }

            $input.remove();
        });

        $input.click();
    });

    $('#updateButton').on('click', function() {
        var changes = [];
        $('#chapterContent input, #chapterContent select').each(function() {
            var $el = $(this);
            var des_cap = $el.attr('data-desCapitulo');
            var capt    = $el.attr('data-desCaptura');
            var cap     = $el.attr('data-capitulo');
            var corr    = $el.attr('data-correlativo');
            var newVal  = $el.val();
            var origVal = $el.attr('data-original-value');
            if (cap && corr && newVal !== origVal) {
                changes.push({
                    field: des_cap + ' / ' + capt,
                    originalValue: origVal,
                    newValue: newVal
                });
            }
        });

        // 3.2 — Ahora agrego las imágenes eliminadas
        deletedImages.forEach(function(filename) {
            changes.push({
                field: 'Imagen eliminada',
                originalValue: originalImages,
                newValue: 'Eliminada: '+ filename
            });
        });


        newImages.forEach(function(imageObj) {
            changes.push({
                field: 'Imagen Agregada',
                originalValue: originalImages,
                newValue: 'Agregada: ' + imageObj.filename
            });
        });


        // 3.3 — Si no hay cambios, aviso y salgo
        if (changes.length === 0) {
            swal("Sin Cambios", "No se detectaron cambios para actualizar.", "info");
            return;
        }

        // 3.4 — Pinto las filas en el modal
        $('#changePreviewBody').empty();
        changes.forEach(change => {
            $('#changePreviewBody').append(`
            <tr>
                <td>${change.field}</td>
                <td>${change.originalValue}</td>
                <td>${change.newValue}</td>
            </tr>
            `);
        });

        // 3.5 — Muestro el modal
        $('#confirmUpdateModal').modal('show');
    });

    $('#confirmUpdate').on('click', function() {

        swal({
            title: "¡SAPMA!",
            text: "¿esta seguro de actualizar esta tarea?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false
        },function(isConfirm){
            if(isConfirm){
                var valorColumnaUno = table1.cell(0, 0).data(); 
        
                var inputs = [];
                $('#chapterContent input, #chapterContent select').each(function() {
                    var $element = $(this);
                    var capitulo = $element.attr('data-capitulo');
                    var correlativo = $element.attr('data-correlativo');
                    var respuesta = $element.val();
                    
                    if (capitulo && correlativo) {
                        inputs.push({
                            Respuesta: respuesta,
                            Id_Tarea: valorColumnaUno,
                            Capitulo: capitulo,
                            Correlativo: correlativo
                        });
                    }
                });

                // images será directamente un string "img1.jpg|img2.png|img3.gif"
                var images = $('#imagenes .col-sm-3.mb-4').map(function() {
                    return $(this).data('filename');
                }).get().join('|');

            
                var changes = [];
                $('#changePreviewBody tr').each(function() {
                    var field = $(this).find('td').eq(0).text(); 
                    var originalValue = $(this).find('td').eq(1).text(); 
                    var newValue = $(this).find('td').eq(2).text(); 
                    
                    changes.push({
                        field: field,
                        originalValue: originalValue,
                        newValue: newValue,

                    });
                });
            
                localStorage.setItem('lastUpdatedTaskId', valorColumnaUno);
            
                $('#confirmUpdateModal').modal('hide');
                
                swal({
                    title: "Actualizando",
                    text: "Espere un momento por favor...",
                    imageUrl: "/img/Spinner-1s-200px2.gif",
                    showConfirmButton: false,
                    allowOutsideClick: false
                });

                // Crear un objeto FormData
                var formData = new FormData();
                formData.append('inputs', JSON.stringify(inputs));
                formData.append('images', images);
                formData.append('changes', JSON.stringify(changes));

                // Agregar cada archivo de newImages al FormData
                newImages.forEach(function(imageObj) {
                    formData.append('newImages', imageObj.file, imageObj.filename);
                });

                // Enviar la solicitud AJAX con FormData
                $.ajax({
                    url: '/updateData', 
                    type: 'POST',
                    data: formData,
                    processData: false,  // Evita que jQuery procese los datos
                    contentType: false,  // Deja que el navegador establezca el tipo de contenido
                }).done(function(data) {
                    swal.close();
                    window.location.reload(); 
                });           
            }
        }
        );
    });
    
    $('#b_pdf').on('click', function() {
        var rowData = table1.row(0).data();
        var id = rowData[0];
        var codigo = rowData[1];
        
        window.location.href = "/archivo/" + id + "/" + codigo;
    });

    $(document).on('click', '#cambios', function() {
        var rowData = table1.row(0).data();
        var id = rowData[0];

        $.ajax({
            url: '/ver_cambios',
            type: 'POST',
            data: {Id:id}
        }).done(function(data){
            $('#cambios_table').empty();
            data.forEach(item => {
                $('#cambios_table').append(`
                    <tr>
                        <td>${item.FECHA}</td>
                        <td>${item.USUARIO}</td>
                        <td>${item.RUTA}</td>
                        <td>${item.ORIGINAL}</td>
                        <td>${item.CAMBIO}</td>
                    </tr>
                `);
            });
            $('#cambiosModal').modal('show');
        });
    });

    function initializeCharCounter() {
        document.querySelectorAll('.input-with-counter input').forEach(function(input) {
            let maxLength = input.getAttribute('maxlength');
            let charCounter = input.parentNode.querySelector('.char-counter');
            
            charCounter.textContent = maxLength - input.value.length;
            
            input.addEventListener('input', function() {
                let remaining = maxLength - input.value.length;
                charCounter.textContent = remaining;
            });
        });
    }

    const styleId = 'input-with-counter-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .input-with-counter {
                position: relative;
            }

            .input-with-counter input {
                padding-right: 50px;
            }

            .input-with-counter .char-counter {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                color: #999;
                font-size: 0.875em;
            }
        `;
        document.head.appendChild(style);
    }

    $('#historial_tarea').on('click', function (event) {
        event.preventDefault();
        var idTarea = table1.cell(0, 0).data(); 
        console.log(idTarea);
        $('#histo_id').val(idTarea);
        $.ajax({
            url: '/historial',
            type: 'POST',
            data: { idTarea: idTarea },
            success: function (data) {
                $('#historia_titulo').text('Historial de la tarea: ' + idTarea);
    
                const timelineContainer = $('#historia .modal-content .timeline');
                timelineContainer.empty();
    
                if (data.length === 0) {
    
                    timelineContainer.append('<div class="timeline-item"><p>Sin Información</p></div>');
                } else {
    
                    const sortedData = data.sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA));
    
                    const groupedByDate = sortedData.reduce((acc, item) => {
    
                        const fecha = new Date(item.FECHA).toLocaleDateString('es-CL', {
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long',
                            day: 'numeric' 
                        });
                        if (!acc[fecha]) acc[fecha] = [];
                        acc[fecha].push(item);
                        return acc;
                    }, {});
    
                    for (const [fecha, eventos] of Object.entries(groupedByDate)) {
                        const dateHeader = `<div class="timeline-date-group"><h4>${fecha}</h4></div>`;
                        timelineContainer.append(dateHeader);
    
                        eventos.forEach(item => {
                            const hora = new Date(item.FECHA).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    
                            const timelineItem = `
                                <div class="timeline-item">
                                    <div class="timeline-time">
                                        ${hora}
                                        <span class="timeline-user">
                                            <i class="timeline-user-icon font-icon glyphicon glyphicon-user"></i>${item.USUARIO}
                                        </span>
                                    </div>
                                    <div class="timeline-content">
                                        <h5>${item.TITULO}</h5>
                                        <p>${item.COMENTARIO || 'Sin observaciones'}</p>
                                    </div>
                                    <br>
                                </div>`;
                            timelineContainer.append(timelineItem);
                          });
                      }
                  }
      
                  $('#historia').modal('show');
              }
          });
    });

    $('#print').on('click', function() {
        const idTarea = $('#histo_id').val();

        swal({
            title: "Cargando",
            text: "Espere un momento por favor...",
            imageUrl: "/img/Spinner-1s-200px2.gif",
            showConfirmButton: false,
            allowOutsideClick: false
        });

        fetch('/pdf_historial', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idTarea: idTarea })
        })
        .then(response => {
          swal.close();
          $('#historia').modal('hide');
            if (!response.ok) {
                throw new swal('Error','Error en la generación del PDF', 'error');
            }
            return response.blob();
        })
        .then(blob => {
          swal.close();
          $('#historia').modal('hide');
            const url = window.URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (!newWindow) {
                swal('Por favor, permite las ventanas emergentes para ver el PDF.', 'warning');
            }
        })
        .catch(error => {
            awal('Error','Hubo un error al generar el PDF.','Error');
        });
    });
    
});