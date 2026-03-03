
var table1;
$(document).ready(function () {

    var date1 = document.querySelector('#date1');
    var date2 = document.querySelector('#date2');
    date1.addEventListener('change', function() {
        date2.min = this.value;
    });	

    $('#test').change(function() {
        if ($(this).prop('checked')) {
            $(this).val('');
        }else{
            $(this).val('on');
        }
    });

    let intervalo2; 

    function iniciarTemporizador2(segundos) {
        let tiempo2 = segundos;
        clearInterval(intervalo2);
        intervalo2 = setInterval(function() {
            var minutos2 = Math.floor(tiempo2 / 60);
            var segundosRestantes2 = tiempo2 % 60;
            document.getElementById('time2').textContent = 
                (minutos2 < 10 ? "0" : "") + minutos2 + ":" + 
                (segundosRestantes2 < 10 ? "0" : "") + segundosRestantes2;

            if (tiempo2 <= 0) {
                clearInterval(intervalo2);
                swal("Error", "El tiempo se ha agotado.", "error");
                $('#codigoModal2').modal('hide');
                setTimeout (function () {
                    location.reload();
                });
            }

            tiempo2--;
        }, 1000);
    }

    let intervalo3; 

    function iniciarTemporizador3(segundos) {
        let tiempo3 = segundos;
        clearInterval(intervalo3);
        intervalo3 = setInterval(function() {
            var minutos3 = Math.floor(tiempo3 / 60);
            var segundosRestantes3 = tiempo3 % 60;
            document.getElementById('time3').textContent = 
                (minutos3 < 10 ? "0" : "") + minutos3 + ":" + 
                (segundosRestantes3 < 10 ? "0" : "") + segundosRestantes3;

            if (tiempo3 <= 0) {
                clearInterval(intervalo3);
                swal("Error", "El tiempo se ha agotado.", "error");
                $('#codigoModal3').modal('hide');
                setTimeout (function () {
                    location.reload();
                });
            }

            tiempo3--;
        }, 1000);
    }

    $('#codigoModal2').on('hidden.bs.modal', function () {

        $('#codigoInput2').val('');

    });

    $('#codigoModal3').on('hidden.bs.modal', function () {

        $('#codigoInput3').val('');

    });
      
    function initDataTable() {
        var checkTogglePressed = false;
      
        table1 = $('#tabla_prot').DataTable({
          createdRow: function(row, data, dataIndex) {
            if (data[14] === '1') { 
              $(row).css({
                  'background-color': 'red',
                  'color': 'white'
              });
            }
          },
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
              "title": "TareasParaValidar",
              "titleAttr": "Exportar a Excel",
              "className": "btn btn-rounded btn-success",
              "exportOptions": {
                "columns": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9 , 10,11],
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
                      <button id="deseleccionar" type="button" class="btn btn-inline btn-warning ladda-button" hidden="true">Anular selección</i></button>
                      <button id="seleccionar" type="button" class="btn btn-inline btn-warning ladda-button" disabled="true">Seleccionar</i></button>
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
  
        table1.on('user-select', function (e, dt, type, cell, originalEvent) {
            var rowIndex = cell.index().row;
            var rowData = table1.row(rowIndex).data();
            
            if (rowData[12] === "") {
                e.preventDefault();
            }
        });

        var filasSeleccionadasPorSeleccionar = []; 

        $('#seleccionar').on('click', function () {
            var filasSeleccionadasPorSeleccionar = table1.rows(function (idx, data, node) {
                return data[12] !== "";
            }).indexes(); 
            
            var filasFiltradasSeleccionadas = table1.rows({ search: 'applied' }).indexes().filter(function(index) {
                return filasSeleccionadasPorSeleccionar.indexOf(index) !== -1;
            });
            
            table1.rows(filasFiltradasSeleccionadas).select();
        
            $('#seleccionar').prop('hidden', true);
            $('#deseleccionar').prop('hidden', false);
        });
      
        
        $('#deseleccionar').on('click', function () {
          var filasSeleccionadasPorSeleccionar = table1.rows(function (idx, data, node) {
              return data[12] !== "";
          }).indexes(); 
          
          var filasFiltradasSeleccionadas = table1.rows({ search: 'applied' }).indexes().filter(function(index) {
              return filasSeleccionadasPorSeleccionar.indexOf(index) !== -1;
          });
          
          table1.rows(filasFiltradasSeleccionadas).deselect();

          $('#seleccionar').prop('hidden', false);
          $('#deseleccionar').prop('hidden', true);
      }); 
  
    }
  
    initDataTable();  

    $('a').on('click', function(e) {
        const taskId = $(this).data('task-id');  
        if (taskId) {
            localStorage.setItem('lastUpdatedTaskId', taskId);  
        }
    });  

    $('#filt').on('click', function() {
        var date1 = $('#date1').val();
        var date2 = $('#date2').val();
        var tarea = $('#tarea').val();
        var test = $('#test').val();
    
        if ((tarea && (date1 || date2)) || (date1 && date2 && tarea)) {
            swal("Error", "No puede enviar dates y tarea.", "error");
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
    
        var data = { date1, date2, tarea, test };
        
        swal({
            title: "Cargando",
            text: "Espere un momento por favor...",
            imageUrl: "/img/Spinner-1s-200px2.gif",
            showConfirmButton: false,
            allowOutsideClick: false
        });
        
        $.ajax({
            url: '/protocoloss',
            type: 'POST',
            data: data
        }).done(function(data) {
            swal.close();
    
            if ($.fn.DataTable.isDataTable('#tabla_prot')) {
                table1.clear().destroy();
            }
    
            $('#tabla_prot tbody').empty();
    
            data.forEach(function(item) {
                // let warningIcon = item.Obs_lider === 1 ? '<span style="color: orange;">⚠️</span>' : '';
                $('#tabla_prot tbody').append(`
                    <tr>
                        <td>
                            <center>
                                <a href="#" class="historial">${item.IdTarea}</a>
                            </center>
                        </td>
                        <td>${item.FechaTarea}</td>
                        <td>${item.EquipoCodigoTAG}</td>
                        <td>${item.Tag_DMH === null ? '' : item.Tag_DMH}</td>
                        <td>${item.UsuarioDescripcion}</td>
                        <td>${item.GerenciaDesc}</td>
                        <td>${item.AreaDesc}</td>
                        <td>${item.SectorDesc}</td>
                        <td>${item.TipoServicio}</td>
                        <td>${item.EstadoDesc}</td>
                        <td>
                            ${item.EstadoOperEquipo === null && (item.EstadoDesc === 'Terminada validada' || item.EstadoDesc === 'Terminada sin validar') ?
                                '***Error***' :
                                item.EstadoOperEquipo === 'SOP' ? 'Sistema operativo' :
                                item.EstadoOperEquipo === 'SC' ? 'No aplica' :
                                item.EstadoOperEquipo === 'SSR' ? 'Sistema sin revisar' :
                                item.EstadoOperEquipo === 'SOCO' ? 'Sist. operativo con obs.' :
                                item.EstadoOperEquipo === 'SFS' ? 'Sist. fuera de serv.' :
                                item.EstadoOperEquipo === 'SNO' ? 'Sist. no operativo' :
                                item.EstadoOperEquipo === null ? '' :
                                item.EstadoOperEquipo}
                        </td>
                        <td>${item.EstadoOperEquipoObs === null || item.EstadoOperEquipoObs === undefined ? '' : (item.EstadoOperEquipoObs === 'SC' ? '' : item.EstadoOperEquipoObs)}</td>
                        <td><input type="text" maxlength="350" placeholder="Ingrese observación" class="form-control"></td>
                        <td>
                            ${item.EstadoDesc === 'Terminada validada' || item.EstadoDesc === 'Terminada sin validar' ? 
                                (item.EstadoOperEquipo === null ? '' : `<center><a href="/protocolo/${item.IdTarea}" class="btn btn-inline btn-primary btn-sm ladda-button" target="_blank"><i class="fa fa-file-archive-o"></i></a></center>`) : ''}
                        </td>
                        <td hidden="true">${item.Obs_lider}</td>
                    </tr>
                `);
            });
            
            initDataTable();
            
            $('#seleccionar').prop('disabled', false);
        });
    
        $('#date1').val('');
        $('#date2').val('');
        $('#tarea').val('');
    });

    $(document).on('click', '.historial', function (event) {
        event.preventDefault();
        var idTarea = $(this).text();
        $('#histo_id').val(idTarea);
        $('#historia .btn[data-task-id]').attr('data-task-id', idTarea);
    
        $.ajax({
            url: '/historial',
            type: 'POST',
            data: { idTarea: idTarea },
            success: function (data) {
                $('#historia_titulo').text('Historial de la tarea: ' + idTarea);
    
                const timelineContainer = $('#historia .timeline');
                timelineContainer.empty();
    
                if (data.length === 0) {
                    timelineContainer.append('<div class="timeline-item"><p>Sin Información</p></div>');
                } else {
                    const sortedData = data.sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA));
                    const groupedByDate = sortedData.reduce((acc, item) => {
                        const fecha = new Date(item.FECHA).toLocaleDateString('es-CL', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        });
                        if (!acc[fecha]) acc[fecha] = [];
                        acc[fecha].push(item);
                        return acc;
                    }, {});
    
                    for (const [fecha, eventos] of Object.entries(groupedByDate)) {
                        timelineContainer.append(`<div class="timeline-date-group"><h4>${fecha}</h4></div>`);
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
  
    $(document).on('click', '#historia .btn[data-task-id]', function (e) {
        const taskId = $(this).attr('data-task-id');
        if (taskId) {
            localStorage.setItem('lastUpdatedTaskId', taskId);
        }
    });
  
    $("#env_val").on("click", function () {
        
      var rows_selected = table1.rows({selected: true}).data();
      var idt = [];

      $.each(rows_selected, function (index, value) {
        idt.push(value[0]);
      });

      if(rows_selected.length === 0){
        swal("Error", "Debe seleccionar al menos una fila antes de enviar las tareas para aprobar.", "error");
        return;
      }
        
      swal({
        title: "¡SAPMA!",
        text: "¿Desea validar estas tareas?",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-primary",
        confirmButtonText: "Si",
        cancelButtonText: "No",
        closeOnConfirm: true      
        },function(isConfirm) {
          if(isConfirm){
            $('#codigoModal3').modal('show');
            iniciarTemporizador3(300); 
            $.ajax({
                url: "/generar_codigo",
                type: "POST"
            });
          }
        }  
      );
    });

    $('#enviarCodigo3').on('click', function() {

      var rows_selected = table1.rows({ selected: true }).nodes();
      var idt = [];
      
      $.each(rows_selected, function (index, row) {
          var columna0 = $(row).find('td').eq(0).text().trim();
          idt.push(columna0); // Solo se empuja el valor, no un objeto
      });
      
      var codigo = $('#codigoInput3').val();

      $.ajax({
          url: "/verificar_codigo",
          type: "POST",
          data: {
              codigo
          },
          success: function(response) {
              if (response.success) {

                $.ajax({
                  url: "/protocolo/validar",
                  type: "POST",
                  data: {idt},
                  beforeSend: function(){
                    swal({
                        title: "Validando",
                        text: "Espere un momento por favor...",
                        imageUrl:"/img/Spinner-1s-200px2.gif",
                        showConfirmButton: false,
                        allowOutsideClick: false
                    });
                  }
                }).done(function(data) {
                  swal({
                    title: "¡SAPMA!",
                    text: "¡Tareas validadas!",
                    type: "success",
                    confirmButtonText: "Aceptar",
                    allowOutsideClick: false
                  });	
                  setTimeout(function () {
                    location.reload();
                  }, 1000);	
                }).fail(function (jqXHR, textStatus, errorThrown){
                  swal("Error", "Hubo un problema al conectar con el servidor. Por favor, inténtelo de nuevo más tarde.", "error");
                });


              } else {
                  swal("Error","El codigo no es el correcto.", "error");
              }
          },
          error: function(error) {
              console.log(error);
              swal("Error","Ocurrió un error al procesar la solicitud.", "error");
          }
      });
    });

    $('#devolver').on('click', function() {

      var rows_selected = table1.rows({selected: true}).data();
      var idt = [];

      $.each(rows_selected, function (index, value) {
        idt.push(value[0]);
      });

      if(rows_selected.length === 0){
        swal("Error", "Debe seleccionar al menos una fila antes de enviar las tareas al Lider Turno.", "error");
        return;
      }
        
      swal({
        title: "¡SAPMA!",
        text: "¿Desea devolver estas tareas al Lider Turno?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí"   
        },function(isConfirm) {
          if (isConfirm) {
            $('#codigoModal2').modal('show');
            iniciarTemporizador2(300); 
            $.ajax({
                url: "/generar_codigo",
                type: "POST"
            });
          }
      });

    });

    $('#enviarCodigo2').on('click', function() {

      var rows_selected = table1.rows({ selected: true }).nodes(); 
      var idt = [];
      
      $.each(rows_selected, function (index, row) {

          var columna0 = $(row).find('td').eq(0).text().trim();
          var inputValue = $(row).find('td').eq(12).find('input').val();
      
          let boolobs;
        
            if (!inputValue) {
                inputValue = "Validada por lider turno";
                boolobs = 0;
            }else{
                boolobs = 1;
            }
        
            idt.push({
              idTarea: columna0,
              obs: inputValue,
              boolobs: boolobs
            });
      });

      var codigo = $('#codigoInput2').val();

      $.ajax({
          url: "/verificar_codigo",
          type: "POST",
          data: {
              codigo
          },
          success: function(response) {
              if (response.success) {

                $.ajax({
                  url: "/protocolo/devolver_lider",
                  type: "POST",
                  data: {idt},
                  beforeSend: function(){
                    swal({
                        title: "Enviando",
                        text: "Espere un momento por favor...",
                        imageUrl:"/img/Spinner-1s-200px2.gif",
                        showConfirmButton: false,
                        allowOutsideClick: false
                    });
                  }
                }).done(function(data) {
                  swal({
                    title: "¡SAPMA!",
                    text: "¡Tareas enviadas al Lider Técnico!",
                    type: "success",
                    confirmButtonText: "Aceptar",
                    allowOutsideClick: false
                  });	
                  setTimeout(function () {
                    location.reload();
                  }, 1000);	
                }).fail(function (jqXHR, textStatus, errorThrown){
                  swal("Error", "Hubo un problema al conectar con el servidor. Por favor, inténtelo de nuevo más tarde.", "error");
                });

              } else {
                  swal("Error","El codigo no es el correcto.", "error");
              }
          },
          error: function(error) {
              console.log(error);
              swal("Error","Ocurrió un error al procesar la solicitud.", "error");
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
                codigo
            },
            beforeSend: function() {
                swal({
                title: "Generando PDFs",
                text: "Espere un momento por favor...",
                imageUrl:"/img/Spinner-1s-200px2.gif",
                showConfirmButton: false,
                allowOutsideClick: false
                });
            }
            }).done(function (data) {
            swal({
                title: "PDFs Generados",
                text: "Se han agregado los PDFs a un archivo comprimido",
                type: "success",
                confirmButtonText: "Aceptar",
                allowOutsideClick: false
            }, function (isConfirm) {
                if (isConfirm) {
                window.location.href = "/archivo";
                }
            });
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



  