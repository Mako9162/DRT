$(document).ready(function() {
    
    $('#date3').change(function() {
        var year = $(this).val(); 

        $.ajax({
            url: '/mes_reparaciones/' + year,
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

    const table1 = $('#generales_reparaciones').DataTable({
        select:  {style: 'multi'},
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
        { title: 'Tag DMH' },
        { title: 'Tarea original' },
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
    
    table1.column(6).data().unique().sort().each(function(value, index) {
        $('#parentSelect').append(
        '<option value="' + value + '">' + value + '</option>');
    });

    $('#parentSelect').on('change', function(e) {
        var selectedValue = $(this).val();
        table1.column(6).search(selectedValue).draw();

        $('#infoSelect').empty();
        $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
        table1.column(7, {search: 'applied'}).data().unique().sort().each(function(value, index) {
            $('#infoSelect').append('<option value="' + value + '">' + value + '</option>');
        });
    });

    $('#infoSelect').on('change', function(e) {
        var selectedParentValue = $('#parentSelect').val();
        var selectedInfoValue = $(this).val(); 

        table1.column(6).search(selectedParentValue).column(7).search(selectedInfoValue).draw();

        $('#subInfoSelect').empty(); 
        $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
        table1.column(8, {search: 'applied'}).data().unique().sort().each(function(value, index) {
            $('#subInfoSelect').append('<option value="' + value + '">' + value + '</option>');
        });
    });

    $('#subInfoSelect').on('change', function(e) {
        var selectedParentValue = $('#parentSelect').val();
        var selectedInfoValue = $('#infoSelect').val(); 
        var selectedSubInfoValue = $(this).val();

        table1.column(6).search(selectedParentValue);
        table1.column(7).search(selectedInfoValue);
        table1.column(8).search("^" + selectedSubInfoValue + "$", true, false);

        table1.draw();
    });

    $('#clearFilters').on('click', function() {
        $('#parentSelect').empty();
        $('#parentSelect').append('<option value="" selected disabled>Seleccione una gerencia</option>');
        table1.column(6).data().unique().sort().each(function(value, index) {
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
        table1.column(6, { search: 'none' })  // search:'none' mira todos los datos, no solo filtrados
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
            `<a href="/protocolo/${item.Tarea_Origen}" target="_blank">${item.Tarea_Origen}</a>`, // 👈 aquí el cambio
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
            item.EstadoOperEquipo === '- INC -' ? '-' : item.EstadoOperEquipo,
            item.EstadoOperEquipoObs === '- INC -' ? '-' : item.EstadoOperEquipoObs,
            item.ValidacionResponsable ?? '',
            item.ValidacionObservacion ?? '',
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

            $.post('/general_reparaciones', { year: year, month: month })
            .done(function(data) {
                swal.close();
                $("#date3").val('');
                $("#date4").val('');
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

    $("#pdfs").on("click", function () {
        var rows_selected = table1.rows({selected: true}).data();
        var idpdf = [];
        var codigo = [];

        $.each(rows_selected, function (index, value) {
            idpdf.push(value[0]);
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
            idpdf.push(value[0]);
        });

        $.each(rows_selected, function (index, value) {
            codigo.push(value[2]);
        });

        window.location.href = "/archivo/" + idpdf + "/" + codigo;		
    });

});