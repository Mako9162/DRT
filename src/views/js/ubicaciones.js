var table1;
$(document).ready(function () {

    $('#date3').on('change', function() {
        var meses = [
            { value: '01', name: 'Enero' },
            { value: '02', name: 'Febrero' },
            { value: '03', name: 'Marzo' },
            { value: '04', name: 'Abril' },
            { value: '05', name: 'Mayo' },
            { value: '06', name: 'Junio' },
            { value: '07', name: 'Julio' },
            { value: '08', name: 'Agosto' },
            { value: '09', name: 'Septiembre' },
            { value: '10', name: 'Octubre' },
            { value: '11', name: 'Noviembre' },
            { value: '12', name: 'Diciembre' }
        ];
    
        var $selectMes = $('#date4');
        $selectMes.empty();
        $selectMes.append('<option value="" disabled selected>Seleccione un mes</option>');
        $.each(meses, function(index, mes) {
            $selectMes.append('<option value="' + mes.value + '">' + mes.name + '</option>');
        });
    });

    function initDataTable() {
        
        table1 = $('#tabla_prot1').DataTable({
            "dom": 'Bfrtip',
            "searching": true,
            "lengthChange": false,
            "colReorder": true,
            "buttons": [
                {
                    "extend": "excelHtml5",
                    "text": '<i class="fa fa-file-excel-o"></i>',
                    "title": "TareasGenerales",
                    "titleAttr": "Exportar a Excel",
                    "className": "btn btn-rounded btn-success",
                    "exportOptions": {
                        "columns": [0, 1, 2, 3, 4]
                    },
                    customize: function (xlsx) {
                        const sheet = xlsx.xl.worksheets["sheet1.xml"];
                        $("row:first c", sheet).attr("s", "47");
                    }
                }
            ],
            "bDestroy": true,
            "scrollX": true,
            "bInfo": true,
            "iDisplayLength": 15,
            "autoWidth": false,
            "columnDefs": [
                {
                    "targets": "_all",
                    "className": "text-center"
                }
            ],
            "language": {
                "sProcessing": "Procesando...",
                "sLengthMenu": "Mostrar _MENU_ registros",
                "sZeroRecords": "No se encontraron resultados",
                "sEmptyTable": "Sin información",
                "sInfo": "Mostrando un total de _TOTAL_ registros",
                "sInfoEmpty": "Mostrando un total de 0 registros",
                "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
                "sSearch": "Buscar:",
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
                "select": {
                    "rows": {
                        "_": "Has seleccionado %d filas",
                        "0": "Click en una fila para seleccionar",
                        "1": "Has seleccionado 1 fila"
                    }
                }
            }
        }).columns.adjust();
    }    
    
    // Inicializa el DataTable vacío al cargar la página.
    initDataTable(); 

    $('#buscar').on('click', function () {
        var ano = $('#date3').val();
        var mes = $('#date4').val();
    
        if (!ano || !mes) {
            swal("Sapma", "Por favor, debe seleccionar año y mes.", "error");
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
            url: '/buscar_ubicaciones',
            type: 'POST',
            data: {
                ano: ano,
                mes: mes
            },
            success: function (response) {
                swal.close();

                if ($.fn.DataTable.isDataTable('#tabla_prot1')) {
                    table1.destroy();
                }
    
                // Vaciar el tbody de la tabla
                $('#tabla_prot1 tbody').empty();
                response.ubicaciones.forEach(function (item) {
                    let fechaValue = ano + '-' + mes; // Formato "YYYY-MM"
                    
                    let fechaInput = `<input type="month" class="form-control" value="${fechaValue}" disabled>`;
                    
                    let observacionInput = `<input type="text" class="form-control" style="width: 85%;" value="${item.Observacion || ''}">`;
                    
                    let icono;
                    if (item.Estado && item.Estado !== "") {
                        icono = `<i class="fa fa-check" aria-hidden="true" title="Estado asignado" style="color: green; font-size: 1.2em; margin-left: 8px;"></i>`;
                    } else {
                        icono = `<i class="fa fa-warning" aria-hidden="true" title="Sin estado" style="color: orange; font-size: 1.2em; margin-left: 8px;"></i>`;
                    }
                    
                    // Select para estados
                    let selectEstado = `<select class="form-control">`;
                    selectEstado += `<option value="">Seleccione una opción</option>`;
                    response.estados.forEach(function (estado) {
                        let selected = (estado.Estado === item.Estado) ? 'selected' : '';
                        selectEstado += `<option value="${estado.Id}" ${selected}>${estado.Estado}</option>`;
                    });
                    selectEstado += `</select>`;
                    
                    let fila = `
                        <tr>
                            <td>${item.Id}</td>
                            <td>${item.Ubicacion}</td>
                            <td>${fechaInput}</td>
                            <td>${selectEstado}</td>
                            <td>${observacionInput}&nbsp;&nbsp;${icono}</td>
                        </tr>
                    `;
                    $('#tabla_prot1 tbody').append(fila);
                });
                

                if ($('#tabla_prot1 tbody tr').length > 0) {
                    $('#act_ubicaciones').prop('disabled', false);
                } else {
                    $('#act_ubicaciones').prop('disabled', true);
                }
    
                // Re-inicializa el DataTable
                initDataTable();
    
                $('#date3').val('');
                $('#date4').val('');
            },
            error: function (xhr, status, error) {
                swal("Sapma", "Error al buscar los registros.", "error");
            }
        });
    });

    $('#act_ubicaciones').on('click', function () {
        const ano = $('#date3').val();
        const mes = $('#date4').val();
        // Recoger los datos de la tabla
        var data = [];
        $('#tabla_prot1 tbody tr').each(function () {
            var id = $(this).find('td:eq(0)').text();
            var fecha = $(this).find('input[type="month"]').val();
            var estado = $(this).find('select').val();
            var observacion = $(this).find('input[type="text"]').val();
            
            data.push({
                Id: id,
                Fecha: fecha,
                Estado: estado,
                Observacion: observacion
            });
        });

        swal({
            title: "Sapma",
            text: "¿Desea enviar estos información?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Sí, enviar",
            cancelButtonText: "Cancelar"
        }, function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/actualizar_ubicaciones',
                    type: 'POST',
                    data: {
                        data: data
                    },
                    success: function (response) {
                        swal("Sapma", response.mensaje, "success");
                        window.location.reload(); // Recargar la página después de la actualización
                    },
                    error: function (xhr, status, error) {
                        swal("Sapma", "Error al actualizar los registros.", "error");
                    }
                });
            } else {
                swalº("Sapma", "Operación cancelada.", "error");
            }
        }
        );
    });

});
