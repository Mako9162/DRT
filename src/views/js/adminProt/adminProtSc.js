$(document).ready(function () {
    //Configuracion de la tabla
    const table1 = $('#tablaProtocolos').DataTable({
        select:   false,
        dom:      'frtip',
        deferRender: true,
        scrollX:  true,
        autoWidth: false,
        iDisplayLength: 10,
        bDestroy: false,
        columns: [
            {   title: 'Id',
                width: '80px'
            },
            { title: 'Protocolo' },
            {
                title: 'Acción',
                orderable: false,
                searchable: false,
                width: '80px',
                className: 'text-center'
            },
            { title: 'Tipo de equipo' },
            {
                title: 'Acción',
                orderable: false,
                searchable: false,
                width: '80px',
                className: 'text-center'
            }
        ],
        data: [],  
        language: {
            processing:    'Procesando...',
            lengthMenu:    'Mostrar _MENU_ registros',
            zeroRecords:   'No se encontraron resultados',
            emptyTable:    'Sin información',
            info:          'Mostrando un total de _TOTAL_ registros',
            infoEmpty:     'Mostrando un total de 0 registros',
            infoFiltered:  '(filtrado de un total de _MAX_ registros)',
            search:        'Buscar:',
            loadingRecords:'Cargando...',
            paginate: {
                first:    'Primero',
                last:     'Último',
                next:     'Siguiente',
                previous: 'Anterior'
            }        
        },

    }).columns.adjust();

    function reloadTable(data) {
        const rows = data.map(item => [
        item.Id || '',
        item.Protocolo,
        `<center>
            <button class="btn btn-sm btn-warning editNameProt" title="Editar nombre de protocolo"><i class="fa fa-pencil"></i></button>
        </center>`,
        item.TipoEquipo,
        `<center>
            <button class="btn btn-sm btn-primary verProt" title="Ver y editar protocolo"><i class="fa fa-pencil"></i></button>
        </center>`
        ]);

        table1
        .clear()
        .rows.add(rows)
        .columns.adjust()
        .draw();
    }

    // Cargar datos iniciales
    $('#tipoProt').on('change', function() {
        const tipoProt = $(this).val();

        swal({
            title: "Cargando",
            text: "Espere un momento por favor...",
            imageUrl: "/img/Spinner-1s-200px2.gif",
            showConfirmButton: false,
            allowOutsideClick: false
        });

        $.post('/tipoProt', {tipoProt })
        .done(function(data) {
            swal.close();
            reloadTable(data);
        })
        .fail(function(err) {
            swal.close();
            console.error('Error en la solicitud:', err);
            swal("Error", "No se pudieron cargar los datos. Inténtelo de nuevo.", "error");
        });
    });

    // Ver Protocolo
    $(document).on('click', '.verProt', async function (e) {
        e.preventDefault();
        const rowData = table1.row($(this).closest('tr')).data();
        const protId = rowData[0];
        const protName = rowData[1];
        const protTipoEquipo = rowData[3];

        try {
            swal({
                title: "Cargando protocolo",
                text: "Espere un momento por favor...",
                imageUrl: "/img/Spinner-1s-200px2.gif",
                showConfirmButton: false,
                allowOutsideClick: false
            });
            const data = await $.post('/verProt', { protId });
            const tiposRespuesta = await $.get('/tipoRespuesta');

            // Agrupamos capitulos
            const capitulos = {};
            data.forEach(item => {
                if (!capitulos[item.CAPITULO]) capitulos[item.CAPITULO] = [];
                capitulos[item.CAPITULO].push(item);
            });

            // Mapa de tareas por capítulo
            const capTareasMap = {};
            Object.keys(capitulos).forEach((cap) => {
                capTareasMap[cap] = capitulos[cap][0].TIENE_TAREAS;
            });

            // Header con tabs + acciones
            let navTabs = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <ul class="nav nav-tabs" id="protTabs" role="tablist"></ul>
                    <div style="display:flex; gap:12px;">
                        <i id="btnAgregarCapitulo" class="fa fa-plus-circle text-success" 
                            style="cursor:pointer; font-size:25px;" 
                            title="Agregar capítulo"></i>
                        <i id="btnEliminarCapitulo" class="fa fa-trash text-danger" 
                            style="cursor:pointer; font-size:25px; display:none;" 
                            title="Eliminar capítulo"></i>
                    </div>
                </div>`;
            let tabContent = `<div class="tab-content" id="protTabsContent">`;

            // Renderizar capitulos y capturas
            Object.keys(capitulos).forEach((cap, index) => {
                const tabId = `tab-${index}`;
                const tieneTareas = capitulos[cap][0].TIENE_TAREAS;

                // pestaña
                navTabs = navTabs.replace('</ul>', `
                    <li role="presentation">
                        <a href="#${tabId}" role="tab" data-toggle="tab" class="editable editable-capitulo" data-capitulo="${cap}" data-id="${capitulos[cap][0].ID_CAPITULO}">
                            ${cap}
                        </a>
                    </li></ul>`);

                // acciones dentro del capítulo
                const accionesCapitulo = `
                    <div class="text-right" style="margin-bottom:10px;">
                        <i class="fa fa-plus-circle text-success agregar-captura" 
                        style="cursor:pointer; font-size:18px;" 
                        data-tab="${tabId}" 
                        title="Agregar captura"></i>
                    </div>`;

                // capturas
                const itemsHtml = capitulos[cap].map(row => {
                    const opcionesSelect = (tipoActual) => `
                        <select class="form-control">
                            ${tiposRespuesta.map(opt => `
                                <option value="${opt.Id}" ${opt.Descripcion === tipoActual ? 'selected' : ''}>
                                    ${opt.Descripcion}
                                </option>`).join('')}
                        </select>`;

                    const btnEliminarCaptura = row.TIENE_TAREAS == 0 ? `
                        <i class="fa fa-trash text-danger eliminar-captura" 
                            style="cursor:pointer; margin-left:8px;" 
                            data-captura="${row.CORRELATIVO}" 
                            data-capitulo="${row.ID_CAPITULO}" 
                            data-protocolo="${row.ID_PROTOCOLO}" 
                            title="Eliminar captura"></i>` : '';

                    return `
                        <div class="col-md-6 form-group m-t-2" style="margin-bottom:15px;">
                            <div class="label-wrapper" style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                                <label class="form-label editable editable-captura" style="margin:0; flex:1;" data-id="${row.CORRELATIVO}">${row.CAPTURA}</label>
                                <input type="checkbox" ${row.OBLIGATORIO === 1 ? 'checked' : ''} title="Obligatorio">
                                ${btnEliminarCaptura}
                            </div>
                            ${opcionesSelect(row.TIPO_RESPUESTA)}
                        </div>`;
                }).join('');

                tabContent += `
                    <div class="tab-pane" id="${tabId}" role="tabpanel" data-capitulo="${cap}" data-id="${capitulos[cap][0].ID_CAPITULO}">
                        ${accionesCapitulo}
                        <div class="container-fluid">
                            <div class="row">${itemsHtml}</div>
                        </div>
                    </div>`;
            });

            tabContent += `</div>`;

            // inyectar en modal
            $('#bodyModalVerProt').empty().append(navTabs + tabContent);
            $('#tituloProt').text(`PROTOCOLO: ${protId} - ${protName} / TIPO DE EQUIPO: ${protTipoEquipo}`);
            $('#idProtAct').val(protId);
            swal.close();
            $('#modalVerProt').modal('show');

            // reordenar inicial
            reordenar();

            // pestañas
            function actualizarBotonEliminar() {
                const activeTab = $('#protTabs li.active a');
                if (!activeTab.length) return;
                const capName = activeTab.data('capitulo');
                if (capTareasMap[capName] == 0) {
                    $('#btnEliminarCapitulo').show();
                } else {
                    $('#btnEliminarCapitulo').hide();
                }
            }

            $(document).off('click', '#protTabs a').on('click', '#protTabs a', function (e) {
                e.preventDefault();
                const target = $(this).attr('href');
                $('#protTabs li').removeClass('active');
                $(this).parent().addClass('active');
                $('.tab-pane').removeClass('active');
                $(target).addClass('active');
                actualizarBotonEliminar();
            });

            $('#protTabs li:first').addClass('active');
            $('#protTabsContent .tab-pane:first').addClass('active');
            actualizarBotonEliminar();

            // eliminar captura
            $(document).off('click', '.eliminar-captura').on('click', '.eliminar-captura', function () {
                $(this).closest('.form-group').remove();
                reordenar();
            });

            // eliminar capítulo
            $(document).off('click', '#btnEliminarCapitulo').on('click', '#btnEliminarCapitulo', function () {
                const activeTab = $('#protTabs li.active a');
                if (!activeTab.length) return;

                const tabId = activeTab.attr('href');
                const capName = activeTab.data('capitulo');

                activeTab.parent().remove();
                $(tabId).remove();
                delete capTareasMap[capName];

                $('#protTabs li:first').addClass('active');
                $('#protTabsContent .tab-pane:first').addClass('active');
                actualizarBotonEliminar();
                reordenar();
            });

            // edición en línea
            $(document).off('dblclick', '.editable').on('dblclick', '.editable', function () {
                const $this = $(this);
                if ($this.find('input').length) return;
                const currentText = $this.text().trim();

                // Hereda estilos y dimensiones del elemento original
                const width = $this.outerWidth();
                const height = $this.outerHeight();
                const fontSize = $this.css('font-size');
                const fontWeight = $this.css('font-weight');
                const textAlign = $this.css('text-align');
                const background = $this.css('background-color');
                const color = $this.css('color');

                // Crear input que se integra visualmente
                const input = $(`
                    <input type="text"
                        class="form-control input-sm"
                        value="${currentText}"
                        style="
                            width: ${width}px;
                            height: ${height}px;
                            font-size: ${fontSize};
                            font-weight: ${fontWeight};
                            text-align: ${textAlign};
                            background: ${background};
                            color: ${color};
                            border: none;
                            outline: 2px solid #ffd700;
                            border-radius: 4px;
                            margin: 0;
                            box-sizing: border-box;
                            padding: 0 8px;
                        ">
                `);

                $this.empty().append(input);
                input.focus();
                input.select();

                input.on('blur keydown', function (e) {
                    if (e.type === 'blur' || e.key === 'Enter') {
                        const newText = $(this).val().trim() || currentText;
                        $this.text(newText);
                        reordenar();
                    }
                });
            });

            // agregar capítulo
            $(document).off('click', '#btnAgregarCapitulo').on('click', '#btnAgregarCapitulo', function () {
                const newIndex = $('#protTabs li').length;
                const newTabId = `tab-${newIndex}`;
                const newCapName = "Nuevo Capítulo";

                capTareasMap[newCapName] = 0;

                $('#protTabs').append(`
                    <li role="presentation">
                        <a href="#${newTabId}" role="tab" data-toggle="tab" class="editable editable-capitulo" data-capitulo="${newCapName}" data-id="">
                            ${newCapName}
                        </a>
                    </li>`);
                $('#protTabsContent').append(`
                    <div class="tab-pane" id="${newTabId}" role="tabpanel" data-capitulo="${newCapName}" data-id="">
                        <div class="text-right" style="margin-bottom:10px;">
                            <i class="fa fa-plus-circle text-success agregar-captura" 
                            style="cursor:pointer; font-size:18px;" 
                            data-tab="${newTabId}" 
                            title="Agregar captura"></i>
                        </div>
                        <div class="container-fluid">
                            <div class="row"></div>
                        </div>
                    </div>`);

                $('#protTabs li').removeClass('active');
                $('#protTabsContent .tab-pane').removeClass('active');
                $(`#protTabs a[href="#${newTabId}"]`).parent().addClass('active');
                $(`#${newTabId}`).addClass('active');
                actualizarBotonEliminar();
                reordenar();
            });

            // agregar captura
            $(document).off('click', '.agregar-captura').on('click', '.agregar-captura', function () {
                const tabId = $(this).data('tab');
                const newCapturaName = "Nueva Captura";

                const html = `
                    <div class="col-md-6 form-group m-t-2" style="margin-bottom:15px;">
                        <div class="label-wrapper" style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                            <label class="form-label editable editable-captura" style="margin:0; flex:1;" data-id="">${newCapturaName}</label>
                            <input type="checkbox" title="Obligatorio">
                            <i class="fa fa-trash text-danger eliminar-captura" style="cursor:pointer; margin-left:8px;" title="Eliminar captura"></i>
                        </div>
                        <select class="form-control">
                            ${tiposRespuesta.map(opt => `
                                <option value="${opt.Id}">${opt.Descripcion}</option>`).join('')}
                        </select>
                    </div>`;
                $(`#${tabId} .row`).append(html);
                reordenar();
            });

        } catch (err) {
            console.error('Error en la solicitud:', err);
            swal("Error", "No se pudo cargar el protocolo. Inténtelo de nuevo.", "error");
        }
    });

    function reordenar() {
        // Renumerar capítulos
        $('#protTabs li a').each(function(index) {
            const nuevoNum = index + 1;
            const $this = $(this);
            const oldText = $this.text();
            $this.text(`${oldText}`);
            $this.data("id", nuevoNum); // 🔥 actualizamos ID_CAPITULO
            const tabId = $this.attr("href");
            $(tabId).attr("data-id", nuevoNum);
        });

        // Renumerar capturas dentro de cada capítulo
        $('#protTabsContent .tab-pane').each(function() {
            $(this).find('.form-group').each(function(i) {
                const nuevoNum = i + 1;
                const $label = $(this).find('label.form-label');
                const oldText = $label.text();
                $label.text(`${oldText}`);
                $label.data("id", nuevoNum); // 🔥 actualizamos CORRELATIVO
            });
        });
    }

    function opcionesSelect(tipoActual, tiposRespuesta) {
        let html = `<select class="form-control">`;

        tiposRespuesta.forEach(opt => {
            html += `
                <option value="${opt.Id}" ${opt.Descripcion === tipoActual ? 'selected' : ''}>
                    ${opt.Descripcion}
                </option>`;
        });

        html += `</select>`;
        return html;
    }

    // Editar nombre de Protocolo
    $(document).on('click', '.editNameProt', async function (e) {
        e.preventDefault();
        const rowData = table1.row($(this).closest('tr')).data();
        const protId = rowData[0];
        const currentName = rowData[1];

        $('#idNombre').val(protId);
        $('#cambiaNombre').val(currentName);
        $('#tituloCambiaNombre').text('EDITAR NOMBRE DE PROTOCOLO');
        $('#modalCambiarNombre').modal('show');
    });

    $('#modalCambiarNombre').on('hidden.bs.modal', function (){
        $('#idNombre').val('');
        $('#cambiaNombre').val('');
        $('#tituloCambiaNombre').text('');
    });

    $('#btnGuardarCambiarNombre').on('click', function () { 
        const protId = $('#idNombre').val();
        const newName = $('#cambiaNombre').val().trim();

        if (!newName) {
            swal("Error", "El nombre del protocolo no puede estar vacío.", "error");
            return;
        }

        swal({
            title: "¿Esta seguro?",
            text: "a continuación actualizara el nombre del protocolo.",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Sí, actualizar",
            cancelButtonText: "Cancelar",
            closeOnConfirm: false,
        }, function (isConfirm) {
            if (!isConfirm) return;
            swal({
                title: "Actualizando protocolo",
                text: "Espere un momento por favor...",
                imageUrl: "/img/Spinner-1s-200px2.gif",
                showConfirmButton: false,
                allowOutsideClick: false
            });
            $.post('/cambiarNombreProt', { protId, newName })
            .done(function(response) {
                $('#modalCambiarNombre').modal('hide');
                const currentData = table1.rows().data().toArray();
                const updatedData = currentData.map(row => {
                    if (row[0] == response.protId) row[1] = newName; 
                    return row;
                });
                table1.clear().rows.add(updatedData).draw(); 
                swal("Éxito", response.message, "success");
            })
            .fail(function(err) {
                swal.close();
                console.error('Error en la solicitud:', err);
                swal("Error", "No se pudo cambiar el nombre del protocolo. Inténtelo de nuevo.", "error");
            });
        });
    });

    // Actualizar protocolo
    $(document).off('click', '#btnActualizarProt').on('click', '#btnActualizarProt', function () {
        const resultado = [];
        const idProtocolo = $('#idProtAct').val();

        $('#protTabsContent .tab-pane').each(function(indexCap) {
            // Busca la pestaña correspondiente por el atributo href
            const tabId = $(this).attr('id');
            const $tab = $(`#protTabs a[href="#${tabId}"]`);
            const capDescripcion = $tab.text().trim();
            const capId = $(this).data('id') || null;

            const capturas = [];
            $(this).find('.form-group').each(function(i) {
                const $label = $(this).find('label.form-label');
                const idCaptura = $label.data('id') || null;
                const descripcion = $label.text().trim();
                const tipoRespuesta = $(this).find('select').val();
                const obligatorio = $(this).find('input[type="checkbox"]').is(':checked');

                capturas.push({
                    orden: i + 1,
                    idCaptura,
                    descripcion,
                    tipoRespuesta,
                    obligatorio
                });
            });

            resultado.push({
                orden: indexCap + 1,
                idCapitulo: capId,
                descripcion: capDescripcion,
                capturas
            });
        });

        if (!idProtocolo || resultado.length === 0) {
            swal("Error", "No hay datos para actualizar el protocolo.", "error");
            return;
        }

        swal({
            title: "¿Está seguro?",
            text: "Se actualizará el protocolo. Esta acción no se puede deshacer.",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Sí, actualizar",
            cancelButtonText: "Cancelar",
            closeOnConfirm: false,
        }, function (isConfirm) {
            if (!isConfirm) return;
            swal({
                title: "Actualizando protocolo",
                text: "Espere un momento por favor...",
                imageUrl: "/img/Spinner-1s-200px2.gif",
                showConfirmButton: false,
                allowOutsideClick: false
            });

            $.ajax({
                url: '/actualizarProtocolo',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    idProtocolo,
                    capitulos: resultado
                }),
                success: function(response) {
                    if (response.success) {
                        $('#modalVerProt').modal('hide');
                        swal("Éxito", response.message, "success");
                    } else {
                        swal("Error", response.message || "No se pudo actualizar el protocolo.", "error");
                    }
                },
                error: function(err) {
                    swal.close();
                    console.error('Error en la solicitud:', err);
                    swal("Error", "No se pudo actualizar el protocolo. Inténtelo de nuevo.", "error");
                }
            });
        });
    });

    // Duplicar Protocolo
    $('#duplicarProt').on('click', function () {
        $('#tituloDuplicarProt').text('DUPLICAR PROTOCOLO');
        $('#modalDuplicarProt').modal('show');
    });

    $('#modalDuplicarProt').on('hidden.bs.modal', function () {
        $('#sduplicarTipo').val('');
        $('#sduplicarProt').val('');
        $('#sduplicarEquipo').val('');
        $('#sduplicarNewProt').val('');
    });

    $('#sduplicarTipo').on('change', function (){
        const tipoId = $(this).val();
        
        $.post('tipoProt', { tipoProt: tipoId })
        .done(function(data) {
            $('#sduplicarProt').empty().append('<option value="" disabled selected>Seleccione una opción</option>');
            data.forEach(item => {
                $('#sduplicarProt').append(`<option value="${item.Id}">${item.Protocolo}</option>`);
            });
        })
        .fail(function(err) {
            console.error('Error en la solicitud:', err);
            swal("Error", "No se pudieron cargar los datos. Inténtelo de nuevo.", "error");
        });
    });

    $('#btnGuardarDuplicarProt').on('click', function() {
        const tipoId = $('#sduplicarTipo').val();
        const protId = $('#sduplicarProt').val();
        const equipoId = $('#sduplicarEquipo').val();
        const nuevoProt = $('#sduplicarNewProt').val();

        if (!tipoId || !protId || !equipoId || !nuevoProt) {
            swal("Error", "Por favor, selecciona y completa todos los campos.", "error");
            return;
        }

        swal({
            title: "¿Está seguro?",
            text: "Se va a duplicar el protocolo. Esta acción no se puede deshacer.",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Sí, duplicar",
            cancelButtonText: "Cancelar",
            closeOnConfirm: false,
        }, function (isConfirm) {
            if (!isConfirm) return;
            swal({
                title: "Creando protocolo",
                text: "Espere un momento por favor...",
                imageUrl: "/img/Spinner-1s-200px2.gif",
                showConfirmButton: false,
                allowOutsideClick: false
            });

            $.post('/duplicarProt', { tipoprotocolo: tipoId, tipoe: equipoId, protdup: protId, protocolo: nuevoProt })
            .done(function(response) {
                $('#modalDuplicarProt').modal('hide');
                swal("Éxito", response.message, "success");
            })
            .fail(function(err) {
                swal.close();
                console.error('Error en la solicitud:', err);
                swal("Error", "No se pudo duplicar el protocolo. Inténtelo de nuevo.", "error");
            });
        });
    });

    // Crear protocolo modal
    $('#nuevoProt').on('click', function () {
        $('#tituloCrearProt').text('NUEVO PROTOCOLO');
        $('#modalCrearProt').modal('show');
    });

    // Nuevo protcolo funcionamiento
    $('#modalCrearProt').on('shown.bs.modal', async function () {
        // Cargar tiposRespuesta desde el backend
        let tiposRespuesta = [];
        try {
            tiposRespuesta = await $.get('/tipoRespuesta');
            window.tiposRespuesta = tiposRespuesta; // Guardar global para reutilizar
        } catch (err) {
            tiposRespuesta = [{Id: 1, Descripcion: 'Texto'}, {Id: 2, Descripcion: 'Numérico'}];
        }

        // Inicializa estructura vacía
        $('#nuevoProtEstructura').html(`
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <ul class="nav nav-tabs" id="crearProtTabs" role="tablist"></ul>
                <div style="display:flex; gap:12px;">
                    <i id="btnCrearAgregarCapitulo" class="fa fa-plus-circle text-success" 
                        style="cursor:pointer; font-size:25px;" 
                        title="Agregar capítulo"></i>
                    <i id="btnCrearEliminarCapitulo" class="fa fa-trash text-danger" 
                        style="cursor:pointer; font-size:25px; display:none;" 
                        title="Eliminar capítulo"></i>
                </div>
            </div>
            <div class="tab-content" id="crearProtTabsContent"></div>
        `);
        // Agregar capítulo
        $(document).off('click', '#btnCrearAgregarCapitulo').on('click', '#btnCrearAgregarCapitulo', function () {
            const newIndex = $('#crearProtTabs li').length;
            const newTabId = `crear-tab-${newIndex}`;
            const newCapName = "Nuevo Capítulo";

            $('#crearProtTabs').append(`
                <li role="presentation">
                    <a href="#${newTabId}" role="tab" data-toggle="tab" class="editable editable-capitulo" data-capitulo="${newCapName}" data-id="">
                        ${newCapName}
                    </a>
                </li>`);
            $('#crearProtTabsContent').append(`
                <div class="tab-pane" id="${newTabId}" role="tabpanel" data-capitulo="${newCapName}" data-id="">
                    <div class="text-right" style="margin-bottom:10px;">
                        <i class="fa fa-plus-circle text-success crear-agregar-captura" 
                        style="cursor:pointer; font-size:18px;" 
                        data-tab="${newTabId}" 
                        title="Agregar captura"></i>
                    </div>
                    <div class="container-fluid">
                        <div class="row"></div>
                    </div>
                </div>`);

            $('#crearProtTabs li').removeClass('active');
            $('#crearProtTabsContent .tab-pane').removeClass('active');
            $(`#crearProtTabs a[href="#${newTabId}"]`).parent().addClass('active');
            $(`#${newTabId}`).addClass('active');
            actualizarBotonEliminarCrear();
        });

        function actualizarBotonEliminarCrear() {
            const activeTab = $('#crearProtTabs li.active a');
            if (activeTab.length) {
                $('#btnCrearEliminarCapitulo').show();
            } else {
                $('#btnCrearEliminarCapitulo').hide();
            }
        }

        $(document).off('click', '#crearProtTabs a').on('click', '#crearProtTabs a', function (e) {
            e.preventDefault();
            const target = $(this).attr('href');
            $('#crearProtTabs li').removeClass('active');
            $(this).parent().addClass('active');
            $('#crearProtTabsContent .tab-pane').removeClass('active');
            $(target).addClass('active');
            actualizarBotonEliminarCrear();
        });

        $(document).off('click', '#btnCrearEliminarCapitulo').on('click', '#btnCrearEliminarCapitulo', function () {
            const activeTab = $('#crearProtTabs li.active a');
            if (!activeTab.length) return;

            const tabId = activeTab.attr('href');
            activeTab.parent().remove();
            $(tabId).remove();

            // Activar el primer capítulo si existe
            $('#crearProtTabs li:first').addClass('active');
            $('#crearProtTabsContent .tab-pane:first').addClass('active');
            actualizarBotonEliminarCrear();
            reordenarCrearProt();
        });

        // Agregar captura
        $(document).off('click', '.crear-agregar-captura').on('click', '.crear-agregar-captura', function () {
            const tabId = $(this).data('tab');
            const newCapturaName = "Nueva Captura";
            // Puedes reutilizar tiposRespuesta si lo tienes global
            const tiposRespuesta = window.tiposRespuesta || [{Id: 1, Descripcion: 'Texto'}, {Id: 2, Descripcion: 'Numérico'}];

            const html = `
                <div class="col-md-6 form-group m-t-2" style="margin-bottom:15px;">
                    <div class="label-wrapper" style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                        <label class="form-label editable editable-captura" style="margin:0; flex:1;" data-id="">${newCapturaName}</label>
                        <input type="checkbox" title="Obligatorio">
                        <i class="fa fa-trash text-danger eliminar-captura" style="cursor:pointer; margin-left:8px;" title:"Eliminar captura"></i>
                    </div>
                    <select class="form-control">
                        ${tiposRespuesta.map(opt => `
                            <option value="${opt.Id}">${opt.Descripcion}</option>`).join('')}
                    </select>
                </div>`;
            $(`#${tabId} .row`).append(html);
        });

        // Eliminar captura
        $(document).off('click', '#nuevoProtEstructura .eliminar-captura').on('click', '#nuevoProtEstructura .eliminar-captura', function () {
            $(this).closest('.form-group').remove();
        });

        // Edición en línea de capítulos y capturas
        $(document).off('dblclick', '#nuevoProtEstructura .editable').on('dblclick', '#nuevoProtEstructura .editable', function () {
            const $this = $(this);
            if ($this.find('input').length) return;
            const currentText = $this.text().trim();

            // Hereda estilos y dimensiones de la pestaña
            const width = $this.outerWidth();
            const height = $this.outerHeight();
            const fontSize = $this.css('font-size');
            const fontWeight = $this.css('font-weight');
            const textAlign = $this.css('text-align');
            const background = $this.css('background-color');
            const color = $this.css('color');

            // Crear input que se integra visualmente
            const input = $(`
                <input type="text"
                    class="form-control input-sm"
                    value="${currentText}"
                    style="
                        width: ${width}px;
                        height: ${height}px;
                        font-size: ${fontSize};
                        font-weight: ${fontWeight};
                        text-align: ${textAlign};
                        background: ${background};
                        color: ${color};
                        border: none;
                        outline: 2px solid #ffd700;
                        border-radius: 4px;
                        margin: 0;
                        box-sizing: border-box;
                        padding: 0 8px;
                    ">
            `);

            $this.empty().append(input);
            input.focus();
            input.select();

            input.on('blur keydown', function (e) {
                if (e.type === 'blur' || e.key === 'Enter') {
                    const newText = $(this).val().trim() || currentText;
                    $this.text(newText);
                }
            });
        });

    });

    function reordenarCrearProt() {
        // Renumerar capítulos
        $('#crearProtTabs li a').each(function(index) {
            const nuevoNum = index + 1;
            const $this = $(this);
            $this.data("id", nuevoNum); // actualiza correlativo
            const tabId = $this.attr("href");
            $(tabId).attr("data-id", nuevoNum);
        });

        // Renumerar capturas dentro de cada capítulo
        $('#crearProtTabsContent .tab-pane').each(function() {
            $(this).find('.form-group').each(function(i) {
                const nuevoNum = i + 1;
                const $label = $(this).find('label.form-label');
                $label.data("id", nuevoNum); // actualiza correlativo
            });
        });
    }

    $('#modalCrearProt').on('hidden.bs.modal', function () {
        $('#nTipoProt').val('');
        $('#nTipoEquipo').val('');
        $('#nNewProt').val('');
    });

    // Guardar nuevo protocolo
    $('#btnCrearProt').on('click', function () {
        const tipoProt = $('#nTipoProt').val();
        const tipoEquipo = $('#nTipoEquipo').val();
        const nombreProt = $('#nNewProt').val().trim();

        if (!tipoProt || !tipoEquipo || !nombreProt) {
            swal("Error", "Completa todos los campos obligatorios.", "error");
            return;
        }

        // Recopilar capítulos y capturas
        const capitulos = [];
        $('#crearProtTabsContent .tab-pane').each(function(indexCap) {
            const tabId = $(this).attr('id');
            const $tab = $(`#crearProtTabs a[href="#${tabId}"]`);
            const capDescripcion = $tab.text().trim();
            const capturas = [];
            $(this).find('.form-group').each(function(i) {
                const $label = $(this).find('label.form-label');
                const descripcion = $label.text().trim();
                const tipoRespuesta = $(this).find('select').val();
                const obligatorio = $(this).find('input[type="checkbox"]').is(':checked');
                capturas.push({
                    orden: i + 1,
                    descripcion,
                    tipoRespuesta,
                    obligatorio
                });
            });
            capitulos.push({
                orden: indexCap + 1,
                descripcion: capDescripcion,
                capturas
            });
        });

        // Validación
        if (capitulos.length === 0) {
            swal("Error", "Agrega al menos un capítulo.", "error");
            return;
        }

        swal({
            title: "¿Está seguro?",
            text: "Se va a crear el nuevo protocolo.",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Sí, crear",
            cancelButtonText: "Cancelar",
            closeOnConfirm: false,
        }, function (isConfirm) {
            if (!isConfirm) return;
            swal({
                title: "Creando protocolo",
                text: "Espere un momento por favor...",
                imageUrl: "/img/Spinner-1s-200px2.gif",
                showConfirmButton: false,
                allowOutsideClick: false
            });

            $.ajax({
                url: '/crearProtocolo',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    tipoProt,
                    tipoEquipo,
                    nombreProt,
                    capitulos
                }),
                success: function(response) {
                    $('#modalCrearProt').modal('hide');
                    swal("Éxito", response.message, "success");
                },
                error: function(err) {
                    swal.close();
                    console.error('Error en la solicitud:', err);
                    swal("Error", "No se pudo crear el protocolo. Inténtelo de nuevo.", "error");
                }
            });
        });
    });

});
