var table1;
$(document).ready(function () {

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

    function initDataTable() {
        var checkTogglePressed = false;
  
        if ($.fn.DataTable.isDataTable('#miTabla')) {
            table1.destroy();
        }
      
        table1 = $('#tabla_prot1').DataTable({
          "dom": 'Bf<"toolbar">rtip',
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
                "columns": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,13],
              },
              customize: function (xlsx) {
                const sheet = xlsx.xl.worksheets["sheet1.xml"];
                $("row:first c", sheet).attr("s", "47");
              },
            },
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
  
    }

    // Función para actualizar el contador
    function actualizarContador(textareaId, contadorId) {
        const textarea = document.getElementById(textareaId);
        const contador = document.getElementById(contadorId);
        const longitud = textarea.value.length;
        contador.textContent = 300 - longitud;
    }

    // Listeners para actualizar en tiempo real
    document.getElementById('f_hallazgo').addEventListener('input', function() {
        actualizarContador('f_hallazgo', 'hallazgo_contador');
    });

    document.getElementById('f_plan').addEventListener('input', function() {
        actualizarContador('f_plan', 'plan_contador');
    });

    // Inicializar contadores
    actualizarContador('f_hallazgo', 'hallazgo_contador');
    actualizarContador('f_plan', 'plan_contador');
  
    initDataTable(); 

    $('#buscar').on('click', function() {
        var date3 = $('#date3').val();
        var date4 = $('#date4').val();
        var tarea = $('#tarea').val();
  
        if (!date3 && !date4 && !tarea) {
            swal("Error", "Seleccione año y mes o ingrese una tarea.", "error");
            resetInputs();
            return;
        }
  
        if (date3 > 0 && !date4 && tarea > 0) {
            swal("Error", "Seleccione año y mes o ingrese una tarea.", "error");
            resetInputs();
            return;
        }
  
        if (date3 > 0 && date4 > 0 && tarea > 0) {
            swal("Error", "Seleccione año y mes o ingrese una tarea.", "error");
            resetInputs();
            return;
        }
  
        var data = { date3, date4, tarea };
  
        swal({
            title: "Cargando",
            text: "Espere un momento por favor...",
            imageUrl: "/img/Spinner-1s-200px2.gif",
            showConfirmButton: false,
            allowOutsideClick: false
        });
  
        $.ajax({
            url: '/ver_tareas_hallazgos',
            type: 'POST',
            data: data
        }).done(function(data) {
            swal.close();
  
            if ($.fn.DataTable.isDataTable('#tabla_prot1')) {
                table1.clear().destroy();
            }
  
            $('#tabla_prot1 tbody').empty();
            const perfil = $('#perfil').val();
  
            data.forEach(function(item) {

                let fila = `
                    <tr>
                        <td>${item.IdTarea}</td>
                        <td>${item.FechaTarea}</td>
                        <td>${item.EquipoCodigoTAG}</td>
                        <td>${item.EquipoTagDMH === null ? '' : item.EquipoTagDMH}</td>
                        <td>${item.UsuarioDescripcion}</td>
                        <td>${item.GerenciaDesc}</td>
                        <td>${item.AreaDesc}</td>
                        <td>${item.SectorDesc}</td>
                        <td>${item.TipoServicio}</td>
                        <td>${item.EstadoDesc}</td>
                        <td>
                            ${item.EstadoOperEquipo === null && (item.EstadoDesc === 'Terminada validada' || item.EstadoDesc === 'Terminada sin validar') ? '***Error***' :
                            item.EstadoOperEquipo === 'SOP' ? 'Sistema operativo' :
                            item.EstadoOperEquipo === 'SC' ? 'No aplica' :
                            item.EstadoOperEquipo === 'SSR' ? 'Sistema sin revisar' :
                            item.EstadoOperEquipo === 'SOCO' ? 'Sist. operativo con obs.' :
                            item.EstadoOperEquipo === 'SFS' ? 'Sist. fuera de serv.' :
                            item.EstadoOperEquipo === 'SNO' ? 'Sist. no operativo' :
                            item.EstadoOperEquipo || ''}
                        </td>
                        <td>${item.EstadoOperEquipoObs  || ''}</td>
                        <td>${item.ValidacionResponsable || ''}</td>
                        <td>${item.ValidacionObservacion || ''}</td>
                        <td>
                            ${item.Hallazgo === null ? 
                                '<button class="btn btn-inline btn-warning btn-sm ladda-button ingresar_hallazgo" title="Ingresar hallazgo"><i class="font-icon  font-icon-pencil"></i></button>'
                                : 
                                '<button class="btn btn-inline btn-success btn-sm ladda-button ver_hallazgo" title="Editar hallazgo"><i class="font-icon font-icon-pencil"></i></button>'
                            }
                            ${(item.EstadoDesc === 'Terminada validada' || item.EstadoDesc === 'Terminada sin validar') && item.EstadoOperEquipo ? 
                            `<button class="btn btn-inline btn-primary btn-sm ladda-button infoTarea" title="Ver"><i class="font-icon font-icon-eye"></i></button>` : ''}
                        </td>
                    </tr>
                `;
                $('#tabla_prot1 tbody').append(fila);
            });
  
            initDataTable();
            $('#seleccionar').prop('disabled', false);
            $('#date3').val('');
            $('#date4').val('');
            $('#tarea').val('');
        });
  
    });

    $('#hallazgos_modal').on('hidden.bs.modal', function (e) {
        $(this).find('input[type="text"], input[type="date"], textarea').val('');
        $(this).find('select').prop('selectedIndex', 0); 
        actualizarContador('f_hallazgo', 'hallazgo_contador');
        actualizarContador('f_plan', 'plan_contador');
    });

    $(document).on('click', '.infoTarea', function (event) {
        event.preventDefault();
        const idTarea = $(this).closest('tr').find('td:eq(0)').text();
        window.open('/protocolo/' + idTarea, '_blank');
    });
    
    $(document).on('click', '.ingresar_hallazgo', function (event) {
        event.preventDefault();
        const idTarea = $(this).closest('tr').find('td:eq(0)').text();
        const obsTecnico = $(this).closest('tr').find('td:eq(11)').text();
        $('#titulo_hallazgo').text('Ingresar hallazgo de la Tarea: ' + idTarea);
        $('#f_id').val(idTarea);
        $('#f_obsTecnico').val(obsTecnico); 
        $('#f_hallazgo').val(obsTecnico);
        actualizarContador('f_hallazgo', 'hallazgo_contador');
        $('#guardar_hallazgo').prop('hidden', false);
        $('#actualizar_hallazgo').prop('hidden', true);
        $('#eliminar_hallazgo').prop('hidden', true);
        $('#hallazgos_modal').modal('show');
    });

    $(document).on('click', '#guardar_hallazgo', function (event) {
        event.preventDefault();
        const idTarea = $('#f_id').val();
        const hallazgo = $('#f_hallazgo').val();
        const plan = $('#f_plan').val();
        const responsable = $('#f_responsable').val();
        const vulnerabilidad = $('#f_vulnerabilidad').val();
        const fecha = $('#f_fecha').val();

        if (!hallazgo || !plan || !vulnerabilidad) {
            swal("Error", "Ingrese el hallazgo, la vulnerabilidad y el plande acción para continuar", "error");
            return;
        }

        swal({
            title: "SAPMA",
            text: "¿Está seguro de guardar el hallazgo en la tarea "+idTarea+"?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false,
        }, function(isConfirm){
                if (isConfirm) {
                    $.ajax({
                        url: '/guardar_hallazgo',
                        type: 'POST',
                        data: { idTarea, hallazgo, plan, responsable, vulnerabilidad, fecha },
                        success: function(response) {
                            swal("Éxito", "Hallazgo guardado correctamente.", "success");
                            $('#hallazgos_modal').modal('hide');
                            
                            // Actualizar solo la fila correspondiente
                            const row = $(`#tabla_prot1 tr:has(td:contains('${idTarea}'))`);
                            const estadoDesc = row.find('td:eq(9)').text(); // Obtener estado desde la fila
                            
                            // Actualizar columna de hallazgo y botones
                            row.find('td:eq(14)').html(`
                                <button class="btn btn-inline btn-success btn-sm ladda-button ver_hallazgo" title="Editar hallazgo">
                                    <i class="font-icon font-icon-pencil"></i>
                                </button>
                                ${(estadoDesc === 'Terminada validada' || estadoDesc === 'Terminada sin validar') ? 
                                `<button class="btn btn-inline btn-primary btn-sm ladda-button infoTarea" title="Ver">
                                    <i class="font-icon font-icon-eye"></i>
                                </button>` : ''}
                            `);
                        },
                        error: function(error) {
                            console.log(error);
                            swal("Error", "No se pudo guardar el hallazgo.", "error");
                        }
                    });
                } else {
                    return false;
                }
            }
        );    
    });

    $(document).on('click', '#actualizar_hallazgo', function (event) {
        event.preventDefault();
        const idTarea = $('#f_id').val();
        const hallazgo = $('#f_hallazgo').val();
        const plan = $('#f_plan').val();
        const responsable = $('#f_responsable').val();
        const vulnerabilidad = $('#f_vulnerabilidad').val();
        const fecha = $('#f_fecha').val();

        if (!hallazgo || !plan || !vulnerabilidad ) {
            swal("Error", "Ingrese el hallazgo, la vulnerabilidad y el plan de accion para continuar", "error");
            return;
        }

        swal({
            title: "SAPMA",
            text: "¿Está seguro de actualizar el hallazgo en la tarea "+idTarea+"?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false,
        }, function(isConfirm){
                if (isConfirm) {
                    $.ajax({
                        url: '/actualizar_hallazgo',
                        type: 'POST',
                        data: { idTarea, hallazgo, plan, responsable, vulnerabilidad, fecha },
                        success: function(response) {
                            swal("SAPMA", "Hallazgo actualizado correctamente.", "success");
                            $('#hallazgos_modal').modal('hide');
                        },
                        error: function(error) {
                            console.log(error);
                            swal("Error", "No se pudo guardar el hallazgo.", "error");
                        }
                    });
                } else {
                    return false;
                }
            }
        );    
    });

    $(document).on('click', '.ver_hallazgo', function (event) {
        event.preventDefault();
        const idTarea = $(this).closest('tr').find('td:eq(0)').text();
        $('#titulo_hallazgo').text('Editar hallazgo de la Tarea: ' + idTarea);
        $('#guardar_hallazgo').prop('hidden', true);
        $('#actualizar_hallazgo').prop('hidden', false);
        $('#eliminar_hallazgo').prop('hidden', false);
        const obsTecnico = $(this).closest('tr').find('td:eq(11)').text();

        $.ajax({
            url: '/ver_hallazgo',
            data: { idTarea: idTarea },
            type: 'GET',
            success: function(response) {
                $('#f_id').val(idTarea);
                $('#f_obsTecnico').val(obsTecnico); 
                $('#f_hallazgo').val(response.Hallazgo);
                actualizarContador('f_hallazgo', 'hallazgo_contador');
                $('#f_plan').val(response.Plan_Accion);
                $('#f_responsable').val(response.Responsable);
                $('#f_vulnerabilidad').val(response.Vulnerabilidad);
                if(response.Fecha_Compromiso){
                    var partes = response.Fecha_Compromiso.split('/');
                    var fechaFormateada = partes[2] + '-' + partes[1] + '-' + partes[0];
                    $('#f_fecha').val(fechaFormateada);
                }
                
                $('#hallazgos_modal').modal('show');
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    $(document).on('click', '#eliminar_hallazgo', function (event) {
        event.preventDefault();
        const idTarea = $('#f_id').val();

        swal({
            title: "SAPMA",
            text: "¿Está seguro de eliminar el hallazgo en la tarea "+idTarea+"?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false,
        }, function(isConfirm){
                if (isConfirm) {
                    $.ajax({
                        url: '/eliminar_hallazgo',
                        type: 'POST',
                        data: { idTarea },
                        success: function(response) {
                            swal("SAPMA", "Hallazgo eliminado correctamente.", "success");
                            $('#hallazgos_modal').modal('hide');
                            // Actualizar solo la fila correspondiente
                            const row = $(`#tabla_prot1 tr:has(td:contains('${idTarea}'))`);
                            const estadoDesc = row.find('td:eq(9)').text(); // Obtener estado desde la fila
                            
                            // Actualizar columna de hallazgo y botones
                            row.find('td:eq(14)').html(`
                                <button  class="btn btn-inline btn-warning btn-sm ladda-button ingresar_hallazgo" title="Ingresar hallazgo">
                                    <i class="font-icon font-icon-pencil"></i>
                                </button>
                                ${(estadoDesc === 'Terminada validada' || estadoDesc === 'Terminada sin validar') ? 
                                `<button class="btn btn-inline btn-primary btn-sm ladda-button infoTarea" title="Ver">
                                    <i class="font-icon font-icon-eye"></i>
                                </button>` : ''}
                            `);

                        },
                        error: function(error) {
                            console.log(error);
                            swal("Error", "No se pudo guardar el hallazgo.", "error");
                        }
                    });
                } else {
                    return false;
                }
            }
        );    
    });
    
});    