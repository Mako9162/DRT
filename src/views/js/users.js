function toggleEstado(id) {
    const switchElement = document.getElementById(`estadoSwitch_${id}`);
    const estadoOriginal = switchElement.checked; 
    
    switchElement.checked = estadoOriginal;
    
    if (estadoOriginal) {
        activar(id, switchElement);
    } else {
        confirmar(id, switchElement);
    }
}

function confirmar(id, switchElement) {
    swal({
        title: "¿Está Seguro?",
        text: "A continuación desactivará este usuario",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-danger",
        confirmButtonText: "Sí",
        cancelButtonText: "No",
        closeOnConfirm: false      
    },
    function(isConfirm) {
        if (isConfirm) {
            window.location = "/users/delete/" + id;
        } else {
            switchElement.checked = true;
        }
        switchElement.disabled = false;
    });
}

function activar(id, switchElement) {
    swal({
        title: "¿Está Seguro?",
        text: "A continuación activará este usuario",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-success",
        confirmButtonText: "Sí",
        cancelButtonText: "No",
        closeOnConfirm: false      
    },
    function(isConfirm) {
        if (isConfirm) {
            window.location = "/users/activar/" + id;
        } else {
            switchElement.checked = false;
        }
        switchElement.disabled = false;
    });
}

$(document).ready(function () {

    $('#tabla_users').DataTable({
        "createdRow": function (row, data, dataIndex) {
            if (data[4] === "null" || data[4] === "undefined") {
                $('td:eq(4)', row).text("");
            } 

            if (data[5] === "null" || data[5] === "undefined") {
                $('td:eq(5)', row).text("");
            } 
        },    
        'order': [[0, 'asc']],
        "dom": 'Bfrtip',
        "searching": true,
        "lengthChange": false,
        "colReorder": true,
        "buttons": [
          {
            "extend": "excelHtml5",
            "text": '<i class="fa fa-file-excel-o"></i>',
            "title": "usuarios",
            "titleAttr": "Exportar a Excel",
            "className": "btn btn-rounded btn-success",
            "exportOptions": {
              "columns": [0, 1, 2, 3, 4, 5, 6],
            },
            customize: function (xlsx) {
              const sheet = xlsx.xl.worksheets["sheet1.xml"];
              $("row:first c", sheet).attr("s", "47");
            },
          },
        ],
        "bDestroy": true, 	
        "scrollX": true,
        "bInfo": true,
        "iDisplayLength": 20,
        "autoWidth": false,
        "language": {
            "sProcessing": "Procesando...",
            "sLengthMenu": "Mostrar _MENU_ registros",
            "sZeroRecords": "No se encontraron resultados",
            "sEmptyTable": "Ningún dato disponible en esta tabla",
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
        },
    });

    $('#btnCrear').click(function(){
        option = 'add';
        id = null;
        $('#usuario_form').trigger('reset');
        $('#mdltitulo').html('Nuevo Usuario');
        $('#modalmantenimiento').modal('show');
        
    });
                                                                                                    
    $('#usuario_form').submit(function(e) {
        e.preventDefault();
        var datos = $(this).serialize();
        
        $.ajax({
            url: '/users/add',
            type: 'POST',
            data: datos,
            success: function(data) {
                console.log(data);
                if (data.error) {

                    swal({
                        title: "Error",
                        text: data.error,
                        type: "error",
                        confirmButtonClass: "btn-danger",
                        confirmButtonText: "Aceptar",
                        closeOnConfirm: false
                    });
                } else {
                    $('#modalmantenimiento').modal('hide');
                    swal({
                        title: "¡Bien hecho!",
                        text: "El usuario se ha guardado correctamente",
                        type: "success",
                        confirmButtonClass: "btn-success",
                        confirmButtonText: "Aceptar",
                        closeOnConfirm: false
                    }, function() {
                        window.location.href = "/users/edit/" + data.userId;
                        
                        setTimeout(function() {
                            $.ajax({
                                url: '/mail_user/' + data.userPass1 + '/' + data.userId,
                                type: 'POST',
                                data: datos,
                            });
                        }, 100);
                    });
                }
            }
        });
    });
    

});
