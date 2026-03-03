const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole } = require('../lib/rol');
const iconv = require('iconv-lite');
const moment = require('moment');

// Gestión de hallazgos

router.get("/hallazgos", isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const act_tarea_detalle = await pool.query('call sp_ActualizarTareaDetalle();');  
    const fecha_anio = await pool.query("SELECT\n" +
        "    YEAR(Fecha) AS Anio,\n" +
        "    COUNT(*) AS Cantidad\n" +
        "FROM\n" +
        "    Tareas\n" +
        "GROUP BY\n" +
        "    YEAR(Fecha)\n" +
        "ORDER BY\n" +
        "    Anio");
    
    res.render("hallazgos/hallazgos",{
        fecha_anio: fecha_anio

    });
});

router.get('/fuente_mesg/:year', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor', 'Operaciones']), async (req, res) => {
  const year = req.params.year;

  const meses = await pool.query("SELECT\n" +
  "    MONTH(Fecha) AS Mes,\n" +
  "    COUNT(*) AS Cantidad\n" +
  "FROM\n" +
  "    Tareas\n" +
  "WHERE YEAR(Fecha) = ?\n" +
  "GROUP BY\n" +
  "    MONTH(Fecha)\n" +
  "ORDER BY\n" +
  "    Mes;", [year]);

  const mesesArray = meses.map(mes => mes.Mes);

  res.json(mesesArray);
});

router.post('/ver_tareas_hallazgos', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const { date3, date4, tarea } = req.body;
    try {

    if (date3 > 0 & date4 === '' & tarea === '') {

        const primero = new Date(date3);
        const fechaInicial = primero.toISOString().slice(0, 10);

        const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

        const gAno = await pool.query(`
            SELECT
                T.Id IdTarea,
                H.Hallazgo Hallazgo,
                DATE_FORMAT( T.Fecha, '%d-%m-%Y' ) FechaTarea,
                T.Id_Estado ID_EstadoTarea,
                E.Codigo EquipoCodigoTAG,
                E.Tag_DMH EquipoTagDMH,
                EST.Id EstadoId,
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
                TD.tdet_Observaciones_Estado AS tdet_Observaciones_Estado 
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
                INNER JOIN Hallazgos H ON H.Id_Tarea = T.Id
            WHERE
                T.Fecha BETWEEN (
                SELECT
                DATE_FORMAT( ?, '%Y-01-01' )) 
                AND (
                SELECT
                    LAST_DAY(
                    DATE_FORMAT( ?, '%Y-12-01' ))) 
                AND EST.Id IN (4, 5) 
                AND TD.tdet_Estado_Equipo != 'SOP'   
            ORDER BY
                T.Id ASC;

            `, [fechaInicial, fechaInicial]
        );  

        if (!gAno) {
            res.json({ title: "Sin Información." });
        } else {
            const decodedData = gAno.map(row => {
                return {
                ...row,
                EstadoOperEquipoObs: row.tdet_Observaciones_Estado 
                    ? iconv.decode(Buffer.from(row.tdet_Observaciones_Estado , 'latin1'), 'utf8')
                    : null,
                };
            });
            res.json(decodedData);
        }

    } else if (date3 > 0 & date4 > 0 & tarea === '') {

        const primero = new Date(date3, date4 - 1, 1);
        const fechaInicial = primero.toISOString().slice(0, 10);

        const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

        const gAnoMes = await pool.query(`
            SELECT
                T.Id IdTarea,
                H.Hallazgo Hallazgo,
                DATE_FORMAT( T.Fecha, '%d-%m-%Y' ) FechaTarea,
                T.Id_Estado ID_EstadoTarea,
                E.Codigo EquipoCodigoTAG,
                E.Tag_DMH EquipoTagDMH,
                EST.Descripcion EstadoDesc,
                EST.Id EstadoId,
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
                TD.tdet_Fecha_TareaAnterior,#CONVERT ( cast( CONVERT ( TD.tdet_Observaciones_Estado USING latin1 ) AS CHAR CHARSET BINARY ) USING utf8 ) AS tdet_Observaciones_Estado
                TD.tdet_Observaciones_Estado AS tdet_Observaciones_Estado 
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
                INNER JOIN Hallazgos H ON H.Id_Tarea = T.Id
            WHERE
                T.Fecha BETWEEN (
                SELECT
                DATE_FORMAT( ?, '%Y-%m-01' )) 
                AND (
                SELECT
                    LAST_DAY(
                    DATE_FORMAT(?, '%Y-%m-01' ))) 
                AND EST.Id IN (4, 5) 
                AND TD.tdet_Estado_Equipo != 'SOP' 
            ORDER BY
                T.Id ASC;`, 
            [fechaInicial, fechaInicial]
        );

        if (!gAnoMes) {
            res.json({ title: "Sin Información." });
        } else {
            const decodedData = gAnoMes.map(row => {
                return {
                ...row,
                EstadoOperEquipoObs: row.tdet_Observaciones_Estado 
                    ? iconv.decode(Buffer.from(row.tdet_Observaciones_Estado , 'latin1'), 'utf8').replace(/�/g, 'ñ')
                    : null,
                };
            });
            res.json(decodedData);
        }

    } else if (date3 === '' & date4 === '' & tarea > 0) {

        const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

        const gTarea = await pool.query(`
            SELECT
                T.Id IdTarea,
                H.Hallazgo Hallazgo,
                DATE_FORMAT( T.Fecha, '%d-%m-%Y' ) FechaTarea,
                T.Id_Estado ID_EstadoTarea,
                E.Codigo EquipoCodigoTAG,
                E.Tag_DMH EquipoTagDMH,
                EST.Descripcion EstadoDesc,
                EST.Id EstadoId,
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
                TD.tdet_Fecha_TareaAnterior,#CONVERT ( cast( CONVERT ( TD.tdet_Observaciones_Estado USING latin1 ) AS CHAR CHARSET BINARY ) USING utf8 ) AS tdet_Observaciones_Estado
                TD.tdet_Observaciones_Estado AS tdet_Observaciones_Estado 
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
                INNER JOIN Hallazgos H ON H.Id_Tarea = T.Id
            WHERE
                T.Id = ?
                AND EST.Id IN ( 4, 5 ) 
                AND TD.tdet_Estado_Equipo != 'SOP';
            `, [tarea]
        );

        if (!gTarea) {
        res.json({ title: "Sin Información." });
        } else {
        const decodedData = gTarea.map(row => {
            return {
            ...row,
            EstadoOperEquipoObs: row.tdet_Observaciones_Estado 
                ? iconv.decode(Buffer.from(row.tdet_Observaciones_Estado , 'latin1'), 'utf8').replace(/�/g, 'ñ')
                : null,
            };
        });
        res.json(decodedData);
        }

    }

    } catch (error) {
    console.log(error);
    }
});

router.get('/ver_hallazgo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {idTarea} = req.query;

    try {
        const hTarea =  await pool.query(`
            SELECT 
                Hallazgo,
                Vulnerabilidad,
                Plan_Accion,
                Responsable,
                DATE_FORMAT(Fecha_Compromiso, '%d/%m/%Y') AS Fecha_Compromiso 
            FROM Hallazgos 
            WHERE Id_Tarea = ?;`, 
            [idTarea]
        );

        if (hTarea.length > 0) {
            res.json(hTarea[0]);
        } else {
            res.json({ title: "Sin Información." });
        }
    } catch (error) {
        console.log(error);
    }
});

router.post('/guardar_hallazgo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { hallazgo, vulnerabilidad, plan, responsable, fecha, idTarea } = req.body;

    let hfecha;

    if(fecha === ''){
        hfecha = null;
    } else {
        hfecha = fecha;
    }

    try {
        const hTarea = await pool.query(`
            UPDATE Hallazgos SET Hallazgo = ?, Vulnerabilidad = ?, Plan_Accion = ?, Responsable = ?, Fecha_Compromiso = ?
            WHERE Id_Tarea = ?;`, 
            [hallazgo, vulnerabilidad, plan, responsable, hfecha, idTarea]
        );

        if (hTarea.affectedRows > 0) {
            res.json({ title: "Hallazgo actualizado." });
        } else {
            res.json({ title: "Sin Información." });
        }
    } catch (error) {
        console.log(error);
    }
});

router.post('/actualizar_hallazgo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { hallazgo, vulnerabilidad, plan, responsable, fecha, idTarea } = req.body;
    try {

        let hfecha;

        if(fecha === ''){
            hfecha = null;
        } else {
            hfecha = fecha;
        }

        const hTarea = await pool.query(`
            UPDATE Hallazgos SET Hallazgo = ?, Vulnerabilidad = ?, Plan_Accion = ?, Responsable = ?, Fecha_Compromiso = ?
            WHERE Id_Tarea = ?;`, 
            [hallazgo, vulnerabilidad, plan, responsable, hfecha, idTarea]
        );

        if (hTarea.affectedRows > 0) {
            res.json({ title: "Hallazgo actualizado." });
        } else {
            res.json({ title: "Sin Información." });
        }
    } catch (error) {
        console.log(error);
    }
});

router.post('/eliminar_hallazgo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { idTarea } = req.body;
    try {
        const hTarea = await pool.query(`
            UPDATE Hallazgos SET Hallazgo = null, Vulnerabilidad = null, Plan_Accion = null, Responsable = null, Fecha_Compromiso = null
            WHERE Id_Tarea = ?;`, 
            [idTarea]
        );

        if (hTarea.affectedRows > 0) {
            res.json({ title: "Hallazgo eliminado." });
        } else {
            res.json({ title: "Sin Información." });
        }
    } catch (error) {
        console.log(error);
    }
});

// Lista de Hallazgos

router.get("/lista_hallazgos", isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const act_tarea_detalle = await pool.query('call sp_ActualizarTareaDetalle();');  
    const fecha_anio = await pool.query("SELECT\n" +
        "    YEAR(Fecha) AS Anio,\n" +
        "    COUNT(*) AS Cantidad\n" +
        "FROM\n" +
        "    Tareas\n" +
        "GROUP BY\n" +
        "    YEAR(Fecha)\n" +
        "ORDER BY\n" +
        "    Anio");
    
    res.render("hallazgos/lista_hallazgos",{
        fecha_anio: fecha_anio
    });
});

router.post('/ver_lista_hallazgos', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const { date3, date4, tarea } = req.body;
    try {

    if (date3 > 0 & date4 === '' & tarea === '') {

        const primero = new Date(date3);
        const fechaInicial = primero.toISOString().slice(0, 10);

        const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

        const gAno = await pool.query(`
            SELECT
                T.Id IdTarea,
                DATE_FORMAT( T.Fecha, '%d-%m-%Y' ) FechaTarea,
                E.Codigo EquipoCodigoTAG,
                E.Tag_DMH EquipoTagDMH,
                S.Descripcion SectorDesc,
                A.Descripcion AreaDesc,
                G.Descripcion GerenciaDesc,
                H.Hallazgo Hallazgo,
                H.Plan_Accion Plan_Accion,
                H.Vulnerabilidad Vulnerabilidad,
                H.Responsable Responsable,
                DATE_FORMAT( H.Fecha_Compromiso, '%d-%m-%Y' ) Fecha_Compromiso
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
                INNER JOIN Hallazgos H ON H.Id_Tarea = T.Id
            WHERE
                T.Fecha BETWEEN (
                SELECT
                DATE_FORMAT( ?, '%Y-01-01' )) 
                AND (
                SELECT
                    LAST_DAY(
                    DATE_FORMAT( ?, '%Y-12-01' ))) 
                AND H.Hallazgo IS NOT NULL
            ORDER BY
                T.Id ASC;

            `, [fechaInicial, fechaInicial]
        );  

        if (!gAno) {
            res.json({ title: "Sin Información." });
        } else {
            const decodedData = gAno.map(row => {
                return {
                ...row,
                EstadoOperEquipoObs: row.EstadoOperEquipoObs
                    ? iconv.decode(Buffer.from(row.EstadoOperEquipoObs, 'latin1'), 'utf8').replace(/�/g, 'ñ')
                    : null,
                };
            });
            res.json(decodedData);
        }

    } else if (date3 > 0 & date4 > 0 & tarea === '') {

        const primero = new Date(date3, date4 - 1, 1);
        const fechaInicial = primero.toISOString().slice(0, 10);

        const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

        const gAnoMes = await pool.query(`
            SELECT
                T.Id IdTarea,
                DATE_FORMAT( T.Fecha, '%d-%m-%Y' ) FechaTarea,
                E.Codigo EquipoCodigoTAG,
                E.Tag_DMH EquipoTagDMH,
                S.Descripcion SectorDesc,
                A.Descripcion AreaDesc,
                G.Descripcion GerenciaDesc,
                H.Hallazgo Hallazgo,
                H.Plan_Accion Plan_Accion,
                H.Vulnerabilidad Vulnerabilidad,
                H.Responsable Responsable,
                DATE_FORMAT( H.Fecha_Compromiso, '%d-%m-%Y' ) Fecha_Compromiso
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
                INNER JOIN Hallazgos H ON H.Id_Tarea = T.Id
            WHERE
                T.Fecha BETWEEN (
                SELECT
                DATE_FORMAT( ?, '%Y-%m-01' )) 
                AND (
                SELECT
                    LAST_DAY(
                    DATE_FORMAT(?, '%Y-%m-01' ))) 
                AND H.Hallazgo IS NOT NULL
            ORDER BY
                T.Id ASC;`, 
            [fechaInicial, fechaInicial]
        );

        if (!gAnoMes) {
            res.json({ title: "Sin Información." });
        } else {
            const decodedData = gAnoMes.map(row => {
                return {
                ...row,
                EstadoOperEquipoObs: row.EstadoOperEquipoObs
                    ? iconv.decode(Buffer.from(row.EstadoOperEquipoObs, 'latin1'), 'utf8').replace(/�/g, 'ñ')
                    : null,
                };
            });
            res.json(decodedData);
        }

    } else if (date3 === '' & date4 === '' & tarea > 0) {

        const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

        const gTarea = await pool.query(`
          SELECT
                T.Id IdTarea,
                DATE_FORMAT( T.Fecha, '%d-%m-%Y' ) FechaTarea,
                E.Codigo EquipoCodigoTAG,
                E.Tag_DMH EquipoTagDMH,
                S.Descripcion SectorDesc,
                A.Descripcion AreaDesc,
                G.Descripcion GerenciaDesc,
                H.Hallazgo Hallazgo,
                H.Plan_Accion Plan_Accion,
                H.Vulnerabilidad Vulnerabilidad,
                H.Responsable Responsable,
                DATE_FORMAT( H.Fecha_Compromiso, '%d-%m-%Y' ) Fecha_Compromiso
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
                INNER JOIN Hallazgos H ON H.Id_Tarea = T.Id 
            WHERE
                T.Id = ? 
                AND H.Hallazgo IS NOT NULL;
            `, [tarea]
        );

        console.log(gTarea);

        if (!gTarea) {
        res.json({ title: "Sin Información." });
        } else {
        const decodedData = gTarea.map(row => {
            return {
            ...row,
            EstadoOperEquipoObs: row.EstadoOperEquipoObs
                ? iconv.decode(Buffer.from(row.EstadoOperEquipoObs, 'latin1'), 'utf8').replace(/�/g, 'ñ')
                : null,
            };
        });
        res.json(decodedData);
        }

    }

    } catch (error) {
    console.log(error);
    }
});

// Gestión de ubicaciones

router.get("/ubicacion", isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {
        const ubicacion = await pool.query(`
            SELECT
                * 
            FROM
                Ubicaciones
            WHERE
                Activo= 1;	
            `
        );

        const estados = await pool.query(`
            SELECT
                * 
            FROM
                Ubicaciones_Estado
            `
        );


        res.render("hallazgos/ubicacion", {
            ubicacion: ubicacion,
            estados: estados
        }); 

  
    } catch (error) {
        console.log(error);
    }
});

router.post('/guardar_ubicacion', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    console.log(req.body);
    const { ubicacion, latitud, longitud } = req.body;

    try {
        
        const guardarCorrea = await pool.query(`
            INSERT INTO Ubicaciones (Ubicacion, Latitud, Longitud, Activo)
            VALUES (?, ?, ?, 1);`, 
            [ubicacion, latitud, longitud]
        );

        if (guardarCorrea.affectedRows > 0) {
            res.json({ success: true });
        } 

    } catch (error) {
        console.log(error);
    }
});

router.post('/actualizar_ubicacion', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { id, ubicacion, latitud, longitud } = req.body;

    try {
        
        const actualizarCorrea = await pool.query(`
            UPDATE Ubicaciones SET Ubicacion = ?, Latitud = ?, Longitud = ?
            WHERE Id = ?;`, 
            [ubicacion, latitud, longitud, id]
        );

        if (actualizarCorrea.affectedRows > 0) {
            res.json({ success: true });
        } 

    } catch (error) {
        console.log(error);
    }
});

router.post('/eliminar_ubicacion', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { id } = req.body;

    try {
        
        const eliminarCorrea = await pool.query(`
            UPDATE Ubicaciones SET Activo = 0
            WHERE Id = ?;`, 
            [id]
        );

        if (eliminarCorrea.affectedRows > 0) {
            res.json({ success: true });
        } 

    } catch (error) {
        console.log(error);
    }
});

 // Gestión de estados

router.post("/guardar_estado", isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { estado } = req.body;

    try {
        
        const guardarEstado = await pool.query(`
            INSERT INTO Ubicaciones_Estado (Estado)
            VALUES (?);`, 
            [estado]
        );

        if (guardarEstado.affectedRows > 0) {
            res.json({ success: true });
        } 

    } catch (error) {
        console.log(error);
    }
});

router.post('/actualizar_estado', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { id, estado} = req.body;

    try {

        const actualizarEstado = await pool.query(`
            UPDATE Ubicaciones_Estado SET Estado = ?
            WHERE Id = ?;`, 
            [estado, id]
        );

        if (actualizarEstado.affectedRows > 0) {
            res.json({ success: true });
        } 
        
    } catch (error) {
        console.log(error);
    }

});

router.post('/eliminar_estado', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {id} = req.body;

    try {
        
        const eliminarEstado = await pool.query(`
            DELETE FROM Ubicaciones_Estado
            WHERE Id = ?;`, 
            [id]
        );

        if (eliminarEstado.affectedRows > 0) {
            res.json({ success: true });
        }

    } catch (error) {
        console.log(error);
    }
});

 // Lista ubicaciones

router.get("/ubicacion_lista", isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => { 
    const fecha_anio = await pool.query("SELECT\n" +
        "    YEAR(Fecha) AS Anio,\n" +
        "    COUNT(*) AS Cantidad\n" +
        "FROM\n" +
        "    Tareas\n" +
        "GROUP BY\n" +
        "    YEAR(Fecha)\n" +
        "ORDER BY\n" +
        "    Anio");

    res.render("hallazgos/lista_ubicaciones",{
        fecha_anio: fecha_anio
    });
});

router.post('/buscar_ubicaciones', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { ano, mes } = req.body;

    try {
        const fechaInicio = moment(`${ano}/${mes}/01`, 'YYYY/MM/DD').startOf('day').format('YYYY-MM-DD');

        
        const ubicaciones = await pool.query(`
            SELECT
                C.Id AS Id,
                C.Ubicacion AS Ubicacion,
                U.Fecha AS Fecha,
                U.Observacion AS Observacion,
                E.Estado AS Estado
            FROM
                Ubicaciones C
                    LEFT JOIN Ubicaciones_Informacion U ON U.Id_Ubicacion = C.Id AND U.Fecha = ?
                    LEFT JOIN Ubicaciones_Estado E ON E.Id =  U.Id_Estado
            WHERE C.Activo = 1;
            `, [fechaInicio]
        );   
        
        const estados = await pool.query(`
            SELECT
                Id,
                Estado 
            FROM
                Ubicaciones_Estado
            `
        );  

        if (!ubicaciones) {
            res.json({ title: "Sin Información." });
        }else{
            res.json({ubicaciones:ubicaciones, estados:estados});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: 'Error al buscar ubicaciones' });
    }
});

router.post('/actualizar_ubicaciones', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {data} = req.body;
    try {

        for (const item of data) {
            const { Id, Fecha, Estado, Observacion } = item;
            const fechaFormateada = moment(Fecha).format('YYYY-MM-DD');

            const comprobar = await pool.query(`
                SELECT COUNT(*) AS count FROM Ubicaciones_Informacion WHERE Id_Ubicacion = ? AND Fecha = ?;`,
                [Id, fechaFormateada]
            );

            const count = comprobar[0].count;
            if (count > 0) {
                await pool.query(`
                    UPDATE Ubicaciones_Informacion SET Id_Estado = ?, Observacion = ? WHERE Id_Ubicacion = ? AND Fecha = ?;`,
                    [Estado, Observacion, Id, fechaFormateada]
                );
            } else {
                await pool.query(`
                    INSERT INTO Ubicaciones_Informacion (Id_Ubicacion, Fecha, Id_Estado, Observacion) VALUES (?, ?, ?, ?);`,
                    [Id, fechaFormateada, Estado, Observacion]
                );
            }
        }
        res.json({ success: true, mensaje: 'Información actualizada correctamente' });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: 'Error al actualizar ubicaciones' });
    }
});

module.exports = router;