const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { isLoggedIn } = require('../../lib/auth');
const { authRole } = require('../../lib/rol');
const nodemailer = require('nodemailer');
const hbs = require("handlebars");
const fs = require("fs");
const path = require("path"); 
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const moment = require('moment');
const multer = require('multer');
const upload = multer();
const iconv = require('iconv-lite');

const correo = "notificaciones.sapma@sercoing.cl";
const pass = "zB8+]0W$o&6{#Jl)O.";

const transporter = nodemailer.createTransport({
    host: "mail.sercoing.cl",
    port: 587,
    secure: false,
    auth: {
        user: correo,
        pass: pass,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Modulo de Reparaciones
router.get('/tareas_reparacion', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
    
    const fecha_anio = await pool.query(`
        SELECT
            YEAR(Fecha) AS Anio,
            COUNT(*) AS Cantidad
        FROM
            Tareas
        GROUP BY
            YEAR(Fecha)
        ORDER BY
            Anio
    `);

    res.render('reparaciones/tareas_reparacion', { fecha_anio });
});

router.post('/buscar_reparaciones', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
    
    try {

        const tt = '';
        const { year, month } = req.body;
        const primero = new Date(year, month - 1, 1);
        const fechaInicial = primero.toISOString().slice(0, 10);

        const tareas = await pool.query("CALL sp_TareasFull ('REPARACIONES', NULL, ? , NULL , null, ? , NULL, NULL, NULL );", [fechaInicial, tt]);

        if (!tareas) {
                res.json({ title: "Sin Información." });
            } else {
            const decodedData = tareas[0].map(row => {
                return {
                ...row,
                EstadoOperEquipoObs: row.EstadoOperEquipoObs
                    ? iconv.decode(Buffer.from(row.EstadoOperEquipoObs, 'latin1'), 'utf8').replace(/�/g, 'ñ')
                    : null,
                };
            });
            res.json(decodedData);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al buscar tareas' });
    }

});

// Verficicacion de tareas - equipos
router.post('/verificacionEquipos', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
    try {

        let tareas = req.body.Tareas;

        if (typeof tareas === 'string') {
            tareas = JSON.parse(tareas);
        }

        const tareasIds = tareas.map(t => t.Tarea);

        const consulta = await pool.query(`
            SELECT
                T.Id_Equipo AS ID_EQUIPO
            FROM
                Tareas T
            WHERE
            T.Id IN (?);`, [tareasIds]
        );
        
        const id_equipos = consulta.map(e => e.ID_EQUIPO);

        const comprobcacion = await pool.query(`
            SELECT
                E.Codigo
            FROM
                EquipoProtocolo EP
                INNER JOIN Equipos E ON E.Id =  EP.ep_id_equipo
            WHERE
                EP.ep_id_equipo IN (?)
                AND EP.ep_id_equipo NOT IN (SELECT ep_id_equipo FROM EquipoProtocolo WHERE ep_id_tipo_protocolo = 4)
            GROUP BY
                EP.ep_id_equipo;
            `, [id_equipos]
        );

        if (comprobcacion.length > 0) {
            const codigos = comprobcacion.map(c => c.Codigo);
            res.json({ success: false, codigos:codigos, message: 'Los siguientes equipos no tienen protocolo de reparación asignado: ' + codigos.join(', ') });
        } else {
            res.json({ success: true});
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al verificar equipos' });
    }
});

// Plantilla de polanificación
router.post('/plantilla_reparaciones', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), upload.single('file'), async (req, res) => {

    try {
        let tareas = req.body.Tareas;

        if (typeof tareas === 'string') {
            tareas = JSON.parse(tareas);
        }

        const tareasIds = tareas.map(t => t.Tarea);

        let equipos = [];

        const consulta = await pool.query(`
            SELECT
                T.Id AS TAREA_ORIGEN,
                E.Codigo AS TAG,
                E.Id AS ID_EQUIPO,
                TE.Descripcion AS TIPO_EQUIPO,
                G.Descripcion AS GERENCIA,
                A.Descripcion AS AREA,
                S.Descripcion AS SECTORES,
                CONVERT(
                    CAST(
                    CONVERT(
                        IF(
                        TD.tdet_Estado_Equipo = 'SC',
                        'No aplica',
                        IF(
                            TD.tdet_Estado_Equipo = 'SSR',
                            'Sistema sin revisar.',
                            IF(
                            TD.tdet_Estado_Equipo = 'SOP',
                            'Sistema operativo',
                            IF(
                                TD.tdet_Estado_Equipo = 'SOCO',
                                'Sist. operativo con obs.',
                                IF(TD.tdet_Estado_Equipo = 'SFS', 'Sist. fuera de serv.', IF(TD.tdet_Estado_Equipo = 'SNO', 'Sist. no operativo', TD.tdet_Estado_Equipo))
                            )
                            )
                        )
                        ) USING UTF8
                    ) AS BINARY
                    ) USING UTF8
                ) AS ESTADO_EQUIPO,
                TD.tdet_Observaciones_Estado AS OBSERVACION
            FROM
                Tareas T
                INNER JOIN Equipos E ON E.Id = T.Id_Equipo
                INNER JOIN Sectores S ON S.Id = E.Id_Sector
                INNER JOIN Areas A ON A.Id = S.Id_Area
                INNER JOIN Gerencias G ON G.Id = A.Id_Gerencia
                INNER JOIN TipoEquipo TE ON TE.Id = E.Id_Tipo
                INNER JOIN Tareas_Detalle TD ON TD.tdet_Id_Tarea = T.Id
            WHERE
            T.Id IN (?);`, [tareasIds]
        );

        if (!consulta) {
            res.json({ title: "Sin Información." });
        } else {
            equipos.push(...consulta)
        }

        const usuarios = await pool.query("SELECT Id AS ID, Login AS USUARIO FROM Usuarios WHERE Id_Cliente = 1 AND Id_Perfil = 3 AND NOT Login LIKE '%test%';");
        
        const tipo_protocolo = await pool.query("SELECT Id AS ID, Descripcion AS DESCRIPCION FROM TipoProtocolo WHERE Id = 4;");

        const protocolo = await pool.query(
            `
            SELECT
                EP.ep_id_equipo,
                EP.ep_id_tipo_protocolo,
                CONCAT(EP.ep_id_equipo, T.Descripcion),
                EP.ep_id_protocolo
            FROM
                EquipoProtocolo EP
                INNER JOIN TipoProtocolo T ON T.Id = EP.ep_id_tipo_protocolo
                WHERE EP.ep_id_tipo_protocolo = 4  
            ORDER BY
                EP.ep_id_equipo;
            `
        );

        const workbook = new ExcelJS.Workbook();
        
        await workbook.xlsx.readFile(path.resolve(__dirname, "../../plantillas/reparaciones.xlsx"));
        const worksheetEquipos = workbook.getWorksheet('EQUIPOS');
        const worksheetUsuarios = workbook.getWorksheet('USUARIOS');
        const worksheetTProtocolos = workbook.getWorksheet('TIPO_PROTOCOLO');
        const worksheetProtocolos = workbook.getWorksheet('PROTOCOLOS');
        const planSheet = workbook.getWorksheet('EQUIPOS');

        equipos.forEach((equipo, i) => {
            const fila = Object.values(equipo);
            const row = worksheetEquipos.getRow(i + 2); // fila 2 en adelante
            row.values = fila;
            row.commit(); // importante para aplicar los cambios
        });


        usuarios.forEach((usuario, index) => {
            const fila = Object.values(usuario);
            worksheetUsuarios.addRow(fila, index + 2);
        });

        tipo_protocolo.forEach((tipo_protocolo, index) => {
            const fila = Object.values(tipo_protocolo);
            worksheetTProtocolos.addRow(fila, index + 2);
        });

        protocolo.forEach((protocolo, index) => {
            const fila = Object.values(protocolo);
            worksheetProtocolos.addRow(fila, index + 2);
        });
        
        planSheet.dataValidations.add('L2:L22001', {
            type: 'list',
            allowBlank: true,
            formulae: ['=TIPO_PROTOCOLO!$B$2:$B$201'],
            showErrorMessage: true,
            errorStyle: 'error',
            error: 'Elija o escriba un valor de la lista',
        });

        planSheet.dataValidations.add('K2:K22001', {
            type: 'list',
            allowBlank: true,
            formulae: ['=USUARIOS!$B$2:$B$201'],
            showErrorMessage: true,
            errorStyle: 'error',
            error: 'Elija o escriba un valor de la lista',
        });

        planSheet.dataValidations.add('J2:J12001', {
            type: 'whole',           // sólo números enteros
            operator: 'between',     // entre…
            allowBlank: false,       // (o true si quieres permitir celdas vacías)
            formulae: ['1', '28'],   // …1 y 28 (inclusive)
            showErrorMessage: true,
            errorTitle: 'Entrada inválida',
            error: 'Debes ingresar un número entero entre 1 y 28.'
        });

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type',  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="planificacion_reparaciones.xlsx"');

        return res.send(buffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la plantilla.' });
    }
});

// Planificacion de reparaciones
router.post('/planificar_reparaciones', isLoggedIn, upload.single('file'), authRole(['Plan', 'Admincli', 'Supervisor']), async (req, res) => {
    console.log(req.body);

    const { year, month } = req.body;
    try {

        const mes = month.toString().padStart(2, '0');
        const fechaInicial = moment(`${year}-${mes}`, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
        const fechaFinal   = moment(`${year}-${mes}`, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');

        const workbook = XLSX.read(req.file.buffer);
        const sheet    = workbook.Sheets['CARGA'];

        const range = XLSX.utils.decode_range(sheet['!ref']);
        const data = [];

        for (let r = 1; r <= range.e.r; r++) {
            // Obligatorias
            const columna0 = sheet[XLSX.utils.encode_cell({ r, c: 0 })]?.v ?? null;
            const columna1 = sheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v ?? null;
            const columna2 = sheet[XLSX.utils.encode_cell({ r, c: 2 })]?.v ?? null;
            const columna5 = sheet[XLSX.utils.encode_cell({ r, c: 5 })]?.v ?? null;

            // Si alguna obligatoria está vacía, salta la fila
            if ([columna0, columna1, columna2, columna5].some(v => v === null || v === '')) {
                continue;
            }

            data.push({
                columna0,
                columna1,
                columna2,
                columna5
            });
        }

        const resultadosCiclo = [];

        const diasEnRango = moment(fechaFinal).diff(fechaInicial, 'days') + 1;

        for (let i = 0; i < diasEnRango; i++) {

            const fechaActual = moment(fechaInicial).add(i, 'days').format('YYYY-MM-DD');

            for (const fila of data) {

                const { columna0, columna1, columna2, columna5 } = fila;

                if (moment(fechaActual).date() === columna0) {

                    const resultado = {
                        Fecha: fechaActual,
                        Id_Tecnico: columna1,
                        Id_Equipo: columna2,
                        Id_Protocolo: columna5,
                        Contingente: 0,
                        Prueba: 0
                    };

                    resultadosCiclo.push(resultado);
                }
            }
        }

        // Leer hoja EQUIPOS
        const sheetEquipos = workbook.Sheets['EQUIPOS'];
        const rangeEquipos = XLSX.utils.decode_range(sheetEquipos['!ref']);

        const mapaEquipos = new Map(); // Id_Equipo -> Id_Tarea_Anterior

        for (let r = 1; r <= rangeEquipos.e.r; r++) {
            const idTareaAnterior = sheetEquipos[XLSX.utils.encode_cell({ r, c: 0 })]?.v ?? null;
            const idEquipo = sheetEquipos[XLSX.utils.encode_cell({ r, c: 2 })]?.v ?? null;

            if (idTareaAnterior && idEquipo) {
                mapaEquipos.set(idEquipo, idTareaAnterior);
            }
        }


        const insertIds = [];
        for (const fila of resultadosCiclo) {
            const id = await insertTarea(fila);
            insertIds.push(id);
        }


        // Crear relaciones para Tareas_Reparaciones
        const reparaciones = [];

        for (let i = 0; i < resultadosCiclo.length; i++) {
            const nuevaTareaId = insertIds[i];
            const idEquipo = resultadosCiclo[i].Id_Equipo;

            const idTareaAnterior = mapaEquipos.get(idEquipo);
            if (!idTareaAnterior) continue;

            reparaciones.push({
                Id_Tarea_Origen: idTareaAnterior,
                Id_Tarea_Nueva: nuevaTareaId
            });
        }

        // Insertar en Tareas_Reparaciones
        for (const rep of reparaciones) {
            await pool.query(
                'INSERT INTO Tareas_Reparaciones (Id_Tarea_Origen, Id_Tarea_Nueva) VALUES (?, ?)',
                [rep.Id_Tarea_Origen, rep.Id_Tarea_Nueva]
            );
        }

        // Crear un mapa: Id_Tarea_Nueva -> Id_Tarea_Anterior
        const mapaReparaciones = new Map();
        for (const rep of reparaciones) {
            mapaReparaciones.set(rep.Id_Tarea_Nueva, rep.Id_Tarea_Origen);
        }

        const tareas = await pool.query(`
            SELECT
                T.Id AS ID,
                DATE_FORMAT(T.Fecha, '%Y-%m-%d') AS FECHA,
                U.Descripcion AS TECNICO,
                E.Descripcion AS ESTADO,
                EQ.Codigo AS EQUIPO,
                TP.Descripcion AS TIPO,
                P.Descripcion AS PROTOCOLO
            FROM
                Tareas T
                INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico
                INNER JOIN Estados E ON E.Id = T.Id_Estado
                INNER JOIN Equipos EQ ON EQ.Id = T.Id_Equipo
                INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo 
                INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo
            WHERE
                T.Id IN (?)
            ORDER BY T.Fecha ASC;`, [insertIds]
        );

        const { usuario } = req.user;
        const { Id_Cliente } = req.user;

        for (const taskId of insertIds) {
            try {
                await new Promise((resolve, reject) => {
                    const updateQuery = 'UPDATE Tareas_Estado SET te_usuario = ?, te_metodo = ? WHERE te_Id_Tarea = ?';
                    pool.query(updateQuery, [usuario, 'M', taskId], (err, results) => {
                        if (err) {
                            console.error('Error al actualizar Tareas_Estado para taskId', taskId, err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (err) {
                // Puedes decidir si quieres detener todo o solo loguear y seguir
                console.error('No se pudo actualizar taskId:', taskId);
            }
        }

        var info = [];

        for (var i = 0; i < tareas.length; i++) {
            info.push({
                Tarea: tareas[i].ID,
                Fecha: tareas[i].FECHA,
                Técnico: tareas[i].TECNICO,
                Estado: tareas[i].ESTADO,
                TAG: tareas[i].EQUIPO,
                Tipo_de_Protocolo: tareas[i].TIPO,
                Protocolo: tareas[i].PROTOCOLO,
                Tarea_Origen: mapaReparaciones.get(tareas[i].ID) ?? '', 
                Creado_por: usuario
            });
        }


        var wb = XLSX.utils.book_new();
        var ws = XLSX.utils.json_to_sheet(info);

        var range1 = XLSX.utils.decode_range(ws['!ref']);
        var colWidths = [];
        for (var col = range1.s.c; col <= range1.e.c; col++) {
            var maxWidth = 0;
            for (var row = range1.s.r; row <= range1.e.r; row++) {
                var cell_address = { c: col, r: row };
                var cell_ref = XLSX.utils.encode_cell(cell_address);
                var cell = ws[cell_ref];
                if (cell) {
                    var cellValue = (cell.v != null) ? cell.v.toString() : '';
                    if (cellValue.length > maxWidth) {
                        maxWidth = cellValue.length;
                    }
                }
            }
            colWidths.push({ wch: maxWidth });
        }

        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws);

        var buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const datemail = new Date().toLocaleDateString('en-GB');
        const filePathName1 = path.resolve(__dirname, "../../views/email/tareas.hbs");
        const mensaje = fs.readFileSync(filePathName1, "utf8");
        const template = hbs.compile(mensaje);
        const context = {
            datemail,
        };
        const html = template(context);
        const email_plan = await pool.query(
            "SELECT\n" +
            "	U.Id,\n" +
            "	U.Email \n" +
            "FROM\n" +
            "	Usuarios U \n" +
            "WHERE\n" +
            "	U.Id_Perfil = 2 \n" +
            "	AND U.Id_Cliente = " +
            Id_Cliente +
            " \n" +
            "	AND U.Activo = 1;"
        );
        const { Email } = req.user;
        await transporter.sendMail({
            from: "SAPMA DRT <notificaciones@sercoing.cl>",
            // to: "marancibia@sercoing.cl",
            to: [email_plan, Email],
            bcc: "notificaciones.sapma@sercoing.cl",
            subject: "Tareas Creadas (Reparaciones)",
            html,
            attachments: [
                {
                    filename: "imagen1.png",
                    path: "./src/public/img/imagen1.png",
                    cid: "imagen1",

                },
                {
                    filename: 'tareas_reparación_' + datemail + '.xlsx',
                    content: buffer
                }
            ],
        });
        

        res.send("ok");

    } catch (error) {
        console.error('Error al procesar el archivo Excel', error);
        res.status(500).send("Error al procesar el archivo Excel");
    }

});

function insertTarea(resultado) {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO Tareas (Fecha, Id_Tecnico, Id_Equipo, Id_Protocolo, Contingente, Prueba) VALUES (?, ?, ?, ?, 0, 0)`;

        pool.query(query, [
            resultado.Fecha,
            resultado.Id_Tecnico,
            resultado.Id_Equipo,
            resultado.Id_Protocolo
        ], (error, results, fields) => {
            if (error) {
                console.error('Error al ejecutar la consulta de inserción', error);
                reject(error);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

//Reparaciones generales
router.get('/reparaciones_generales', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
    const fecha_anio = await pool.query(`
        SELECT
            YEAR(T.Fecha) AS Anio,
            COUNT(*) AS Cantidad
        FROM
            Tareas T
            INNER JOIN Tareas_Reparaciones TR ON TR.Id_Tarea_Nueva = T.Id
        WHERE 
            TR.Id_Tarea_Nueva IS NOT NULL
        GROUP BY
            YEAR(T.Fecha)
        ORDER BY
            Anio
        `
    );

    res.render('reparaciones/reparacionesGenerales', { fecha_anio: fecha_anio });
});

router.get('/mes_reparaciones/:year', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor', 'Operaciones']), async (req, res) => {
    const year = req.params.year;

    const meses = await pool.query(`
        SELECT
            MONTH(T.Fecha) AS Mes,
            COUNT(*) AS Cantidad
        FROM
            Tareas T
            INNER JOIN Tareas_Reparaciones TR ON TR.Id_Tarea_Nueva = T.Id
        WHERE
            YEAR(T.Fecha) = ?
            AND TR.Id_Tarea_Nueva IS NOT NULL
        GROUP BY
            MONTH(T.Fecha)
        ORDER BY
            Mes;
        `, [year]
    );

    const mesesArray = meses.map(mes => mes.Mes);

    res.json(mesesArray);
});

router.post('/general_reparaciones', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor', 'Operaciones']), async (req, res) => {
    try {

        const tt = '';
        const { year, month } = req.body;
        const primero = new Date(year, month - 1, 1);
        const fechaInicial = primero.toISOString().slice(0, 10);

        const tareas = await pool.query(`
            SELECT
                T.Id IdTarea,
                DATE_FORMAT(T.Fecha, '%e-%m-%Y') FechaTarea,
                T.Id_Estado ID_EstadoTarea,
                E.Codigo EquipoCodigoTAG,
                E.Tag_DMH EquipoTagDMH,
                EST.Descripcion EstadoDesc,
                S.Id SectorId,
                S.Descripcion SectorDesc,
                A.Id AreaId,
                A.Descripcion AreaDesc,
                G.Id GerenciaId,
                G.Descripcion GerenciaDesc,
                EG.eg_detalle_ubicacion DetalleUbicacion,
                TD.tdet_Estado_Equipo EstadoOperEquipo,
                TD.tdet_Repuestos Repuestos,
                VT.Val_obs ValidacionObservacion,
                VT.Val_respnombre ValidacionResponsable,
                TE.te_Estado_val EstadoValidacion,
                U.Id UsuarioId,
                U.Descripcion UsuarioDescripcion,
                TP.Descripcion TipoServicio,
                TD.tdet_Estado_EquipoAnterior,
                TD.tdet_Id_TareaAnterior,
                TD.tdet_Fecha_TareaAnterior,
                TD.tdet_Observaciones_Estado AS tdet_Observaciones_Estado,
                TR.Id_Tarea_Origen AS Tarea_Origen
            FROM
                Tareas T
                INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
                INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo
                INNER JOIN Estados EST ON EST.Id = T.Id_Estado
                INNER JOIN Equipos E ON E.Id = T.Id_Equipo
                INNER JOIN Sectores S ON S.Id = E.Id_Sector
                INNER JOIN Areas A ON A.Id = S.Id_Area
                INNER JOIN Gerencias G ON G.Id = A.Id_Gerencia
                INNER JOIN Equipos_General EG ON EG.eg_Id_equipo = E.Id
                LEFT JOIN Tareas_Detalle TD ON TD.tdet_Id_Tarea = T.Id
                LEFT JOIN Validacion_Tareas VT ON VT.Val_tarea_id = T.Id
                INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = T.Id
                INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico
                INNER JOIN Tareas_Reparaciones TR ON TR.Id_Tarea_Nueva = T.Id
            WHERE
                T.Fecha BETWEEN DATE_FORMAT(?, '%Y-%m-01')
                AND LAST_DAY(DATE_FORMAT(?, '%Y-%m-01'))
                AND U.Descripcion NOT LIKE ?
                AND TR.Id_Tarea_Nueva IS NOT NULL
            ORDER BY
                T.Id ASC;
            `, [fechaInicial, fechaInicial, tt]
        );

        if (!tareas) {
                res.json({ title: "Sin Información." });
            } else {
            const decodedData = tareas.map(row => {
                return {
                ...row,
                EstadoOperEquipoObs: row.EstadoOperEquipoObs
                    ? iconv.decode(Buffer.from(row.EstadoOperEquipoObs, 'latin1'), 'utf8').replace(/�/g, 'ñ')
                    : null,
                };
            });
            res.json(decodedData);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al buscar tareas' });
    }
});

module.exports = router;