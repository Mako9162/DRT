$(document).ready(function () {
  // plantillas para los inputs de opción
  function crearOpcion(valor = "") {
    const row = $(`
      <div class="input-group mb-2 m-b-1 opcion-item">
        <input
          type="text"
          class="form-control opcion-input"
          placeholder="Escribe una opción"
          required
          value="${valor}"
        >
        <span class="input-group-btn">
          <button class="btn btn-danger remove-opcion" type="button">
            <span class="glyphicon glyphicon-trash"></span>
          </button>
        </span>
      </div>
    `);
    return row;
  }

  // inicializa el modal con una opción vacía
  function resetOpciones() {
    const cont = $("#opciones-container").empty();
    cont.append(crearOpcion());
    actualizarRemoveState();
  }

  // habilita/deshabilita botón de eliminar si solo queda 1
  function actualizarRemoveState() {
    const items = $("#opciones-container .opcion-item");
    if (items.length === 1) {
      items.find(".remove-opcion").prop("disabled", true);
    } else {
      items.find(".remove-opcion").prop("disabled", false);
    }
  }

  // configurar DataTable (tu código existente)
  var table1;
  function initDataTable() {
    table1 = $("#tipo_respuestas").DataTable({
      dom: "Bfrtip",
      buttons: [
        {
          text: "Agregar",
          className: "btn btn-success agregar",
        },
      ],
      columnDefs: [
        { targets: 3, visible: false }   
      ],
      searching: true,
      lengthChange: false,
      colReorder: true,
      bDestroy: true,
      scrollX: true,
      bInfo: true,
      iDisplayLength: 10,
      autoWidth: false,
      order: [
        [3, "desc"], 
      ],
      language: {
        sProcessing: "Procesando...",
        sLengthMenu: "Mostrar _MENU_ registros",
        sZeroRecords: "No se encontraron resultados",
        sEmptyTable: "Sin infomación",
        sInfo: "Mostrando un total de _TOTAL_ registros",
        sInfoEmpty: "Mostrando un total de 0 registros",
        sInfoFiltered: "(filtrado de un total de _MAX_ registros)",
        sInfoPostFix: "",
        sSearch: "Buscar:",
        sUrl: "",
        sInfoThousands: ".",
        sLoadingRecords: "Cargando...",
        oPaginate: {
          sFirst: "Primero",
          sLast: "Último",
          sNext: "Siguiente",
          sPrevious: "Anterior",
        },
        oAria: {
          sSortAscending:
            ": Activar para ordenar la columna de manera ascendente",
          sSortDescending:
            ": Activar para ordenar la columna de manera descendente",
        },
      },
    });
  }

  initDataTable();

  // abrir modal “Agregar”
  $(".agregar").on("click", function () {
    $("#respuesta_titulo").text("Agregar Tipo Respuesta");
    resetOpciones();
    $("#guardar").prop("hidden", false);
    $("#actualizar").prop("hidden", true);
    $("#respuesta").modal("show");
  });

  // añadir nueva opción
  $("#add-opcion").on("click", function () {
    $("#opciones-container").append(crearOpcion());
    actualizarRemoveState();
  });

  // eliminar opción (delegado)
  $("#opciones-container").on("click", ".remove-opcion", function () {
    $(this).closest(".opcion-item").remove();
    actualizarRemoveState();
  });

  $('#respuesta').on('hidden.bs.modal', function () {
    $('#descripcion').val('');
    $('#idRespuesta').val(''); 
    resetOpciones();
  });

  $("#guardar").on("click", function () {

    const descripcion = $("#descripcion").val().trim();
    if (!descripcion) {
      return swal("Error", "La descripción es obligatoria", "error");
    }

    const opciones = [];
    let ok = true;
    $("#opciones-container .opcion-input").each(function () {
      const v = $(this).val().trim();
      if (!v) ok = false;
      opciones.push(v);
    });
    if (!ok) {
      return swal("Error","Todas las opciones deben tener texto", "error");
    }

    swal({
        title: "¿Está seguro?",
        text: "¿Desea guardar el nuevo tipo de respuesta?",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-primary",
        confirmButtonText: "Si",
        cancelButtonText: "No",
        closeOnConfirm: true
        }, function (isConfirm) {
            if(isConfirm){
                $.ajax({
                    url: "/tipo_respuesta/guardar",
                    type: "POST",
                    data: {
                        descripcion: descripcion,
                        opciones: opciones,
                    },
                    success: function (data) {
                        console.log(data);
                        if (data.success) {
                            $("#respuesta").modal("hide");
                            swal("Éxito", "Tipo de respuesta guardado", "success");
                            $("#respuesta").modal("hide");
                            const table2 = $('#tipo_respuestas').DataTable();
                            table2.row.add([
                                data.id,
                                data.descripcion,
                                data.opciones,
                                data.obligatorio,
                                '<center><button class="btn btn-inline btn-warning btn-sm ladda-button edit"><i class="fa fa-pencil"></i></button></center>' 
                            ]).draw();
                        } else {
                            swal("Error", data.message, "error");
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error(xhr.responseText);
                        swal("Error", "Ocurrió un error al guardar el tipo de respuesta", "error");
                    },
                });
            }
        }
    );
  });

  $(document).on('click', '.edit', function () {
    const $tr = $(this).closest('tr');
  
    const id = $tr.find('td:eq(0)').text().trim();
    const descripcion = $tr.find('td:eq(1)').text().trim();
    const opcionesStr = $tr.find('td:eq(2)').text().trim();

    const opcionesArray = opcionesStr
      ? opcionesStr.split('-').map(s => s.trim())
      : [];
  
    $('#respuesta_titulo').text('Actualizar Tipo Respuesta');
    $('#idRespuesta').val(id);  
    $('#descripcion').val(descripcion);
  
    const $cont = $('#opciones-container').empty();
    if (opcionesArray.length) {
      opcionesArray.forEach(op => $cont.append(crearOpcion(op)));
    } else {
      $cont.append(crearOpcion());
    }

    actualizarRemoveState();
  
    $('#guardar').prop('hidden', true);
    $('#actualizar').prop('hidden', false);
    $('#respuesta').modal('show');
  });

  $("#actualizar").on("click", function () {

    const id = $("#idRespuesta").val().trim();
    const descripcion = $("#descripcion").val().trim();
    if (!descripcion) {
      return swal("Error", "La descripción es obligatoria", "error");
    }
    // recoger opciones
    const opciones = [];
    let ok = true;
    $("#opciones-container .opcion-input").each(function () {
      const v = $(this).val().trim();
      if (!v) ok = false;
      opciones.push(v);
    });
    if (!ok) {
      return swal("Error","Todas las opciones deben tener texto", "error");
    }

    swal({
        title: "¿Está seguro?",
        text: "¿Desea actualizar el nuevo tipo de respuesta?",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-primary",
        confirmButtonText: "Si",
        cancelButtonText: "No",
        closeOnConfirm: true
        }, function (isConfirm) {
            if(isConfirm){
                $.ajax({
                    url: "/tipo_respuesta/actualizar",
                    type: "POST",
                    data: {
                        id: id,
                        descripcion: descripcion,
                        opciones: opciones,
                    },
                    success: function (data) {
                        console.log(data);
                        if (data.success) {
                            swal("Éxito", "Tipo de respuesta actualizado", "success");
                            $("#respuesta").modal("hide");
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        } else {
                            swal("Error", data.message, "error");
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error(xhr.responseText);
                        swal("Error", "Ocurrió un error al guardar el tipo de respuesta", "error");
                    },
                });
            }
        }
    );
  });
  
});


