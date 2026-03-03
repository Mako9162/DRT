var table1;
var table2;

$(document).ready(function () {

    function initDataTable() {
      
        table1 = $('#tabla_ubicacion').DataTable({
          "select": {
            "style": "multi"
          },
          "dom": 'f<"toolbar1">rtip',
          "searching": true,
          "lengthChange": false,
          "colReorder": true,
          initComplete: function () {
          $(".toolbar1").html(`			
                  <div>
                      <button id="nueva_ubicacion" type="button" class="btn btn-inline btn-primary ladda-button float-right">Agregar</button>
                  </div>
                `
            );
          },
          "bDestroy": true,
          "scrollX": true,
          "bInfo": true,
          "iDisplayLength": 8,
          "bDestroy": true,
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
  
        }).columns.adjust();
    }
  
    initDataTable(); 

    $(document).on('click', '#nueva_ubicacion', function () {
        $("#titulo_ubicacion").html("Agregar ubicación crítica");
        $("#guardar_ubicacion").prop("hidden", false);
        $("#actualizar_ubicacion").prop("hidden", true);
        $('#ubicacion_modal').modal('show');
    });

    $(document).on('click', '.editar_ubicacion', function () {
        const id = $(this).closest('tr').find('td:eq(0)').text();
        const ubicacion = $(this).closest('tr').find('td:eq(1)').text();
        const latitud = $(this).closest('tr').find('td:eq(2)').text();
        const longitud = $(this).closest('tr').find('td:eq(3)').text();
        $("#f_id").val(id);
        $("#f_ubicacion").val(ubicacion);
        $("#f_latitud").val(latitud);
        $("#f_longitud").val(longitud);
        $("#titulo_ubicacion").html("Editar ubicación crítica Nº "+id);
        $("#guardar_ubicacion").prop("hidden", true);
        $("#actualizar_ubicacion").prop("hidden", false);
        $('#ubicacion_modal').modal('show');
    });

    $(document).on('click', '.eliminar_ubicacion', function () {
        const id = $(this).closest('tr').find('td:eq(0)').text();

        swal({
            title: 'Sapma',
            text: '¿Está seguro de eliminar la ubicación?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false,
        }, function(isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/eliminar_ubicacion',
                    type: 'POST',
                    data: { id: id },
                    success: function (response) {
                        if (response.success) {
                            swal('Sapma', 'Ubicación eliminada correctamente', 'success');
                            window.location.reload();
                        } else {
                            swal('Error', 'Error al eliminar la ubicación', 'error');
                        }
                    }
                });
            } else {
                swal('Sapma', 'Cancelado', 'error');
                return false;
            }
        });
    });

    $(document).on('click', '#guardar_ubicacion', function () {
        const ubicacion = $("#f_ubicacion").val();
        const latitud = $("#f_latitud").val();
        const longitud = $("#f_longitud").val();

        swal({
            title: 'Sapma',
            text: '¿Está seguro de guardar la ubicación?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false,
        }, function(isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/guardar_ubicacion',
                    type: 'POST',
                    data: {
                        ubicacion: ubicacion,
                        latitud: latitud,
                        longitud: longitud
                    },
                    success: function (response) {
                        if (response.success) {
                            swal('Sapma', 'Ubicación guardada correctamente', 'success');
                            $('#ubicacion_modal').modal('hide');
                            window.location.reload();
                        } else {
                            swal('Error', 'Error al guardar la ubicación', 'error');
                        }
                    }
                });
            } else {
                swal('Sapma', 'Cancelado', 'error');
                return false;
            }
        }
    );
    });

    $(document).on('click', '#actualizar_ubicacion', function () {
        const id = $("#f_id").val();
        const ubicacion = $("#f_ubicacion").val();
        const latitud = $("#f_latitud").val();
        const longitud = $("#f_longitud").val();

        swal({
            title: 'Sapma',
            text: '¿Está seguro de actualizar la ubicación?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false,
        }, function(isConfirm) {

            if (isConfirm) {
                $.ajax({
                    url: '/actualizar_ubicacion',
                    type: 'POST',
                    data: {
                        id: id,
                        ubicacion: ubicacion,
                        latitud: latitud,
                        longitud: longitud
                    },
                    success: function (response) {
                        if (response.success) {
                            swal('Sapma', 'Ubicación actualizada correctamente', 'success');
                            $('#ubicacion_modal').modal('hide');
                            window.location.reload();
                        } else {
                            swal('Error', 'Error al actualizar la ubicación', 'error');
                        }
                    }
                });
            } else {
                swal('Sapma', 'Cancelado', 'error');
                return false;
            }
        }   
    );    
    });

    function initDataTable1() {
      
        table2 = $('#tabla_estados').DataTable({
                  "select": {
            "style": "multi"
          },
          "dom": 'f<"toolbar">rtip',
          "searching": true,
          "lengthChange": false,
          "colReorder": true,
          initComplete: function () {
          $(".toolbar").html(`			
                  <div>
                      <button id="nuevo_estado" type="button" class="btn btn-inline btn-primary ladda-button float-right">Nuevo</button>
                  </div>
                `
            );
          },
          "bDestroy": true,
          "scrollX": true,
          "bInfo": true,
          "iDisplayLength": 8,
          "bDestroy": true,
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
  
        }).columns.adjust();
    }
  
    initDataTable1(); 

    $(document).on('click', '#nuevo_estado', function () {
        $("#titulo_estados").html("Agregar estado");
        $("#guardar_estados").prop("hidden", false);
        $("#actualizar_estados").prop("hidden", true);
        $('#estados_modal').modal('show');
    });

    $(document).on('click', '#guardar_estados', function () {
        const estado = $("#f_estados").val();

        swal({
            title: 'Sapma',
            text: '¿Está seguro de guardar el estado?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false,
        }, function(isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/guardar_estado',
                    type: 'POST',
                    data: { estado: estado },
                    success: function (response) {
                        if (response.success) {
                            swal('Sapma', 'Estado guardado correctamente', 'success');
                            $('#estados_modal').modal('hide');
                            window.location.reload();
                        } else {
                            swal('Error', 'Error al guardar el estado', 'error');
                        }
                    }
                });
            } else {
                swal('Sapma', 'Cancelado', 'error');
                return false;
            }
        });
    });

    $(document).on('click', '.editar_estado', function () {
        const id = $(this).closest('tr').find('td:eq(0)').text();
        const estado = $(this).closest('tr').find('td:eq(1)').text();
        $("#f_id").val(id);
        $("#f_estados").val(estado);
        $("#titulo_estados").html("Editar estado");
        $("#guardar_estados").prop("hidden", true);
        $("#actualizar_estados").prop("hidden", false);
        $('#estados_modal').modal('show');
    });

    $(document).on('click', '#actualizar_estados', function () {
        const id = $("#f_id").val();
        const estado = $("#f_estados").val();

        swal({
            title: 'Sapma',
            text: '¿Está seguro de actualizar el estado?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false,
        }, function(isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/actualizar_estado',
                    type: 'POST',
                    data: { id: id, estado: estado },
                    success: function (response) {
                        if (response.success) {
                            swal('Sapma', 'Estado actualizado correctamente', 'success');
                            $('#estados_modal').modal('hide');
                            window.location.reload();
                        } else {
                            swal('Error', 'Error al actualizar el estado', 'error');
                        }
                    }
                });
            } else {
                swal('Sapma', 'Cancelado', 'error');
                return false;
            }
        });
    });

    $(document).on('click', '.eliminar_estado', function () {
        const id = $(this).closest('tr').find('td:eq(0)').text();

        swal({
            title: 'Sapma',
            text: '¿Está seguro de eliminar el estado?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false,
        }, function(isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/eliminar_estado',
                    type: 'POST',
                    data: { id: id },
                    success: function (response) {
                        if (response.success) {
                            swal('Sapma', 'Estado eliminado correctamente', 'success');
                            window.location.reload();
                        } else {
                            swal('Error', 'Error al eliminar el estado', 'error');
                        }
                    }
                });
            } else {
                swal('Sapma', 'Cancelado', 'error');
                return false;
            }
        });
    });
    
});    