// var table;
// var table1;
// $(document).ready(function () {
//   table = $("#tabla_prot")
//     .DataTable({
//       columnDefs: [
//         {
//           targets: [
//             0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
//             19,
//           ],
//           className: "miClase",
//         },
//         {
//           width: "60px",
//           targets: 1,
//         },
//         {
//           width: "130px",
//           targets: 7,
//         },
//       ],
//       select: {
//         style: "multi",
//       },
//       dom: 'Bf<"filters">rtip',
//       searching: true,
//       lengthChange: false,
//       colReorder: true,
//       buttons: [
//         {
//           extend: "excelHtml5",
//           text: '<i class="fa fa-file-excel-o"></i>',
//           title: "Equipos",
//           titleAttr: "Exportar a Excel",
//           className: "btn btn-rounded btn-success",
//           exportOptions: {
//             columns: [
//               0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
//               19,
//             ],
//           },
//           customize: function (xlsx) {
//             const sheet = xlsx.xl.worksheets["sheet1.xml"];
//             $("row:first c", sheet).attr("s", "47");
//           },
//         },
//       ],
//       initComplete: function () {
//         $(".filters").html(`
// 					<style>
// 					#parentFilter {
// 					float: left;
// 					margin-left: 15px;
// 					}

// 					#parentSelect {
// 					height: 38px;
// 					width: 100%;
// 					border: 1px solid rgb(227, 227, 227);
// 					border-radius: 4px;
// 					}

// 					#infoFilter {
// 					float: left;
// 					margin-left: 15px;
// 					}

// 					#infoSelect {
// 					height: 38px;
// 					width: 100%;
// 					border: 1px solid rgb(227, 227, 227);
// 					border-radius: 4px;
// 					}

// 					#subInfoFilter {
// 					float: left;
// 					margin-left: 15px;
// 					}

// 					#subInfoSelect {
// 					height: 38px;
// 					width: 100%;
// 					border: 1px solid rgb(227, 227, 227);
// 					border-radius: 4px;
// 					}

// 					@media (max-width: 768px) {
// 					#parentFilter,
// 					#infoFilter,
// 					#subInfoFilter {
// 						float: none;
// 						margin-left: 0;
// 					}

// 					#parentSelect,
// 					#infoSelect,
// 					#subInfoSelect {
// 						width: 100%;
// 					}
// 					}
// 					</style>			
// 					<div>
// 						<div id="parentFilter">
// 							<select id="parentSelect" width: 50%;>
// 							</select>
// 						</div>
// 						<div id="infoFilter">
// 							<select id="infoSelect" width: 50%;>
// 							</select>
// 						</div>
// 						<div id="subInfoFilter">
// 							<select id="subInfoSelect" width: 50%;">
// 							</select>
// 						</div>
// 					</div>
// 				`);
//       },
//       bDestroy: true,
//       scrollX: true,
//       bInfo: true,
//       iDisplayLength: 20,
//       autoWidth: true,
//       language: {
//         sProcessing: "Procesando...",
//         sLengthMenu: "Mostrar _MENU_ registros",
//         sZeroRecords: "No se encontraron resultados",
//         sEmptyTable: "Ningún dato disponible en esta tabla",
//         sInfo: "Mostrando un total de _TOTAL_ registros",
//         sInfoEmpty: "Mostrando un total de 0 registros",
//         sInfoFiltered: "(filtrado de un total de _MAX_ registros)",
//         sInfoPostFix: "",
//         sSearch: "Buscar:",
//         sUrl: "",
//         sInfoThousands: ".",
//         sLoadingRecords: "Cargando...",
//         oPaginate: {
//           sFirst: "Primero",
//           sLast: "Último",
//           sNext: "Siguiente",
//           sPrevious: "Anterior",
//         },
//         oAria: {
//           sSortAscending:
//             ": Activar para ordenar la columna de manera ascendente",
//           sSortDescending:
//             ": Activar para ordenar la columna de manera descendente",
//         },
//         select: {
//           rows: {
//             _: "Has seleccionado %d filas",
//             0: "Click en una fila para seleccionar",
//             1: "Has seleccionado 1 fila",
//           },
//         },
//       },
//     })
//     .columns.adjust();

//   var parentValues = table.column(4).data().unique();
//   parentValues.sort();
//   $("#parentFilter select").append(
//     '<option value="">Seleccione una gerencia</option>'
//   );
//   parentValues.each(function (value) {
//     $("#parentFilter select").append(
//       '<option value="' + value + '">' + value + "</option>"
//     );
//     table.on("draw.dt", function () {
//       table.rows().deselect();
//     });
//   });
//   $("#parentFilter select").on("change", function () {
//     var selectedParent = $(this).val();
//     if (!selectedParent) {
//       table.search("").columns().search("").draw();
//       $("#infoFilter select").empty();
//       $("#subInfoFilter select").empty();
//       return;
//     }
//     table.column(4).search(selectedParent).draw();
//     $("#infoFilter select").empty();
//     $("#subInfoFilter select").empty();
//     var infoValues = table
//       .column(5)
//       .data()
//       .filter(function (value, index) {
//         return table.column(4).data()[index] === selectedParent;
//       })
//       .unique();
//     infoValues.sort();
//     $("#infoFilter select").append(
//       '<option value="">Selecciones un área</option>'
//     );
//     infoValues.each(function (value) {
//       $("#infoFilter select").append(
//         '<option value="' + value + '">' + value + "</option>"
//       );
//     });
//     table.on("draw.dt", function () {
//       table.rows().deselect();
//     });
//   });
//   $("#infoFilter select").on("change", function () {
//     var selectedInfo = $(this).val();
//     if (!selectedInfo) {
//       table.column(4).search($("#parentFilter select").val()).draw();
//       $("#subInfoFilter select").empty();
//       return;
//     }
//     table.column(5).search(selectedInfo).draw();
//     $("#subInfoFilter select").empty();
//     var subInfoValues = table
//       .column(7)
//       .data()
//       .filter(function (value, index) {
//         return (
//           table.column(4).data()[index] === $("#parentFilter select").val() &&
//           table.column(5).data()[index] === selectedInfo
//         );
//       })
//       .unique();
//     subInfoValues.sort();
//     subInfoValues.each(function (value) {
//       $("#subInfoFilter select").append(
//         '<option value="' + value + '">' + value + "</option>"
//       );
//     });
//     table.on("draw.dt", function () {
//       table.rows().deselect();
//     });
//   });
//   $("#subInfoFilter select").on("change", function () {
//     var selectedSubInfo = $(this).val();
//     if (!selectedSubInfo) {
//       table.column(5).search($("#infoFilter select").val()).draw();
//       return;
//     }
//     table.column(7).search(selectedSubInfo).draw();
//     table.on("draw.dt", function () {
//       table.rows().deselect();
//     });
//   });

//   function initDatatable (){

//   }

//   initDatatable();

//   var state = false;
//   $("#check-toggle-1").on("click", function () {
//     if (state) {
//       $("#baja").prop("hidden", true);
//       $("#check-toggle-2").prop("disabled", false);
//     } else {
//       $("#baja").prop("hidden", false);
//       $("#check-toggle-2").prop("disabled", true);
//     }
//     state = !state;
//   });

//   var state1 = false;
//   $("#check-toggle-2").on("click", function () {
//     if (state1) {
//       $("#check-toggle-1").prop("disabled", false);
//       $("#tabla_prot").parents(".dataTables_wrapper").first().show();
//       $("#form_todo").hide();
//       $("#baja1").prop("hidden", true);
//       $("#buscar").show();
//       $("#buscar1").show();
//       $("#equipo").show();
//       $("#equipos").show();
//     } else {
//       $("#check-toggle-1").prop("disabled", true);
//       $("#tabla_prot").parents(".dataTables_wrapper").first().hide();
//       $("#form_todo").show();
//       $("#baja1").prop("hidden", false);
//       $("#buscar").hide();
//       $("#equipo").hide();
//       $("#equipos").hide();
//       $("#buscar1").hide();
//     }
//     state1 = !state1;
//   });

//   $("#baja").on("click", function () {
//     var rows_selected = table.rows({ selected: true }).data();
//     if (rows_selected.length > 0) {
//       var datos = [];
//       $.each(rows_selected, function (index, value) {
//         datos.push({
//           id: value[0],
//           tag: value[1],
//           ger: value[4],
//           area: value[5],
//           idsec: value[6],
//           sec: value[7],
//         });
//       });
//       $("#my-dialog").show();

//       $("#my-confirm-button").on("click", function () {
//         var dateValue = $("#my-date-input").val();
//         if (!dateValue) {
//           swal("Error", "Debe ingresar una fecha para proceder", "error");
//           return;
//         }
//         $.ajax({
//           url: "/elimequi",
//           type: "POST",
//           data: {
//             datos,
//             fecha: dateValue,
//           },
//           beforeSend: function () {
//             swal({
//               title: "Trabajando",
//               text: "Espere un momento por favor...",
//               imageUrl: "/img/Spinner-1s-200px2.gif",
//               showConfirmButton: false,
//               allowOutsideClick: false,
//             });
//           },
//         }).done(function (data) {
//           swal({
//             title: "¡SAPMA!",
//             text: "Los equipos fueron dados de baja",
//             type: "success",
//             confirmButtonText: "Aceptar",
//             allowOutsideClick: false,
//           });
//           setTimeout(function () {
//             location.reload();
//           }, 1000);
//         });
//         $("#my-dialog").hide();
//       });
//       $("#my-cancel-button").on("click", function () {
//         swal("¡SAPMA!", "Equipos no eliminados", "error");
//         $("#my-dialog").hide();
//       });
//     } else {
//       swal("Error", "Debe seleccionar alguna fila para proceder", "error");
//     }
//   });

//   $("#baja1").on("click", function () {
//     var textareaValue = $("#tag_lista").val().trim();
//     var datos = textareaValue.split(",");
//     if (/^[a-zA-Z0-9-]+(,[a-zA-Z0-9-]+)*$/.test(textareaValue)) {
//       var uniqueDatos = [];
//       var hasDuplicates = false;
//       for (var i = 0; i < datos.length; i++) {
//         if (uniqueDatos.includes(datos[i])) {
//           hasDuplicates = true;
//           break;
//         } else {
//           uniqueDatos.push(datos[i]);
//         }
//       }
//       if (!hasDuplicates) {
//         $("#my-dialog").show();
//         $("#my-confirm-button").on("click", function () {
//           var dateValue = $("#my-date-input").val();
//           if (!dateValue) {
//             swal("Error", "Debe ingresar una fecha para proceder", "error");
//             return;
//           }
//           $.ajax({
//             url: "/elimlista",
//             type: "POST",
//             data: {
//               uniqueDatos,
//               fecha: dateValue,
//             },
//             beforeSend: function () {
//               swal({
//                 title: "Trabajando",
//                 text: "Espere un momento por favor...",
//                 imageUrl: "/img/Spinner-1s-200px2.gif",
//                 showConfirmButton: false,
//                 allowOutsideClick: false,
//               });
//             },
//           }).done(function (data) {
//             swal({
//               title: "¡SAPMA!",
//               text: "Los equipos fueron dados de baja",
//               type: "success",
//               confirmButtonText: "Aceptar",
//               allowOutsideClick: false,
//             });
//             setTimeout(function () {
//               location.reload();
//             }, 1000);
//           });
//           $("#my-dialog").hide();
//         });
//         $("#my-cancel-button").on("click", function () {
//           swal("¡SAPMA!", "Equipos no eliminados", "error");
//           $("#my-dialog").hide();
//         });
//       } else {
//         swal("Error", "Por favor no ingreses tags repetidos", "error");
//       }
//     } else {
//       swal(
//         "Error",
//         "Por favor ingresa al menos dos tags separados por comas, sin coma en el último tag",
//         "error"
//       );
//     }
//   });

//   $(document).on("click", ".ver_tareas", function () {
//     const id = $(this).closest("tr").find("td").eq(1).text();
//     $('#equipos_modal_titulo').text("Tareas del equipo " + id);
//     $('#equipos_modal').modal('show');
//   });
// });
var table;
var table1;

function editarEquipo(id) {
    window.open(`/editequi/${id}`, '_blank');
}

function verTarea(id) {
    window.open(`/protocolo/${id}`, '_blank');
}

$(document).ready(function () {
    table = $('#tablaEquipos').DataTable({
        'columnDefs': [
            {
                'targets': 0,
                'checkboxes': {
                    'selectRow': true
                }
            }
        ],
        'select': {
            'style': 'multi'
        },
        'columns': [
            {title  : 'Id'},
            {title  : 'Tag'},
            {title  : 'Critico'},
            {title  : 'Dinámico'},
            {title  : 'Gerencia'},
            {title  : 'Area'},
            {title  : 'Id_Sector', "visible": false},
            {title  : 'Sector'},
            {title  : 'Detalle ubicación'},
            {title  : 'Tipo de equipo'},
            {title  : 'Serie'},
            {title  : 'Certificación'},
            {title  : 'Marca'},
            {title  : 'Modelo'},
            {title  : 'Agente'},
            {title  : 'Peso'},
            {title  : 'PH'},
            {title  : 'Superintendencia'},
            {title  : 'Ubicación técnica'},
            {title  : 'Unidad'},
            {title  : '<center>Acción</center>'}
        ],
        'data': [],
        'order': [[0, 'asc']],
        "dom": 'Bfrtip',
        "searching": true,
        "lengthChange": false,
        "colReorder": true,
        "buttons": [
        {
            "extend": 'excelHtml5',
            "text": '<i class="fa fa-file-excel-o"></i>',
            "title": 'Equipos',
            "titleAttr": 'Exportar a Excel',
            "className": 'btn btn-rounded btn-success',
            "exportOptions": {
                "columns": [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
            },
            customize: function(xlsx) {
                const sheet = xlsx.xl.worksheets['Equipos.xml'];
                $('row:first c', sheet).attr('s', '47');
            }
        }],
        "bDestroy": true,    
        "scrollX": true,
        "bInfo": true,
        "iDisplayLength": 10,
        "autoWidth": false,
        "language": {
            "sProcessing": "Procesando...",
            "sLengthMenu": "Mostrar _MENU_ registros",
            "sZeroRecords": "No se encontraron resultados",
            "sEmptyTable": "Sin información...",
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

    // funcion para recargar la tabla con nuevos datos
    function reloadTable(data) {
            const rows = data.map(item => [
            item.ID,
            item.TAG,
            item.CRITICO,
            item.DINAMICO,
            item.GERENCIA,
            item.AREA,
            item.ID_SECTOR,
            item.SECTOR,
            item.UBICACION,
            item.TIPO,
            item.SERIE,
            item.CERTIFICACION,
            item.MARCA,
            item.MODELO,
            item.AGENTE,
            item.PESO,
            item.PH,
            item.SUPERINTENDENCIA,
            item.UTECNICA,
            item.UNIDAD,
            `<button class="btn btn-sm btn-warning editar" onclick="editarEquipo(${item.ID})" title="Editar"><i class="fa fa-edit"></i></button>
            <button class="btn btn-sm btn-primary hoja_vida" title="Hoja de Vida" data-id="${item.ID}"><i class="fa fa-file-o"></i></button>`
            ]);

            table
            .clear()
            .rows.add(rows)
            .columns.adjust()
            .draw();
    };

    // funcion que agrega los tags seleccionados al textarea
    function actualizarTags() {
        // obtenemos todos los datos de las filas seleccionadas
        const datos = table.rows({ selected: true }).data().toArray();
        // extraemos la columna 1 (segunda columna) de cada fila
        const tags = datos.map(fila => fila[1]);
        // volcamos en el textarea separados por coma
        $('#tagsEquipos').val(tags.join(','));
    }

    // Cuando se selecciona una fila
    table.on('select', function() {
        actualizarTags();
    });

    // Cuando se deselecciona una fila
    table.on('deselect', function() {
        actualizarTags();
    });

    // Si se abre el modal se recargar el textarea con el estado actual:
    $('#modal_baja_equipos').on('show.bs.modal', function () {
        actualizarTags();
    });

    // Limpiar campos al cerrar el modal
    $('#modal_baja_equipos').on('hidden.bs.modal', function () {
        $('#fechaBaja').val('');
        $('#obsBajas').val('');
        $('#tagsEquipos').val('');
    });

    // Busqueda de equipos
    $('#buscarEquipo').on('click', function() {
        const equipo = $('#equipo').val().trim();
        swal({
            title: "Cargando",
            text: "Espere un momento por favor...",
            imageUrl: "/img/Spinner-1s-200px2.gif",
            showConfirmButton: false,
            allowOutsideClick: false
        });
        $.ajax({
            url: '/equipos',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ equipo }),
            success: function(response) {
                swal.close();
                if (response.error) {
                    swal('Error', response.message, 'error');
                } else {
                    reloadTable(response);
                }
            },
            error: function() {
                alert('Error al buscar el equipo.');
            }
        });
    });

    // Baja de equipos
    $('#bajaEquipo').on('click', function () {
        $('#modal_baja_equipos').modal('show');
    });

    $('#confirmarBaja').on('click', function () {
        let rawTags = $('#tagsEquipos').val();

        if (/[.;:]/.test(rawTags)) {
            swal('Error', 'Solo se permiten comas como separadores de tags.', 'error');
            return;
        }

        let tagsArray = rawTags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        if (tagsArray.length === 0) {
            swal('Error', 'Debe ingresar al menos un tag.', 'error');
            return;
        }

        let cleanTags = tagsArray.join(',');
        $('#tagsEquipos').val(cleanTags);
        const fecha = $('#fechaBaja').val().trim();
        
        if (!cleanTags || !fecha ) {
            swal('Error', 'Todos los campos son obligatorios.', 'error');
            return;
        }

        swal({
            title: "¿Estás seguro?",
            text: "¿Deseas dar de baja estos equipos este equipo?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false,
        }, function(isConfirm){
            if(isConfirm) {
                $.ajax({
                url: '/validarTagsEquipos', 
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ tags: tagsArray }),
                beforeSend: function () {
                    swal({
                    title: "Enviando",
                    text: "Espere un momento por favor...",
                    imageUrl: "/img/Spinner-1s-200px2.gif",
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    });
                },
                success: function (response) {
                    if (response.invalid && response.invalid.length > 0) {
                        swal(
                            'Tags inválidos',
                            'Revisa estos tags, no existen en la base de datos:\n' + response.invalid.join(', '),
                            'error'
                        );
                        return;
                    }else{
                        $.ajax({
                            url: '/confirmarBajas',
                            type: 'POST',
                            data: {
                            tags: cleanTags,
                            fecha: fecha
                        },
                        success: function(res) {
                            swal('Éxito', 'La baja se ha procesado correctamente.', 'success');
                            $('#modal_baja_equipos').modal('hide');
                            setTimeout(function () {
                                location.reload();
                            }, 300);
                        },
                        error: function() {
                            swal('Error', 'Ocurrió un problema al procesar la baja.', 'error');
                        }
                    });

                    }
                },
                error: function() {
                    swal('Error', 'No se pudo validar los tags en el servidor.', 'error');
                }
            });
            }
        });
    });

    // nuevo Equipo
    $('#nuevoEquipo').on('click', function () {
         console.log('click');  
        $('#modal_nuevo_equipo').modal('show');
    });

    // Hoja de vida del equipo
    table1 = $('#tabla_detalle_equipos').DataTable({
        "createdRow": function (row, data, dataIndex) {
            // Estado (columna 2)
            const estado = data[2];

            // Si NO está en los estados permitidos, marcamos la fila y quitamos checkbox
            if (estado !== "Terminada sin validar" && estado !== "Terminada validada") {
                $(row).addClass('no-select');               // marca la fila
            }
            if (data[4] === "SOP") {
                $('td:eq(4)', row).text("Sistema Operativo");
            } else if (data[4] === "SC") {
                $('td:eq(4)', row).text("No Aplica");
            } else if (data[4] === "SSR") {
                $('td:eq(4)', row).text("Sistema sin revisar");
            } else if (data[4] === "SOCO"){
                $('td:eq(4)', row).text("Sist. operativo con obs.");
            } else if (data[4] === "SFS"){
              $('td:eq(4)', row).text("Sist. fuera de serv.");
            } else if (data[4] === "SNO"){
              $('td:eq(4)', row).text("Sist. no operativo");
            }
        },
        'columnDefs': [
            {
                'targets': 0,
                'checkboxes': {
                    'selectRow': true
                }
            }
        ],
        'select': {
            'style': 'multi'
        },
        'columns': [
            {title  : 'Tarea'},
            {title  : 'Fecha'},
            {title  : 'Estado'},
            {title  : 'Tecnico'},
            {title  : 'Estado operacional'},
            {title  : 'Observacón'},
            {title  : '<center>Acción</center>'}
        ],
        'data': [],
        'order': [[1, 'desc']],
        "searching": true,
        "lengthChange": false,
        "colReorder": true,
        "dom": 'Bfrtip',
        "buttons": [
            {
                extend: 'excelHtml5',
                text: '<i class="fa fa-file-excel-o"></i>',
                title: 'Hoja de vida del equipo',
                titleAttr: 'Exportar a Excel',
                className: 'btn btn-success btn-rounded me-2',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5]
                },
                customize: function (xlsx) {
                    const sheet = xlsx.xl.worksheets['Hoja de vida del equipo.xml'];
                    $('row:first c', sheet).attr('s', '47');
                }
            }
        ],
        initComplete: function () {

            // "this" dentro de initComplete es la instancia DataTable
            let api = this.api();

            // Obtiene el contenedor de botones SOLO de esta tabla
            let contenedorBotones = $(api.buttons().container());

            // Inserta el botón PDF en este contenedor
            contenedorBotones.append(`
                <button id="pdfHoja" type="button" class="btn btn-warning btn-rounded ms-2">
                    <i class="fa fa-file-pdf-o"></i>
                </button>
            `);
        },
        "bDestroy": true,    
        "scrollX": true,
        "bInfo": true,
        "iDisplayLength": 6,
        "autoWidth": false,
        "language": {
            "sProcessing": "Procesando...",
            "sLengthMenu": "Mostrar _MENU_ registros",
            "sZeroRecords": "No se encontraron resultados",
            "sEmptyTable": "Sin información...",
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

    // 1) Evitar que clicks en filas "no-select" provoquen selección (fila o checkbox)
    $('#tabla_detalle_equipos tbody').off('click.noSelect').on('click.noSelect', 'tr', function (e) {
        if ($(this).hasClass('no-select')) {
            // Si el click fue sobre un checkbox o la fila, prevenimos la acción
            e.stopImmediatePropagation();
            return false;
        }
    });

    // Además bloqueamos clicks directos sobre inputs/checkboxes que estén dentro de filas no-select
    $('#tabla_detalle_equipos tbody').off('click.noSelectInput').on('click.noSelectInput', 'tr.no-select input[type="checkbox"]', function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
    });

    // 2) Filtro extra: si por algún motivo se selecciona una fila inválida, la deseleccionamos
    table1.on('select', function (e, dt, type, indexes) {
        if (type !== 'row') return;
        // indexes puede ser un entero o un array
        let idxs = Array.isArray(indexes) ? indexes : [indexes];
        idxs.forEach(function (idx) {
            const rowData = table1.row(idx).data();
            // rowData es el array que pasas en reloadTable1; el estado está en la posición 2
            const estado = rowData ? rowData[2] : null;
            if (estado !== "Terminada sin validar" && estado !== "Terminada validada") {
                // deselecciona inmediatamente
                table1.row(idx).deselect();
            }
        });
    });

    function reloadTable1(data) {
        const rows = data.map(item => [
        item.TAREA,
        item.FECHA,
        item.ESTADO_TAREA,
        item.TECNICO,
        item.ESTADO_EQUIPO,
        item.OBS_ESTADO,
        `<center><button class="btn btn-sm btn-primary" onClick="verTarea(${item.TAREA})" title="Hoja de Vida"><i class="fa fa-file-o"></i></button></center>`
        ]);

        table1
        .clear()
        .rows.add(rows)
        .columns.adjust()
        .draw();
    };

    $('#equipos_modal').on('shown.bs.modal', function () {
        table1.columns.adjust().draw();
    });

    $(document).on('click', '.hoja_vida', function () {
        const id = $(this).data('id');
        const tag = $(this).closest('tr').find('td').eq(1).text();
        $.ajax({
            url: '/hojaVidaEquipo',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id }),
            success: function(response) {
                if (response.error) {
                    swal('Error', response.message, 'error');
                } else {
                    reloadTable1(response);
                    $('#equipo_modal_titulo').text(`Equipo: ${tag}`);
                    $('#equipos_modal').modal('show');
                }

            },
            error: function() {
                swal('Error', 'Error al buscar la hoja de vida del equipo.', 'error');
            }

        });

    });

    $(document).on('click', '#pdfHoja', function () {
        const IDT = [];
        const rows_selected = table1.rows({ selected: true }).data();
        if (rows_selected.length > 0) {
            $.each(rows_selected, function (index, value) {
                IDT.push(value[0]);
            });
            $.ajax({
                url: "/pdfs",
                type: "POST",
                data: {
                    IDT
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
        } else {
            swal('Error', 'Debe seleccionar alguna fila para proceder', 'error');
        }
    });

});