var table1;

$(document).ready(function () {

    function initDataTable() {
        var checkTogglePressed = false;
      
        table1 = $('#tabla_prot1').DataTable({
         "createdRow": function (row, data, dataIndex) {
            if (data[11] === "SOP") {
                $('td:eq(11)', row).text("Sistema Operativo");
            } else if (data[11] === "SC") {
                $('td:eq(11)', row).text("No Aplica");
            } else if (data[11] === "SSR") {
                $('td:eq(11)', row).text("Sistema sin revisar");
            } else if (data[11] === "SOCO"){
                $('td:eq(11)', row).text("Sist. operativo con obs.");
            } else if (data[11] === "SFS"){
              $('td:eq(11)', row).text("Sist. fuera de serv.");
            } else if (data[11] === "SNO"){
              $('td:eq(11)', row).text("Sist. no operativo");
            }

            if (data[16] === "SOP") {
              $('td:eq(16)', row).text("Sistema Operativo");
            } else if (data[16] === "SC") {
                $('td:eq(16)', row).text("No Aplica");
            } else if (data[16] === "SSR") {
                $('td:eq(16)', row).text("Sistema sin revisar");
            } else if (data[16] === "SOCO"){
                $('td:eq(16)', row).text("Sist. operativo con obs.");
            } else if (data[16] === "SFS"){
              $('td:eq(16)', row).text("Sist. fuera de serv.");
            } else if (data[16] === "SNO"){
              $('td:eq(16)', row).text("Sist. no operativo");
            }

            var cellText = $('td:eq(11)', row).text();
            var cellTextEA = $('td:eq(15)', row).text();
            var cellTextTA = $('td:eq(13)', row).text();

            if (!(data[11] == "SOP" || data[16] == "SOP" || data[16] == "")) {
                var titleText = 'Estado del equipo anterior: '+'\n' + cellTextEA + '\n' + 
                'Tarea anterior: ' + cellTextTA + '\n' +
                'Fecha anterior: ' + data[15];
                $('td:eq(12)', row).attr('title', titleText).html('<span class="alerta">⚠️</span> '+ cellText);
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
              "title": "TareasParaAprobar",
              "titleAttr": "Exportar a Excel",
              "className": "btn btn-rounded btn-success",
              "exportOptions": {
                "columns": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9 , 10, 11, 12 , 16, 17],
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
                      <button id="seleccionar" type="button" class="btn btn-inline btn-warning ladda-button">Seleccionar</i></button>
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
    
        $('#seleccionar').on('click', function () {
    
            table1.rows({ search: 'applied' }).select();
    
            $('#seleccionar').prop('hidden', true);
            $('#deseleccionar').prop('hidden', false);
        });
        
        
        $('#deseleccionar').on('click', function () {
            table1.rows().deselect();
        
            $('#seleccionar').prop('hidden', false);
            $('#deseleccionar').prop('hidden', true);
        });
    
        $("#pdfs").on("click", function () {
            var rows_selected = table1.rows({selected: true}).data();
            var idpdf = [];
            var codigo = [];
    
            $.each(rows_selected, function (index, value) {
                idpdf.push(value[0]);
            });
    
            $.each(rows_selected, function (index, value) {
                codigo.push(value[4]);
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
                idpdf.push(value[0]);
            });
    
            $.each(rows_selected, function (index, value) {
                codigo.push(value[4]);
            });
            window.location.href = "/archivo/" + idpdf + "/" + codigo;		
        });
    }
    
    initDataTable(); 

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

    $("#aprobar").on('click', function() {  

      const options = {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false 
      };

      const clientDate = new Date().toLocaleString('es-CL', options);
      var data = table1.rows({selected: true}).nodes();

      if(!data.length){
        swal("Error", "Debe seleccionar al menos una fila para aprobar","error");
        return;
      }

      var obsd = [];
      $.each(data, function (index, value) {
        var obs = $(value).find("td").eq(17).find("input").val();
        obsd.push(obs);
      });

      var datos = [];
      var data1 = table1.rows({selected: true}).data();

      $.each(data1, function (index, value) {
          datos.push({
              idt: value[0], 
              fecha: value[1], 
              estado: value[2], 
              tipo: value[3], 
              tag: value[4], 
              tag_dmh: value[5],
              ger: value[6],
              area: value[7],
              sector: value[8],
              ubi: value[9],
              tec: value[10],
              estequi: value[11],
              estadoequi: value[1211],
              repu: value[13],
              clientDate: clientDate,
              obs: obsd[index]
          });
      });

      var idt = [];
      var rows_selected = table1.rows({selected: true}).data();
      $.each(rows_selected, function (index, value) {
          idt.push(value[0]);
      });

      swal({
        title: "¡SAPMA!",
        text: "¿Desea aprobar estas tareas?",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-primary",
        confirmButtonText: "Si",
        cancelButtonText: "No",
        closeOnConfirm: true      
        }, function(isConfirm) {
          $('#codigoModal2').modal('show');
          iniciarTemporizador2(300); 
          $.ajax({
              url: "/generar_codigo",
              type: "POST"
          });
        }					
        );		
    });

    $('#enviarCodigo2').on('click', function() {

      const options = {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false 
      };

      const clientDate = new Date().toLocaleString('es-CL', options);
      var data = table1.rows({selected: true}).nodes();

      if(!data.length){
        swal("Error", "Debe seleccionar al menos una fila para aprobar","error");
        return;
      }

      var obsd = [];
      $.each(data, function (index, value) {
        var obs = $(value).find("td").eq(17).find("input").val();
        obsd.push(obs);
      });

      var datos = [];
      var data1 = table1.rows({selected: true}).data();

      $.each(data1, function (index, value) {
          datos.push({
              idt: value[0], 
              fecha: value[1], 
              estado: value[2], 
              tipo: value[3], 
              tag: value[4], 
              tag_dmh: value[5],
              ger: value[6],
              area: value[7],
              sector: value[8],
              ubi: value[9],
              tec: value[10],
              estequi: value[11],
              estadoequi: value[12],
              repu: value[13],
              clientDate: clientDate,
              obs: obsd[index]
          });
      });

      var idt = [];
      var rows_selected = table1.rows({selected: true}).data();
      $.each(rows_selected, function (index, value) {
          idt.push(value[0]);
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
                    url: "/aprobaciones",
                    type: "POST", 	 	
                    data: {
                        idt,
                        datos,
                        obsd					
                    },
                    beforeSend: function() {
                        swal({
                        title: "Aprobando",
                        text: "Espere un momento por favor...",
                        imageUrl:"/img/Spinner-1s-200px2.gif",
                        showConfirmButton: false,
                        allowOutsideClick: false
                        });
                    }
                    }).done(function (data) {
                    swal({
                        title: "¡SAPMA!",
                        text: "Tareas aprobadas",
                        type: "success",
                        confirmButtonText: "Aceptar",
                        allowOutsideClick: false
                    });	
                    setTimeout(function () {
                        location.reload();
                    }, 1000);		
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

    $("#rechazar").on("click", function () {
        var data1 = table1.rows({selected: true}).data();

        if(!data1.length){
            swal("Error", "Debe seleccionar al menos una fila para aprobar","error");
            return;
        }

        swal({
            title: "¡SAPMA!",
            text: "¿Desea RECHAZAR estas tareas?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: true      
            }, function(isConfirm) {
                if (isConfirm) {
                    $('#codigoModal3').modal('show');
                    iniciarTemporizador3(300); 
                    $.ajax({
                        url: "/generar_codigo",
                        type: "POST"
                    });
                } else {
                    swal("¡SAPMA!", "Tareas no rechazadas", "error");
                }
            }					
        );		
    });

    $('#enviarCodigo3').on('click', function() {

        var selectedData = table1.rows({ selected: true }).nodes();
        var result = Array.from(selectedData).map(row => ({
            idTarea: $(row).find("td").eq(0).text().trim(), // Columna ID
            obs: $(row).find("td").eq(17).find("input").val() // Columna OBS
        }));      
        
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
                        url: "/rechazos",
                        type: "POST", 	 	
                        data: {result},
                        beforeSend: function() {
                            swal({
                            title: "Rechazando Tareas...",
                            text: "Espere un momento por favor...",
                            imageUrl:"/img/Spinner-1s-200px2.gif",
                            showConfirmButton: false,
                            allowOutsideClick: false
                            });
                        }
                        }).done(function (data) {
                        swal({
                            title: "¡SAPMA!",
                            text: "Tareas rechazadas",
                            type: "success",
                            confirmButtonText: "Aceptar",
                            allowOutsideClick: false
                        });	
                        setTimeout(function () {
                            location.reload();
                        }, 1000);                       
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

});




  
