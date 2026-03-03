$(document).ready(function() {
    
    $('#date3').change(function() {
        var year = $(this).val(); 

        $.ajax({
            url: '/fuente_mesg/' + year,
            type: 'GET',
            success: function(response) {

                $('#date4').empty();

                $('#date4').append('<option value="" disabled selected>Seleccione un mes</option>');
                $.each(response, function(index, month) {
                    var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    $('#date4').append('<option value="' + month + '">' + monthNames[parseInt(month) - 1] + '</option>');
                });
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    var checkTogglePressed = false;

    const table1 = $('#tabla_reparacion').DataTable({
        select:  false,
        dom:      'Bf<"toolbar">rtip',
        deferRender: true,
        scrollX:  true,
        autoWidth: false,
        iDisplayLength: 15,
        bDestroy: false,
        columns: [
        { title: 'Tarea' },
        { title: 'Fecha' },
        { title: 'Codigo Sapma' },
        { title: 'Tag_DMH' },
        { title: 'Técnico' },
        { title: 'Gerencia' },
        { title: 'Area' },
        { title: 'Sector' },
        { title: 'Tipo de servicio' },
        { title: 'Estado de tarea' },
        { title: 'Estado equipo' },
        { title: 'Observación estado' },
        { title: 'Validador' },
        { title: 'Observación validación' },
        {
            title: 'Ver',
            orderable: false,
            searchable: false
        }
        ],
        data: [],  // arranca vacía
        language: {
        processing:    'Procesando...',
        lengthMenu:    'Mostrar _MENU_ registros',
        zeroRecords:   'No se encontraron resultados',
        emptyTable:    'Sin información',
        info:          'Mostrando un total de _TOTAL_ registros',
        infoEmpty:     'Mostrando un total de 0 registros',
        infoFiltered:  '(filtrado de un total de _MAX_ registros)',
        search:        'Buscar:',
        loadingRecords:'Cargando...',
        paginate: {
            first:    'Primero',
            last:     'Último',
            next:     'Siguiente',
            previous: 'Anterior'
        },
        select: {
            rows: {
            _:  'Has seleccionado %d filas',
            0:  'Click en una fila para seleccionar',
            1:  'Has seleccionado 1 fila'
            }
        }
        },
        buttons: [
        {
            extend:        'excelHtml5',
            text:          '<i class="fa fa-file-excel-o"></i>',
            title:         'Tareas_Reparación',
            titleAttr:     'Exportar a Excel',
            className:     'btn btn-rounded btn-success',
            exportOptions: { columns: [...Array(14).keys()] },
            customize: function(xlsx) {
                const sheet = xlsx.xl.worksheets['sheet1.xml'];
                $('row:first c', sheet).attr('s', '47');
            }
        }
        ],
        initComplete: function () {
        $(".toolbar").html(`
                <style>
                #parentFilter, #infoFilter, #subInfoFilter {
                float: left;
                margin-left: 10px;
                }

                #parentSelect, #infoSelect, #subInfoSelect{
                height: 38px;
                width: 200px;
                border: 1px solid rgb(227, 227, 227);
                border-radius: 4px;
                }

                #clearFilters {
                float: left;
                margin-left: 10px;
                height: 38px;
                line-height: 36px;
                padding: 0 12px;
                cursor: pointer;
                }

                @media (max-width: 100px) {
                #parentFilter,
                #infoFilter,
                #subInfoFilter {
                    float: none;
                    margin-left: 0;
                }

                #parentSelect,
                #infoSelect,
                #subInfoSelect {
                    width: 100%;
                }
                }
                </style>			
                <div>
                    <div id="parentFilter">
                        <select id="parentSelect" width: 50%;>
                        </select>
                    </div>
                    <div id="infoFilter">
                        <select id="infoSelect" width: 50%;>
                        </select>
                    </div>
                    <div id="subInfoFilter">
                        <select id="subInfoSelect" width: 50%;">
                        </select>
                    </div>
                    <button id="clearFilters" type="button" class="btn btn-inline btn-danger btn-sm ladda-button"><i class="fa fa-filter"></i></button>
                </div>
            `);
        },
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

    }).on("select.dt deselect.dt", function (e, dt, type, indexes) {
        var count = table1.rows({ selected: true }).count();
        if (!checkTogglePressed) {
        if (count > 0) {
            $("#pdfs").prop("disabled", false);
        } else {
            $("#pdfs").prop("disabled", true);
        }

        if (count === 1) {
            $("#pdfs1").prop("hidden", false);
            $("#pdfs").prop("hidden", true);
        } else if (count > 1) {
            $("#pdfs").prop("hidden", false);
            $("#pdfs1").prop("hidden", true);
        } else {
            $("#pdfs").prop("hidden", true);
            $("#pdfs1").prop("hidden", true);
        }
        }
    }).columns.adjust();

    $('#parentSelect').append('<option value="" selected disabled>Seleccione una gerencia</option>');
    $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
    $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
    
    table1.column(5).data().unique().sort().each(function(value, index) {
        $('#parentSelect').append(
        '<option value="' + value + '">' + value + '</option>');
    });

    $('#parentSelect').on('change', function(e) {
        var selectedValue = $(this).val();
        table1.column(5).search(selectedValue).draw();

        $('#infoSelect').empty();
        $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
        table1.column(6, {search: 'applied'}).data().unique().sort().each(function(value, index) {
            $('#infoSelect').append('<option value="' + value + '">' + value + '</option>');
        });
    });

    $('#infoSelect').on('change', function(e) {
        var selectedParentValue = $('#parentSelect').val();
        var selectedInfoValue = $(this).val(); 

        table1.column(5).search(selectedParentValue).column(6).search(selectedInfoValue).draw();

        $('#subInfoSelect').empty(); 
        $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
        table1.column(7, {search: 'applied'}).data().unique().sort().each(function(value, index) {
            $('#subInfoSelect').append('<option value="' + value + '">' + value + '</option>');
        });
    });

    $('#subInfoSelect').on('change', function(e) {
        var selectedParentValue = $('#parentSelect').val();
        var selectedInfoValue = $('#infoSelect').val(); 
        var selectedSubInfoValue = $(this).val();

        table1.column(5).search(selectedParentValue);
        table1.column(6).search(selectedInfoValue);
        table1.column(7).search("^" + selectedSubInfoValue + "$", true, false);

        table1.draw();
    });

    $('#clearFilters').on('click', function() {
        $('#parentSelect').empty();
        $('#parentSelect').append('<option value="" selected disabled>Seleccione una gerencia</option>');
        table1.column(5).data().unique().sort().each(function(value, index) {
        $('#parentSelect').append(
        '<option value="' + value + '">' + value + '</option>');
        });
        $('#infoSelect').empty();
        $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
        $('#subInfoSelect').empty(); 
        $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
        table1.search('').columns().search('').draw();
        return false;
    });

    function actualizarFiltros() {
        // Borra y vuelve a poner la opción por defecto
        $('#parentSelect').html('<option value="" disabled selected>Seleccione una gerencia</option>');
        $('#infoSelect').html('<option value="" disabled selected>Seleccione un área</option>');
        $('#subInfoSelect').html('<option value="" disabled selected>Seleccione un sector</option>');
        
        // Recorre las gerencias únicas de la columna 5
        table1.column(5, { search: 'none' })  // search:'none' mira todos los datos, no solo filtrados
        .data()
        .unique()
        .sort()
        .each(function(valor) {
            $('#parentSelect').append(`<option value="${valor}">${valor}</option>`);
        });
    }

    function reloadTable(data) {
        const rows = data.map(item => [
        item.IdTarea,
        item.FechaTarea,
        item.EquipoCodigoTAG,
        item.EquipoTagDMH, 
        item.UsuarioDescripcion,
        item.GerenciaDesc,
        item.AreaDesc,
        item.SectorDesc,
        item.TipoServicio,
        item.EstadoDesc,
        item.EstadoOperEquipo === 'SOP' ? 'Sistema operativo.' : 
        item.EstadoOperEquipo === 'SSR' ? 'Sistema sin revisar.' : 
        item.EstadoOperEquipo === 'SNO' ? 'Sistema no operativo.' :
        item.EstadoOperEquipo === 'SOCO' ? 'Sistema operativo con obs.' :
        item.EstadoOperEquipo === 'SFS' ? 'Sistema fuera de servicio.' : 
        item.EstadoOperEquipo === '- INC -' ? '-': item.EstadoOperEquipo,
        item.EstadoOperEquipoObs === '- INC -' ? '-': item.EstadoOperEquipoObs,
        item.ValidacionResponsable === null ? '' : item.ValidacionResponsable,
        item.ValidacionObservacion  === null ? '' : item.ValidacionObservacion,
        (item.EstadoDesc === 'Terminada validada' || item.EstadoDesc === 'Terminada sin validar')
            ? `<center>
                <a href="/protocolo/${item.IdTarea}"
                    class="btn btn-inline btn-primary btn-sm ladda-button"
                    target="_blank">
                <i class="fa fa-file-archive-o"></i>
                </a>
            </center>`
            : ''
        ]);

        table1
        .clear()
        .rows.add(rows)
        .columns.adjust()
        .draw();

        actualizarFiltros();
    }

    $("#buscar").click(function() {
        var year = $("#date3").val();
        var month = $("#date4").val();

        if (year && month) {
            swal({
                title: 'Cargando',
                text: 'Espere un momento por favor...',
                imageUrl: '/img/Spinner-1s-200px2.gif',
                showConfirmButton: false,
                allowOutsideClick: false
            });

            $.post('/buscar_reparaciones', { year: year, month: month })
            .done(function(data) {
                swal.close();
                reloadTable(data);
            })
            .fail(function(err) {
                swal("Error", "Ocurrió un error al buscar las reparaciones.", "error");
                console.error(err);
            });
        } else {
            swal("Error", "Por favor, seleccione un año y un mes.", "error");
        }
    });

    $("#plantilla").click(function() {

        if (table1.data().count() === 0) {
            swal("Atención", "No hay información para generar plantilla. Por favor, filtre primero por mes y año.", "info");
            return;
        }

        const rows = table1.rows().data().toArray();
        const Tareas = rows.map(row => ({
            Tarea: row[0],
        }));


        $.post('/verificacionEquipos', { Tareas })
        .done(function(response) {
            if (response.success) {
                swal({
                    title: "Generando plantilla",
                    text: "Espere un momento por favor...",
                    imageUrl: '/img/Spinner-1s-200px2.gif',
                    showConfirmButton: false,
                    allowOutsideClick: false
                });
                fetch('/plantilla_reparaciones', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ Tareas })
                })
                .then(res => {
                    if (!res.ok) throw new Error("Error en la respuesta del servidor");
                    return res.arrayBuffer();
                })
                .then(buffer => {
                    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'planificacion_reparaciones.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    swal.close();
                })
                .catch(err => {
                    swal("Error", "Ocurrió un error al generar la plantilla.", "error");
                    console.error(err);
                });

            } else {
                swal({
                    title: "Atención",
                    text: response.message + '. ¿Desea continuar y generar la plantilla sin estos equipos?',
                    type: "warning",
                    confirmButtonText: "Continuar",
                    cancelButtonText: "Cancelar",
                    showCancelButton: true,
                    closeOnConfirm: false
                }, function(isConfirm) {
                    swal({
                        title: "Generando plantilla",
                        text: "Espere un momento por favor...",
                        imageUrl: '/img/Spinner-1s-200px2.gif',
                        showConfirmButton: false,
                        allowOutsideClick: false
                    });

                    if (isConfirm) {
                        const tareasTags = rows.map(row => ({
                            Tarea: row[0],
                            Tags: row[2]
                        }));

                        // Filtrar las tareas que NO estén en response.codigos
                        const tareasFiltradas = tareasTags.filter(t => !response.codigos.includes(t.Tags));
                        const Tareas = tareasFiltradas.map(t => ({ Tarea: t.Tarea }));

                       fetch('/plantilla_reparaciones', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ Tareas })
                        })
                        .then(res => {
                            if (!res.ok) throw new Error("Error en la respuesta del servidor");
                            return res.arrayBuffer();
                        })
                        .then(buffer => {
                            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'planificacion_reparaciones.xlsx';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                            swal.close();
                        })
                        .catch(err => {
                            swal("Error", "Ocurrió un error al generar la plantilla.", "error");
                            console.error(err);
                        });
                    }
                });
            }
        })
        .fail(function(err) {
            swal("Error", "Ocurrió un error al verificar los equipos.", "error");
            console.error(err);
        });

    });

    function cargarAnios() {
        const select = document.getElementById("ano");
        const anioActual = new Date().getFullYear();

        // Limpiar opciones previas (por si se vuelve a ejecutar la función)
        select.innerHTML = '<option value="" disabled>Seleccione un año</option>';

        for (let anio = anioActual - 2; anio <= anioActual + 1; anio++) {
        const option = document.createElement("option");
        option.value = anio;
        option.textContent = anio;

        if (anio === anioActual) {
            option.selected = true;
        }

        select.appendChild(option);
        }
    }

    cargarAnios();

    $("#inputFile").on("change", function() {
        const file = this.files[0];

        if (file) {
        const fileName = file.name.toLowerCase();
        const validExtensions = [".xls", ".xlsx"];

        const isValid = validExtensions.some(ext => fileName.endsWith(ext));

        if (!isValid) {
            swal("Error","Solo se permiten archivos Excel (.xls o .xlsx)", "error");
            $(this).val(""); // limpia el input
        }
        }
    });

    $("#planificacion").click(function() {
        $('#modalReparaciones').modal('show');
    });

    $('#subirArchivo').click(function() {
        const fileInput = document.getElementById('inputFile');
        const file = fileInput.files[0];
        const year = document.getElementById('ano').value;
        const month = document.getElementById('mes').value;

        if (!file) {
            swal("Error", "Por favor, seleccione un archivo.", "error");
            return;
        }

        if (!year) {
            swal("Error", "Por favor, seleccione un año.", "error");
            return;
        }
        if (!month) {
            swal("Error", "Por favor, seleccione un mes.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("year", year);
        formData.append("month", month);

        swal({
            title: "¿Está seguro?",
            text: "A continuación se procesará el archivo y se planificarán las reparaciones. Esto puede tardar unos minutos.",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, procesar",
            cancelButtonText: "Cancelar",
            closeOnConfirm: false
        }, function(isConfirm) {
            if (isConfirm) {
                swal({
                    title: "Creando planificación de tareas para reparación.",
                    text: "Espere un momento por favor...",
                    imageUrl: '/img/Spinner-1s-200px2.gif',
                    showConfirmButton: false,
                    allowOutsideClick: false
                });

                $.ajax({
                    url: "/planificar_reparaciones",
                    type: "POST",
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function(response) {
                        swal("Éxito", "El archivo se ha procesado correctamente.", "success");
                        $('#modalReparaciones').modal('hide');
                        // Limpiar el input y selects
                        $('#inputFile').val('');
                        $('#ano').val('');
                        $('#mes').val('');
                        // Recargar la tabla con las nuevas reparaciones
                        $("#buscar").click();
                    },
                    error: function(err) {
                        swal("Error", "Ocurrió un error al enviar el archivo.", "error");
                        console.error(err);
                    }
                });
            }
        }
        );
    });

    $("#pdfs").on("click", function () {
        var rows_selected = table1.rows({selected: true}).data();
        var idpdf = [];
        var codigo = [];

        $.each(rows_selected, function (index, value) {
            var textoEnlace = $(value[0]).find("a").text();
            idpdf.push(textoEnlace);
        });

        $.each(rows_selected, function (index, value) {
            codigo.push(value[2]);
        });

        $.ajax({
        url: "/pdfs",
        type: "POST",
        data: {
            idpdf,
            codigo,
        },
        beforeSend: function () {
            swal({
            title: "Generando PDFs",
            text: "Espere un momento por favor...",
            imageUrl: "/img/Spinner-1s-200px2.gif",
            showConfirmButton: false,
            allowOutsideClick: false,
            });
        },
        }).done(function (data) {
        swal(
            {
            title: "PDFs Generados",
            text: "Se han agregado los PDFs a un archivo comprimido",
            type: "success",
            confirmButtonText: "Aceptar",
            allowOutsideClick: false,
            },
            function (isConfirm) {
            if (isConfirm) {
                window.location.href = "/archivo";
            }
            }
        );
        });
    });

    $("#pdfs1").on("click", function () {
        var rows_selected = table1.rows({selected: true}).data();
        var idpdf = [];
        var codigo= [];

        $.each(rows_selected, function (index, value) {
            var textoEnlace = $(value[0]).find("a").text();
            idpdf.push(textoEnlace);
        });

        $.each(rows_selected, function (index, value) {
            codigo.push(value[2]);
        });

        window.location.href = "/archivo/" + idpdf + "/" + codigo;		
    });
});