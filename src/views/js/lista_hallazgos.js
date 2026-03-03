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
                  "select": {
            "style": "multi"
          },
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
                "columns": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
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
  
        }).columns.adjust();

        $('#parentSelect').append('<option value="" selected disabled>Seleccione una gerencia</option>');
        $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
        $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
        
        table1.column(4).data().unique().sort().each(function(value, index) {
          $('#parentSelect').append(
          '<option value="' + value + '">' + value + '</option>');
        });
  
        $('#parentSelect').on('change', function(e) {
          var selectedValue = $(this).val();
          table1.column(4).search(selectedValue).draw();
  
          $('#infoSelect').empty();
          $('#infoSelect').append('<option value="" selected disabled>Seleccione un área</option>');
          table1.column(5, {search: 'applied'}).data().unique().sort().each(function(value, index) {
              $('#infoSelect').append('<option value="' + value + '">' + value + '</option>');
          });
        });
  
        $('#infoSelect').on('change', function(e) {
          var selectedParentValue = $('#parentSelect').val();
          var selectedInfoValue = $(this).val(); 
      
          table1.column(4).search(selectedParentValue).column(5).search(selectedInfoValue).draw();
      
          $('#subInfoSelect').empty(); 
          $('#subInfoSelect').append('<option value="" selected disabled>Seleccione un sector</option>');
          table1.column(6, {search: 'applied'}).data().unique().sort().each(function(value, index) {
              $('#subInfoSelect').append('<option value="' + value + '">' + value + '</option>');
          });
        });
  
        $('#subInfoSelect').on('change', function(e) {
          var selectedParentValue = $('#parentSelect').val();
          var selectedInfoValue = $('#infoSelect').val(); 
          var selectedSubInfoValue = $(this).val();
  
          table1.column(4).search(selectedParentValue);
          table1.column(5).search(selectedInfoValue);
          table1.column(6).search("^" + selectedSubInfoValue + "$", true, false);
  
          table1.draw();
        });
  
        $('#clearFilters').on('click', function() {
          $('#parentSelect').empty();
          $('#parentSelect').append('<option value="" selected disabled>Seleccione una gerencia</option>');
          table1.column(4).data().unique().sort().each(function(value, index) {
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
            url: '/ver_lista_hallazgos',
            type: 'POST',
            data: data
        }).done(function(data) {
            swal.close();
  
            if ($.fn.DataTable.isDataTable('#tabla_prot1')) {
                table1.clear().destroy();
            }
  
            $('#tabla_prot1 tbody').empty();
            const perfil = $('#perfil').val();
            console.log(data);
  
            data.forEach(function(item) {

                let fila = `
                    <tr>
                        <td>${item.IdTarea}</td>
                        <td>${item.FechaTarea}</td>
                        <td>${item.EquipoCodigoTAG}</td>
                        <td>${item.EquipoTagDMH === null ? '' : item.EquipoTagDMH}</td>
                        <td>${item.GerenciaDesc}</td>
                        <td>${item.AreaDesc}</td>
                        <td>${item.SectorDesc}</td>
                        <td>${item.Hallazgo || ''}</td>
                        <td>${item.Plan_Accion|| ''}</td>
                        <td>${item.Vulnerabilidad || ''}</td>
                        <td>${item.Responsable|| ''}</td>
                        <td>${item.Fecha_Compromiso|| ''}</td>
                        <td>
                            <center><button class="btn btn-inline btn-success btn-sm ladda-button ver_hallazgo" title="Editar hallazgo"><i class="font-icon font-icon-pencil"></i></button>
                            <button class="btn btn-inline btn-primary btn-sm ladda-button infoTarea" title="Ver"><i class="font-icon font-icon-eye"></i></button></center>
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

    $(document).on('click', '.infoTarea', function (event) {
        event.preventDefault();
        const idTarea = $(this).closest('tr').find('td:eq(0)').text();
        window.open('/protocolo/' + idTarea, '_blank');
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
            closeOnConfirm: false
        }, function(isConfirm){
                if (isConfirm) {
                    $.ajax({
                        url: '/actualizar_hallazgo',
                        type: 'POST',
                        data: { idTarea, hallazgo, plan, responsable, vulnerabilidad, fecha },
                        success: function(response) {
                            swal("SAPMA", "Hallazgo actualizado correctamente.", "success");
                            $('#hallazgos_modal').modal('hide');
                            $('#tarea').val(idTarea);
                            $('#buscar').click(); // Recargar la tabla
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

        $.ajax({
            url: '/ver_hallazgo',
            data: { idTarea: idTarea },
            type: 'GET',
            success: function(response) {
                $('#f_id').val(idTarea);
                $('#f_hallazgo').val(response.Hallazgo);
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
            closeOnConfirm: false
        }, function(isConfirm){
                if (isConfirm) {
                    $.ajax({
                        url: '/eliminar_hallazgo',
                        type: 'POST',
                        data: { idTarea },
                        success: function(response) {
                            swal("SAPMA", "Hallazgo eliminado correctamente.", "success");
                            $('#f_hallazgo').val('');
                            $('#f_plan').val('');
                            $('#f_responsable').val('');
                            $('#f_vulnerabilidad').val('');
                            $('#f_fecha').val('');
                            $('#hallazgos_modal').modal('hide');
                            $('#tarea').val(idTarea);
                            $('#buscar').click(); // Recargar la tabla
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