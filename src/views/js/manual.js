
var table1;
var selectedImages = [];
$(document).ready(function () {

    var lastUpdatedTaskId = localStorage.getItem('lastUpdatedTaskId');

    if (lastUpdatedTaskId) {
        $('#tarea').val(lastUpdatedTaskId);

        setTimeout(function() {
            $('#filt').trigger('click'); 
        }, 100); 

        localStorage.removeItem('lastUpdatedTaskId');
    }

    var date1 = document.querySelector('#date1');
    var date2 = document.querySelector('#date2');
    date1.addEventListener('change', function() {
        date2.min = this.value;
    });	
      
    function initDataTable() {
        var checkTogglePressed = false;
      
        table1 = $('#tabla_prot').DataTable({
          "dom": 'frtip',
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
          }
  
        })
    }
  
    initDataTable(); 

    $('#filt').on('click', function () {
        var date1 = $('#date1').val();
        var date2 = $('#date2').val();
        var tarea = $('#tarea').val();
    
        if ((tarea && (date1 || date2)) || (date1 && date2 && tarea)) {
            swal("Error", "No puede enviar fechas y tarea.", "error");
            return;
        }
    
        if (!date1 && !date2 && !tarea) {
            swal("Error", "Seleccione un rango de fechas o ingrese una tarea.", "error");
            return;
        }
    
        if ((!date1 && date2) || (date1 && !date2)) {
            swal("Error", "Seleccione ambas fechas.", "error");
            return;
        }
    
        var data = {
            date1,
            date2,
            tarea
        }
    
        $.ajax({
            url: '/respuesta_manual',
            type: 'POST',
            data: data,
            beforeSend: function() {
                swal({
                    title: "Buscando",
                    text: "Espere un momento por favor...",
                    imageUrl: "/img/Spinner-1s-200px2.gif",
                    showConfirmButton: false,
                    allowOutsideClick: false
                });
            }
        }).done(function(data){
    
            swal.close();
    
            if ($.fn.DataTable.isDataTable('#tabla_prot')) {
                table1.destroy();
            }
    
            $('#tabla_prot tbody').empty();
    
            data.forEach(function (item) {
                $('#tabla_prot tbody').append(`
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
                        <td><button class="btn btn-sm btn-success ingresar-btn" type="button">Ingresar</button></td>
                    </tr>
                `);
            });
    
            initDataTable();

            ingresarId();
        });

        $('#date1').val('');
        $('#date2').val('');
        $('#tarea').val('');
    });
    
    function ingresarId() {
        $(document).on('click', '.ingresar-btn',  function () {
    
            var row = $(this).closest('tr');
            var id = row.find('td:eq(0)').text();
            var idProt = row.find('td:eq(5)').text();
            var prot = row.find('td:eq(6)').text();
    
            $('#titulo_tarea').text('TAREA: ' + id + ' / PROTOCOLO: ' + prot);
            $('#id_Tarea').val(id);
            $('#idProt').text(idProt);
    
            $.ajax({
                url: '/respuesta_manual_id',
                type: 'POST',
                data: {
                    idProt
                }
            }).done(function (data) {
    
                $('#chapterTabs').empty();
                $('#chapterContent').empty();
    
                data.forEach((chapter, index) => {
                    let isActive = index === 0 ? 'active' : '';
                    let tabId = `tab-${index}`;
    
                    let tab = `
                        <li class="nav-item">
                            <a class="nav-link ${isActive}" id="${tabId}-tab" data-toggle="tab" href="#${tabId}" role="tab" aria-controls="${tabId}" aria-selected="${isActive ? 'true' : 'false'}">
                                <strong>${chapter.CAPITULO}</strong>
                            </a>
                        </li>
                    `;
                    $('#chapterTabs').append(tab);
    
                    let content = `
                    <div class="tab-pane fade ${isActive ? 'active in' : ''}" id="${tabId}" role="tabpanel" aria-labelledby="${tabId}-tab">
                        <div class="row">
                            ${chapter.items.map(item => {
                                let uniqueId = `capitulo_${item.Id_CAPITULO}_correlativo_${item.ID_CORRELATIVO}_${item.CORRELATIVO}`;
        
                                let inputField;
        
                                if (item.TIPO_RESPUESTA.includes('-')) {
        
                                    let options = item.TIPO_RESPUESTA.split('-').map(option => `
                                        <option value="${option}">${option}</option>`).join('');
        
                                    inputField = `
                                        <select id="select_${uniqueId}" class="form-control">
                                            <option value="" disabled selected>Seleccione una opción</option>
                                            ${options}
                                        </select>
                                    `;
                                } else if (item.TIPO_RESPUESTA.toLowerCase() === 'fecha') {
                                    inputField = `<input type="date" id="date_${uniqueId}" class="form-control" />`;
                                } else if (item.TIPO_RESPUESTA.toLowerCase() === 'texto' || item.TIPO_RESPUESTA.toLowerCase() === 'textolargo') {
                                    inputField = `<input type="text" id="text_${uniqueId}" class="form-control" />`;
                                } else {
                                    inputField = `<input type="text" id="default_${uniqueId}" class="form-control" />`;
                                }
        
                                return `
                                    <div class="col-md-4">
                                        <label for="${uniqueId}"><strong>${item.CORRELATIVO}</strong></label>
                                        <input type="hidden" id="idCapitulo_${uniqueId}" value="${item.Id_CAPITULO}" />
                                        <input type="hidden" id="idCorrelativo_${uniqueId}" value="${item.ID_CORRELATIVO}" />
                                        <input type="hidden" id="correlativo_${uniqueId}" value="${item.CORRELATIVO}" />
                                        ${inputField}
                                        <br>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    `;
    
                    $('#chapterContent').append(content);
                });
    
                let imagesTab = `
                    <li class="nav-item">
                        <a class="nav-link" id="images-tab" data-toggle="tab" href="#images" role="tab" aria-controls="images" aria-selected="false" >
                            <strong>Imágenes</strong>
                        </a>
                    </li>
                `;
                $('#chapterTabs').append(imagesTab);
    
                let imagesContent = `
                    <div class="tab-pane fade" id="images" role="tabpanel" aria-labelledby="images-tab">
                        <h5><strong>Cargar de imágenes</strong></h5>
                        <input type="file" id="imageUpload" class="form-control" multiple accept="image/*">
                        <br>
                        <div id="imagePreview" class="row mt-3"></div>
                    </div>
                `;
                $('#chapterContent').append(imagesContent);
    
                let firstTab = $('#chapterTabs a:first');
                firstTab.tab('show');
                $(firstTab.attr('href')).addClass('active in');  

                $('#imageUpload').on('change', async function () {
                    let preview = $('#imagePreview');
                    let files = this.files;
                    let maxSizeMB = 1;  
                    let maxWidthOrHeight = 1920;  

                    if (files.length > 0) {
                        Array.from(files).forEach(async (file, index) => {
        
                            if (!file.type.startsWith('image/')) {
                                swal('Error','Solo se permiten archivos de imagen.','error');
                                return;
                            }

                            try {

                                let compressedFile = await imageCompression(file, {
                                    maxSizeMB: maxSizeMB,
                                    maxWidthOrHeight: maxWidthOrHeight,
                                    useWebWorker: true,
                                    fileType: 'image/jpEg'  
                                });

                                selectedImages.push(compressedFile);

                                let reader = new FileReader();
                                reader.onload = function (e) {
                                    let image = `
                                        <div class="col-md-4">
                                            <img src="${e.target.result}" class="img-thumbnail" alt="Imagen">
                                        </div>
                                    `;
                                    preview.append(image);
                                };
                                reader.readAsDataURL(compressedFile);

                            } catch (error) {
                                console.error('Error al comprimir la imagen:', error);
                            }
                        });
                    }
                });               

            });
    
            $('#manual').modal('show');
        });
    }

    $('#updateButton').on('click', function () {
        var id = $('#id_Tarea').val();
        var dataToSend = [];
        var formData = new FormData();

        $('#chapterContent .tab-pane').each(function () {
            var inputs = $(this).find('input[type="text"], input[type="date"], select');

            var items = [];
    
            inputs.each(function () {
                var hiddenIdCapitulo = $(this).siblings('input[id^="idCapitulo_"]').val();
                var hiddenIdCorrelativo = $(this).siblings('input[id^="idCorrelativo_"]').val();
                var inputValue = $(this).val() || "SC";
    
                items.push({
                    tareaId: id,
                    idCapitulo: hiddenIdCapitulo,
                    idCorrelativo: hiddenIdCorrelativo,
                    respuesta: inputValue
                });
            });
    
            if (items.length > 0) {
                dataToSend.push(items);
            }
        });
    
        formData.append('Id_Tarea', id);
        formData.append('data', JSON.stringify(dataToSend));
    
        if (selectedImages.length > 0) {
            selectedImages.forEach((image, index) => {

                let newFileName = `imagen_${index + 1}.jpg`;  

                let jpgImage = new File([image], newFileName, { type: 'image/jpeg' });
    
                formData.append('images[]', jpgImage);
            });
        } else {
            console.log('No se seleccionaron imágenes.');
        }

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

                $('#manual').modal('hide');

                swal({
                    title: "Actualizando",
                    text: "Espere un momento por favor...",
                    imageUrl: "/img/Spinner-1s-200px2.gif",
                    showConfirmButton: false,
                    allowOutsideClick: false
                });

                $.ajax({
                    url: '/nueva_respuesta',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        swal.close();
                        window.location.reload(); 
                    },
                    error: function (xhr, status, error) {
                        console.error('Error al enviar datos:', error);
                    }
                });

            }
        }
        );

    });

    $('#emergente').on('click', function () {
        $('#modal_emergente').modal('show');
    });

    $('#gerencia').change(function() {
        var gerencia = $(this).val(); 
        
        $('#sector').empty();
        $('#sector').append('<option value="">Seleccione un sector</option>');
        
        $.ajax({
            url: '/ger/' + gerencia,
            type: 'GET',
            success: function(response) {
   
                $('#area').empty();

                $('#area').append('<option value="">Seleccione un area</option>');
    
                $.each(response, function(index, item) {
                    $('#area').append('<option value="' + item.Id + '">' + item.Descripcion +'</option>');
                });
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    $('#area').change(function() {
        var area = $(this).val(); 
    
        $.ajax({
            url: '/area/' + area,
            type: 'GET',
            success: function(response) {
    
                $('#sector').empty();

                $('#sector').append('<option value="">Seleccione un sector</option>');
    
                $.each(response, function(index, item) {
                    $('#sector').append('<option value="' + item.Id + '">' + item.Descripcion +'</option>');
                });
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    $('#sector').change(function() {
        var sector = $(this).val(); 
    
        $.ajax({
            url: '/sector/' + sector,
            type: 'GET',
            success: function(response) {
    
                $('#equipo').empty();

                $('#equipo').append('<option value="">Seleccione un equipo</option>');
    
                $.each(response, function(index, item) {
                    $('#equipo').append('<option value="' + item.Id + '">' + item.Codigo +'</option>');
                });
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    $('#equipo').change(function() {
        var equipo = $(this).val(); 
    
        $.ajax({
            url: '/equipo_p/' + equipo,
            type: 'GET',
            success: function(response) {
    
                $('#protocolo').empty();

                $('#protocolo').append('<option value="">Seleccione un protocolo</option>');
    
                $.each(response, function(index, item) {
                    $('#protocolo').append('<option value="' + item.ID + '">' + item.PROTOCOLO +'</option>');
                });
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    $('#crear').on('click', function() {
        const fecha = $('#fecha').val();
        const equipo = $('#equipo').val();
        const protocolo = $('#protocolo').val();
        const tecnico = $('#tecnico').val();
        const tipo_emergente = $('#tipo_emergente').val();

        if(!equipo || !protocolo || !tecnico || !fecha || !tipo_emergente){
            swal('Error', 'Debe seleccionar todos los campos', 'error');
            return;
        }

        const data = {
            fecha,
            equipo,
            protocolo,
            tecnico,
            tipo_emergente
        }

        swal({
            title: "¡SAPMA!",
            text: "¿Esta seguro de de crear esta tarea emergente?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false
        }, function(isConfirm) {
            if (isConfirm){
                $('#modal_emergente').modal('hide');
                $.ajax({
                    url: '/crear_emergente',
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    beforeSend: function() {

                        swal({
                            title: "Creando",
                            text: "Espere un momento por favor...",
                            imageUrl:"/img/Spinner-1s-200px2.gif",
                            showConfirmButton: false,
                            allowOutsideClick: false
                        });
                    },
                    success: function (data) {
                        const nuevo_id = data;
                        localStorage.setItem('lastUpdatedTaskId', nuevo_id);
                        window.location.reload(); 
                    },
                    error: function (xhr, status, error) {
                        console.error('Error al enviar datos:', error);
                    }
                });

            }
        });

    });
    
});