var table1;

$(document).ready(function () {

    $('#date3').change(function() {
        var year = $(this).val(); 
    
        $.ajax({
            url: '/mes/' + year,
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

    $('#gerencia').change(function() {
        var gerencia = $(this).val(); 
        
        $('#sector').empty();
        $('#sector').append('<option value="">Seleccione un sector</option>');
        
        $.ajax({
            url: '/ger/' + gerencia,
            type: 'GET',
            success: function(response) {
    
                $('#area').empty();

                $('#area').append('<option value="">Seleccione un area</option>');
    
                $.each(response, function(index, item) {
                    $('#area').append('<option value="' + item.Id + '">' + item.Descripcion +'</option>');
                });
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    $('#area').change(function() {
        var area = $(this).val(); 
    
        $.ajax({
            url: '/area/' + area,
            type: 'GET',
            success: function(response) {
    
                $('#sector').empty();

                $('#sector').append('<option value="">Seleccione un sector</option>');
    
                $.each(response, function(index, item) {
                    $('#sector').append('<option value="' + item.Id + '">' + item.Descripcion +'</option>');
                });
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    $('#buscar').on('click', function() {
        var gerencia = $('#gerencia').val();
        var area = $('#area').val();
        var sector = $('#sector').val();
        var ano = $('#date3').val();
        var mes = $('#date4').val();
      
        if (!ano || !mes) {
          swal("Error", "Debe seleccionar año y mes para continuar", "error");
          return;
        }
      
        if (!gerencia && !area && !sector) {
          swal("Error", "Debe seleccionar al menos una gerencia para continuar", "error");
          return;
        }
      
        var data = {
          gerencia,
          area,
          sector,
          ano,
          mes
        };
      
        fetch('/pendiente_archivo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(response => {
          if (response.status === 204) {
            swal("Alerta", "No hay resultados", "info");
            return;
          }
          if (!response.ok) {
            throw new Error('No hay resultados en esta consulta');
          }
          return response.blob();
        })
        .then(blob => {
          if (blob) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pendientes.xlsx'; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        })
        .catch(error => {
          swal("Error", error.message, "error");
        });
    });

    $('#enviar').on('click', function() {
        var inputFile = $('#archivo')[0];
    
        if (inputFile.files.length === 0) {
            swal("Error", "Seleccione un archivo.", "error");
            return;
        }
    
        var fileName = inputFile.files[0].name;
        var fileExtension = fileName.split('.').pop().toLowerCase();
    
        if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
            swal("Error", "Seleccione un archivo Excel válido.", "error");
            $('#file-input').val('');
            return;
        }
    
        var file = inputFile.files[0];
        var reader = new FileReader();
    
        reader.onload = function(e) {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });
            var sheet = workbook.Sheets['Tareas']; 
    
            const maxColumns = 11;
    
            var headers = [];
            for (var col = 0; col <= maxColumns; col++) {
                var cell = sheet[XLSX.utils.encode_cell({ r: 0, c: col })];
                if (cell && cell.v) {
                    headers.push(cell.v);  
                }
            }
    
            var lastRowWithData = -1;
            var range = XLSX.utils.decode_range(sheet['!ref']);  
            for (var row = 1; row <= range.e.r; row++) {
                var cell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })]; 
                if (cell && cell.v) {
                    lastRowWithData = row; 
                }
            }
    
            for (var row = 1; row <= lastRowWithData; row++) {
                for (var col = 0; col < headers.length; col++) {
                    var cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
                    if (!cell || !cell.v) {
                        swal("Error", "Hay celdas vacías en la fila " + (row + 1) + " que corresponden a la columna con cabecera " + headers[col] + ".", "error");
                        return;
                    }
                }
            }
    
            var fechaHoraCliente = new Date();
            var fecha = fechaHoraCliente.toISOString().split('T')[0];
            var hora = fechaHoraCliente.toTimeString().split(' ')[0];
            
            var fechaHora = fecha + ' ' + hora;
    
            var formData = new FormData();
            formData.append('file', file);
            formData.append('fecha_hora_cliente', fechaHora); 
    
            swal({
                title: "¡SAPMA!",
                text: "¿Está seguro de actualizar estas tareas?",
                type: "warning",
                showCancelButton: true,
                confirmButtonClass: "btn-primary",
                confirmButtonText: "Sí",
                cancelButtonText: "No",
                closeOnConfirm: false
            }, function(isConfirm) {
                if (isConfirm) {
                    $.ajax({
                        url: '/comprobar_tareas',
                        type: 'POST',
                        data: formData,
                        processData: false,
                        contentType: false,
                        beforeSend: function () {
                            swal({
                              title: "Verificando",
                              text: "Espere un momento por favor...",
                              imageUrl: "/img/Spinner-1s-200px2.gif",
                              showConfirmButton: false,
                              allowOutsideClick: false,
                            });
                        },
                        success: function(response) {
                            if(response.status === 'ok') {
                              $.ajax({
                                url: '/actualizar_tareas_pendientes',
                                type: 'POST',
                                data: formData,
                                processData: false,
                                contentType: false,
                                beforeSend: function () {
                                  swal({
                                    title: "Actualizando",
                                    text: "Espere un momento por favor...",
                                    imageUrl: "/img/Spinner-1s-200px2.gif",
                                    showConfirmButton: false,
                                    allowOutsideClick: false,
                                  });
                                },
                                success: function(response) {
                                  swal("SAPMA", "Tareas actualizadas.", "success");
                                  setTimeout(function () {
                                    location.reload();
                                  }, 1000);
                                },
                                error: function(jqXHR, textStatus, errorThrown) {
                                  swal("Error", "Hubo un problema al enviar el archivo.", "error");
                                }
                              });
                            } else if(response.status === 'error') {
                              console.log('error');
                              swal("Error", "Ya existe información en alguno de los protocolos de las tareas enviadas", "error");
                            }
                          },
                        error: function(jqXHR, textStatus, errorThrown) {
                            wal("Error", "Hubo un problema al enviar el archivo.", "error");
                        }
                          
                    })
                    
                }
            });
        };
    
        reader.readAsArrayBuffer(file); 
    });
    

});
