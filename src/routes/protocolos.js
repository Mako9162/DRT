const express = require("express");
const router = express.Router();
const pool = require("../database");
const { isLoggedIn } = require("../lib/auth");
const { authRole, roles } = require("../lib/rol");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const pdf = require("dynamic-html-pdf");
global.ReadableStream = require('web-streams-polyfill').ReadableStream;
const puppeteer = require('puppeteer');
const fs = require("fs");
const path = require("path"); 
const request = require('request');
const XLSX = require('xlsx');
const hbs = require("handlebars");
const multer = require('multer');
const moment = require('moment-timezone');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/images'); 
    },
    filename: function (req, file, cb) {

        const tareaId = req.body.Id_Tarea;

        const extension = path.extname(file.originalname);
        const correlativo = req.fileCount || 0;
        req.fileCount = correlativo + 1;

        const fileName = `${tareaId}_${tareaId}_${correlativo}${extension}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage });

const updateDataStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/images'); 
    },
    filename: function (req, file, cb) {
        // Obtener Id_Tarea del primer elemento de inputs
        const inputs = JSON.parse(req.body.inputs || '[]');
        const tareaId = inputs.length > 0 ? inputs[0].Id_Tarea : 'default';
        // Usar el nombre original del archivo o el que viene del cliente
        const originalName = file.originalname;
        cb(null, `${tareaId}_${originalName}`);
    }
});

const uploadForUpdate = multer({ storage: updateDataStorage });

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

router.get("/protocolos", isLoggedIn,  async (req, res) => {
  res.render("protocolos/protocolos");
});

router.post("/protocoloss", isLoggedIn,  async (req, res) => {

  try {

    const { date1, date2, tarea, test } = req.body;

    let tt; 

    if (test === 'on') {
        tt = "%test"; 
    } else {
        tt = ''; 
    }

    if (tarea > 0) {

      const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

      // const pTarea = await pool.query("CALL sp_TareasFull ('PARA_VALIDAR_ID', ?, NULL , NULL , NULL , ? , NULL, NULL, NULL );",[tarea, tt]);

      const pTarea = await pool.query(`
            SELECT
            T.Id IdTarea,
            DATE_FORMAT(T.Fecha,'%e-%m-%Y') FechaTarea,
            T.Id_Estado ID_EstadoTarea,
            E.Codigo EquipoCodigoTAG,
            E.Tag_DMH Tag_DMH,
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
            TE.te_Obs_lider_turno Obs_lider
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
          WHERE
            U.Descripcion NOT LIKE ? 
            AND T.Id_Estado IN (5,6)
            AND TE.te_Estado_val = 0
            AND TE.te_Estado_val_lider_turno = 1
            AND T.Id = ?
          ORDER BY	T.Id ASC;
      `, [tt, tarea]);

      // console.log(pTarea);

      if(!pTarea){
        res.json({ title: "Sin Información." });
      }else{
        // res.json(pTarea[0]);
        res.json(pTarea);
      }

    }else{

      const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

      // const pRango = await pool.query("CALL sp_TareasFull ('PARA_VALIDAR_RANGO', NULL, NULL , ? , ? , ? , NULL, NULL, NULL );", [date1, date2, tt]);

      const pRango = await pool.query(`
        SELECT
          T.Id IdTarea,
          DATE_FORMAT(T.Fecha,'%e-%m-%Y') FechaTarea,
          T.Id_Estado ID_EstadoTarea,
          E.Codigo EquipoCodigoTAG,
          E.Tag_DMH Tag_DMH,
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
          TE.te_Obs_lider_turno Obs_lider
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
        WHERE
          T.Fecha BETWEEN ? AND ?
          AND U.Descripcion NOT LIKE ? 
          AND T.Id_Estado IN (5,6)
          AND TE.te_Estado_val = 0
          AND TE.te_Estado_val_lider_turno = 1
        ORDER BY	T.Id ASC;   
      `, [date1, date2, tt]);

      if(!pRango){
        res.json({ title: "Sin Información." });
      }else{
        // res.json(pRango[0]);
        res.json(pRango);
      }

    }
    
  } catch (error) {

    console.log(error);
    
  }

});

router.get("/protocolo/:IDT", isLoggedIn, authRole(['Cli_C', 'Cli_B', 'Cli_A', 'Cli_D', 'Cli_E', 'Plan', 'Admincli','GerVer', 'Supervisor', 'Operaciones']), async (req, res) => {

  try {
    
    const { IDT } = req.params;
    const consultaImagenes =  await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea IN (?)", [IDT]);
    const imagenes = [];

    if (consultaImagenes.length > 0) {
      const img = consultaImagenes[0].Archivos.split('|');
      const images = img.map((img) => {
        return "/images/" + IDT + "_" + img;
      });     
      imagenes.push(...images);
    }

    const info_prot = await pool.query(`
      SELECT
        Tareas.Id AS TR_TAREA_ID,
        date_format( Tareas.Fecha, '%d-%m-%Y' ) AS FECHA,
        Protocolos.Id AS 'TR_PROT_ID',
        TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',
        UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',
        Equipos.Codigo AS 'TR_EQUIPO_COD',
        Equipos.Tag_DMH AS 'TR_TAG_DMH', 
        Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',
        Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',
        UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',
        Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',
        Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',
        Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',
        TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',
        TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',
        Estados.Descripcion AS 'TR_ESTADO',
        CONVERT (
          CAST(
            CONVERT (
            IF
              (
                Tarea_Respuesta.Respuesta = 'SC',
                'No aplica',
              IF
                (
                  Tarea_Respuesta.Respuesta = 'SSR',
                  'Sistema sin revisar.',
                IF
                  (
                    Tarea_Respuesta.Respuesta = 'SOP',
                    'Sistema operativo',
                  IF
                    (
                      Tarea_Respuesta.Respuesta = 'SOCO',
                      'Sist. operativo con obs.',
                    IF
                      (
                        Tarea_Respuesta.Respuesta = 'SFS',
                        'Sist. fuera de serv.',
                      IF
                      ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 
            ) AS BINARY 
          ) USING UTF8 
        ) AS 'TR_RESPUESTA',
        Usuarios.Descripcion AS 'TR_TECNICO',
        UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',
      IF
        ( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',
        TipoContingente.Id AS 'TR_CONTINGENTE_ID',
        TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',
      IF
        ( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',
        Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',
        EQ.SecDESC AS 'TR_SECTOR',
        EQ.AreaDESC AS 'TR_AREA',
        EQ.GerDESC AS 'TR_GERENCIA' 
      FROM
        Protocolos
        INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id
        INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo
        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id
        INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo 
        AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo
        INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id
        INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo
        INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea 
        AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo 
        AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo
        INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id
        INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id
        INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id
        LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id
        LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea
        INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo
        INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico
        INNER JOIN (
        SELECT
          E.Id 'EqID',
          S.Descripcion 'SecDESC',
          A.Descripcion 'AreaDESC',
          G.Descripcion 'GerDESC',
          C.Descripcion 'CteDESC' 
        FROM
          Equipos E
          INNER JOIN Sectores S ON E.Id_Sector = S.Id
          INNER JOIN Areas A ON S.Id_Area = A.Id
          INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id
          INNER JOIN Clientes C ON G.Id_Cliente = C.Id 
        ) AS EQ ON Tareas.Id_Equipo = EQ.EqID 
      WHERE
        Tareas.Id = ?
      ORDER BY
        TR_PROT_DESC_CAPI ASC,
        FIELD( TR_PROT_CAPTURA, 'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP' ),
        TR_PROT_CAPTURA ASC;
      `, [IDT]
    );

    let turno;
    let fechaturno;
    console.log(imagenes);

    const liderTurno = await pool.query(`
      SELECT
        U.Descripcion AS TURNO,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_comentario = 'Validada por lider turno'
        AND TE.te_Estado_val_lider_turno = 1
        AND H.ht_id = ?
      LIMIT 1;
    `, [IDT]);
    
      if (liderTurno.length > 0) {
        turno = liderTurno[0].TURNO;
        const fechaObj = new Date(liderTurno[0].FECHA);
        fechaturno = fechaObj.toLocaleString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false // Usa formato 24 horas
        });  
      } else {
        turno = ''; 
      }
    
    let spci;
    let fechaspci;

    const liderSpci = await pool.query(`
      SELECT
        U.Descripcion AS SPCI,
				H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_id = ?
				AND H.ht_comentario = 'Validada por lider spci' 
        AND TE.te_Estado_val = 1
        AND TE.te_Estado_val_lider_turno=1
      LIMIT 1;
    `, [IDT]);  

    if (liderSpci.length > 0) {
      spci = liderSpci[0].SPCI;
      const fechaObj = new Date(liderSpci[0].FECHA);
      fechaspci = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      spci = ''; 
    }
    
    let clienteAprob;
    let fechacliente;

    const aprobCliente = await pool.query(`
       SELECT
        U.Descripcion AS CLIENTE,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE 
        TE.te_Id_aux_estado = 4
        AND TE.te_Id_Tarea = ?
        AND H.ht_comentario = 'Tarea validada por cliente'  
    `, [IDT]);

    if (aprobCliente.length > 0) {
      clienteAprob = aprobCliente[0].CLIENTE;
      const fechaObj = new Date(aprobCliente[0].FECHA);
      fechacliente = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      clienteAprob = ''; 
    }

    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }
    const cap = info_prot.map((a) => a.TR_PROT_DESC_CAPI);
    const cap1 = cap.filter(onlyUnique);

    const reparaciones = await pool.query('SELECT Id_Tarea_Origen FROM Tareas_Reparaciones WHERE Id_Tarea_Nueva = ?', [IDT]);

    let tarea_origen = null;
    let estado_origen = null;
    let obs_origen = null;
    let protocolo_origen = null;
    const imagenes_origen = [];

    if (reparaciones.length > 0) {
      tarea_origen = reparaciones[0].Id_Tarea_Origen;
      const consultaImagenes_origen =  await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea IN (?)", [tarea_origen]);
    

    if (consultaImagenes_origen.length > 0) {
      const img_origen = consultaImagenes_origen[0].Archivos.split('|');
        const images_origen = img_origen.map((img_origen) => {
          return "/images/" + tarea_origen + "_" + img_origen;
        });
        imagenes_origen.push(...images_origen);
      }
      const origen = await pool.query(
        `
          SELECT
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
                        IF(TD.tdet_Estado_Equipo = 'SOCO', 'Sist. operativo con obs.', IF(TD.tdet_Estado_Equipo = 'SFS', 'Sist. fuera de serv.', IF(TD.tdet_Estado_Equipo = 'SNO', 'Sist. no operativo', TD.tdet_Estado_Equipo)))
                      )
                    )
                  ) USING UTF8
                ) AS BINARY
              ) USING UTF8
            ) AS ESTADO_EQUIPO_ORIGEN,
            TD.tdet_Observaciones_Estado AS OBSERVACIONES_ORIGEN,
            TP.Descripcion AS PROTOCOLO_ORIGEN
          FROM
            Tareas_Detalle TD
            INNER JOIN Tareas T ON T.Id = TD.tdet_Id_Tarea
            INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
            INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo 
          WHERE
            TD.tdet_Id_Tarea =  ?
        `,
        [tarea_origen]
      );

      if (origen.length > 0) {
        estado_origen = origen[0].ESTADO_EQUIPO_ORIGEN;
        obs_origen = origen[0].OBSERVACIONES_ORIGEN;
        protocolo_origen = origen[0].PROTOCOLO_ORIGEN;
      }
    }

    res.render("protocolos/protocolo", {
      IDT: info_prot[0].TR_TAREA_ID,
      TR_GERENCIA: info_prot[0].TR_GERENCIA,
      TR_AREA: info_prot[0].TR_AREA,
      TR_SECTOR: info_prot[0].TR_SECTOR,
      FECHA: info_prot[0].FECHA,
      TAREATIPO: info_prot[0].TR_PROT_TAREATIPO,
      TR_PROT_DESC_TAREATIPO: info_prot[0].TR_PROT_DESC_TAREATIPO,
      TR_EQUIPO_COD: info_prot[0].TR_EQUIPO_COD,
      TR_TAG_DMH: info_prot[0].TR_TAG_DMH,
      TR_PROT_ID: info_prot[0].TR_PROT_ID,
      TR_PROT_DESC_PROT: info_prot[0].TR_PROT_DESC_PROT,
      TR_ESTADO: info_prot[0].TR_ESTADO,
      TR_TIPO_EQUIPO: info_prot[0].TR_TIPO_EQUIPO,
      cap1: cap1,
      prot: info_prot,
      imagenes: imagenes,
      turno: turno,
      fechaturno: fechaturno,
      spci: spci,
      fechaspci: fechaspci,
      clienteAprob: clienteAprob,
      fechacliente: fechacliente,
      tarea_origen: tarea_origen,
      estado_origen: estado_origen,
      obs_origen: obs_origen,
      protocolo_origen: protocolo_origen,
      imagenes_origen: imagenes_origen
    });
    
  } catch (error) {
    console.log(error);
  }

});

router.post("/protocolo/validar", isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

  try {

    const {usuario, Id_Cliente, Id} = req.user;
    const datas = Object.values(req.body);
    console.log(datas);
    
    const actTareaEstado = await pool.query(`UPDATE Tareas_Estado SET te_Estado_val = 1 WHERE te_Id_Tarea IN (${datas});`);

    const arreglo = [];
    arreglo.push(datas);
    const arreglo1 = arreglo[0];
    const arreglo2 = arreglo1.toString();
    const arreglo3 = arreglo2.split(",");
    const arreglo4 = arreglo3.map(Number);
    const date = new Date();
    const arreglo5 = arreglo4.map(function (id) {
      return [id, 5, 5, usuario, date, 0];
    });

    const fechaActual = new Date()  ;
    const titulo = "Enviada a cliente";
    const obs = "Validada por lider spci";
   
    const sql = `
      INSERT INTO Historia_tareas (ht_id, ht_usuario, ht_titulo, ht_fecha, ht_comentario)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const tarea of datas) {
      const [idTarea]  = tarea;
      await pool.query(sql, [idTarea, Id, titulo, fechaActual, obs]);
    }

    const insValTareas = await pool.query("INSERT INTO Validacion_Tareas (Val_tarea_id, Val_id_estado, Val_id_estado_old, Val_respsapma, Val_fechaval_inf, Val_rechazo) Values ?", [arreglo5]);

    const emailc = await pool.query(
      "SELECT\n" +
      "	USUARIO,\n" +
      "	U.Email \n" +
      "FROM\n" +
      "	(\n" +
      "	SELECT\n" +
      "		USUARIO \n" +
      "	FROM\n" +
      "		(\n" +
      "		SELECT\n" +
      "			T.LID,\n" +
      "			X.* \n" +
      "		FROM\n" +
      "			(\n" +
      "			SELECT\n" +
      "				L.ID LID,\n" +
      "				L.UGE LUGE,\n" +
      "				L.UAR LUAR,\n" +
      "				L.USEC LUSEC,\n" +
      "				L.UEQU LUEQU \n" +
      "			FROM\n" +
      "				(\n" +
      "				SELECT\n" +
      "					V.vce_idEquipo ID,\n" +
      "					UG.id_user UGE,\n" +
      "					UA.id_user UAR,\n" +
      "					US.id_user USEC,\n" +
      "					UE.id_user UEQU \n" +
      "				FROM\n" +
      "					VIEW_equiposCteGerAreSec V\n" +
      "					LEFT JOIN userger UG ON UG.id_ger = V.vcgas_idGerencia\n" +
      "					LEFT JOIN userarea UA ON UA.id_area = V.vcgas_idArea\n" +
      "					LEFT JOIN usersector US ON US.id_sector = V.vcgas_idSector\n" +
      "					LEFT JOIN userequipo UE ON UE.id_equipo = V.vce_idEquipo \n" +
      "				WHERE\n" +
      "					V.vce_idEquipo IN (\n" +
      "					SELECT\n" +
      "						E.Id \n" +
      "					FROM\n" +
      "						Tareas T\n" +
      "						INNER JOIN Equipos E ON E.Id = T.Id_Equipo \n" +
      "					WHERE\n" +
      "						T.Id IN ( "+datas+" ) \n" +
      "					GROUP BY\n" +
      "						E.Id \n" +
      "					) \n" +
      "				) AS L \n" +
      "			) AS T\n" +
      "		CROSS JOIN LATERAL ( SELECT LUGE, 'LUGE' UNION ALL SELECT LUAR, 'LUAR' UNION ALL SELECT LUSEC, 'LUSEC' UNION ALL SELECT LUEQU, 'LUEQU' ) AS X ( USUARIO, NIVEL )) AS CORREO \n" +
      "	WHERE\n" +
      "		USUARIO IS NOT NULL \n" +
      "	GROUP BY\n" +
      "		USUARIO \n" +
      "	) AS CORREO2\n" +
      "	INNER JOIN Usuarios U ON U.Id = USUARIO \n" +
      "WHERE\n" +
      "	U.Activo = 1;"
    );

    const emailp = await pool.query(
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

    const emailgen = await pool.query(
      "SELECT\n" +
        "	U.Id,\n" +
        "	U.Email \n" +
        "FROM\n" +
        "	Usuarios U \n" +
        "WHERE\n" +
        "	U.Id_Perfil = 6 \n" +
        "	AND U.Id_Cliente = " +
        Id_Cliente +
        " \n" +
        "	AND U.Activo = 1;"
    );

    const arremail = emailc.map(function (email) {
      return email.Email;
    });

    const arremailp = emailp.map(function (email) {
      return email.Email;
    });

    const arremailgen = emailgen.map(function (email) {
      return email.Email;
    });

    const datemail = new Date().toLocaleDateString('en-GB');
    const filePathName1 = path.resolve(__dirname, "../views/email/emailplan.hbs"); 
    const mensaje = fs.readFileSync(filePathName1, "utf8");
    const template = hbs.compile(mensaje);

    const context = {
      datemail, 
    };

    const html = template(context);

    await transporter.sendMail({
      from: "SAPMA DRT <notificaciones@sercoing.cl>",
      //to: 'marancibia@sercoing.cl',
      to: [arremailgen, arremail],
      cc: arremailp,
      bcc: correo,
      subject: "Aprobación de Tareas",
      html,
      attachments: [
        {
          filename: "imagen1.png",
          path: "./src/public/img/imagen1.png",
          cid: "imagen1",
        },
      ],
    });

    const act_tarea_detalle = await pool.query('call sp_ActualizarTareaDetalle();');

    res.send("ok");

  } catch (error) {
    
    console.log(error);

  }
});

router.get("/tpenspci", isLoggedIn, authRole(['Supervisor', 'Admincli']), async (req, res) => {
  res.render("protocolos/validarlider");
});

router.post("/prot_spci_validar", isLoggedIn, authRole(['Supervisor','Admincli']), async (req, res) => {
  
  try {

    const { date1, date2, tarea } = req.body;

    if (tarea > 0) {

      const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

      const pTarea = await pool.query(`
        SELECT
          V.TAREA AS IdTarea,
          date_format( V.FECHA, '%d-%m-%Y' ) AS FechaTarea,
          V.CODIGO AS EquipoCodigoTAG,
          E.Tag_DMH AS Tag_DMH,
          U.Login AS UsuarioDescripcion,
          V.GERENCIA AS GerenciaDesc,
          V.AREA AS AreaDesc,
          V.SECTOR AS SectorDesc,
          V.SERVICIO AS TipoServicio,
          V.ESTADO_TAREA AS EstadoDesc,
          V.ESTADO_EQUIPO AS EstadoOperEquipo,
          TD.tdet_Observaciones_Estado AS EstadoOperEquipoObs,
          TE.te_Obs_lider_spci Obs_lider 
        FROM
          VIEW_DetalleEquipos V
          INNER JOIN Equipos E ON V.EQUIPO_ID = E.Id
          INNER JOIN Tareas T ON T.Id = V.TAREA
          INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico
          INNER JOIN Tareas_Detalle TD ON TD.tdet_Id_Tarea = V.TAREA
          INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = V.TAREA 
        WHERE
          T.Id_Estado = 5 
          AND TE.te_Id_aux_estado = 5 
          AND TE.te_Estado_val = 0 
          AND TE.te_Estado_val_lider_turno = 0 
          AND V.TAREA = ? 
        ORDER BY
          V.TAREA DESC;
        `,[tarea]);

      if(!pTarea){
        res.json({ title: "Sin Información." });
      }else{
        res.json(pTarea);
      }

    }else{

      const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

      const pRango = await pool.query(`
          SELECT
            V.TAREA AS IdTarea,
            date_format( V.FECHA, '%d-%m-%Y' ) AS FechaTarea,
            V.CODIGO AS EquipoCodigoTAG,
            E.Tag_DMH AS Tag_DMH,
            U.Login AS UsuarioDescripcion,
            V.GERENCIA AS GerenciaDesc,
            V.AREA AS AreaDesc,
            V.SECTOR AS SectorDesc,
            V.SERVICIO AS TipoServicio,
            V.ESTADO_TAREA AS EstadoDesc,
            V.ESTADO_EQUIPO AS EstadoOperEquipo,
            TD.tdet_Observaciones_Estado AS EstadoOperEquipoObs,
            TE.te_Obs_lider_spci Obs_lider
          FROM
            VIEW_DetalleEquipos V
            INNER JOIN Equipos E ON V.EQUIPO_ID = E.Id
            INNER JOIN Tareas T ON T.Id = V.TAREA
            INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico
            INNER JOIN Tareas_Detalle TD ON TD.tdet_Id_Tarea = V.TAREA
            INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = V.TAREA
          WHERE 
            T.Id_Estado = 5
            AND TE.te_Id_aux_estado =5
            AND TE.te_Estado_val = 0
            AND TE.te_Estado_val_lider_turno =0
            AND V.FECHA BETWEEN ? AND  ?
          ORDER BY V.TAREA DESC;
        `, [date1, date2]);

      if(!pRango){
        res.json({ title: "Sin Información." });
      }else{
        res.json(pRango);
      }

    }
    
  } catch (error) {

    console.log(error);
    
  }
});

router.post("/protocolo/validar_lider", isLoggedIn, authRole(['Plan', 'Admincli', 'Supervisor']), async (req, res) => {

  try {

    const {Id, Email, Id_Cliente} = req.user;
    const {idt} = req.body;
    const datas = idt.map(tarea => tarea.idTarea || tarea.IdTarea);
    const titulo = "Enviada a lider spci";

    const actTareaEstado = await pool.query(`UPDATE Tareas_Estado SET te_Estado_val_lider_turno = 1 WHERE te_Id_Tarea IN (${datas});`);

    const actobs = `UPDATE Tareas_Estado SET te_Obs_lider_turno = ? WHERE te_Id_Tarea = ? `;

    for (const tarea of idt) {
      const { idTarea, boolobs } = tarea;
      await pool.query(actobs, [boolobs, idTarea]);
    }

    const fechaActual = new Date();
   
    const sql = `
      INSERT INTO Historia_tareas (ht_id, ht_usuario, ht_titulo, ht_fecha, ht_comentario)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const tarea of idt) {
      const { idTarea, obs } = tarea;
      await pool.query(sql, [idTarea, Id, titulo, fechaActual, obs]);
    }

    const emailp = await pool.query(
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

    const arremailp = emailp.map(function (email) {
      return email.Email;
    });

    const datemail = new Date().toLocaleDateString('en-GB');
    const filePathName1 = path.resolve(__dirname, "../views/email/emailplan_turno.hbs"); 
    const mensaje = fs.readFileSync(filePathName1, "utf8");
    const template = hbs.compile(mensaje);

    const context = {
      datemail, 
    };

    const html = template(context);

    await transporter.sendMail({
      from: "SAPMA DRT <notificaciones@sercoing.cl>",
      to: [arremailp],
      cc: Email,
      bcc: "notificaciones.sapma@sercoing.cl",
      subject: "Envío de Tareas (Lider Turno)",
      html,
      attachments: [
        {
          filename: "imagen1.png",
          path: "./src/public/img/imagen1.png",
          cid: "imagen1",
        },
      ],
    });

    res.send("ok");

  } catch (error) {
    
    console.log(error);

  }

});

router.post("/protocolo/devolver_lider", isLoggedIn, authRole(['Plan', 'Admincli', 'Supervisor']), async (req, res)=> {
  try {

    const {Id, Email, Id_Cliente} = req.user;
    const {idt} = req.body;
    const datas = idt.map(tarea => tarea.idTarea || tarea.IdTarea);
    const titulo = "Enviada a lider turno";

    const actTareaEstado = await pool.query(`UPDATE Tareas_Estado SET te_Estado_val_lider_turno = 0 WHERE te_Id_Tarea IN (${datas});`);

    const actobs = `UPDATE Tareas_Estado SET te_Obs_lider_spci = 1 WHERE te_Id_Tarea = ? `;

    for (const tarea of idt) {
      const { idTarea } = tarea;
      await pool.query(actobs, [idTarea]);
    }

    const fechaActual = new Date();
    
    const sql = `
      INSERT INTO Historia_tareas (ht_id, ht_usuario, ht_titulo, ht_fecha, ht_comentario)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const tarea of idt) {
      const { idTarea, obs } = tarea;
      await pool.query(sql, [idTarea, Id, titulo, fechaActual, obs]);
    }

    const emailp = await pool.query(
      "SELECT\n" +
        "	U.Id,\n" +
        "	U.Email \n" +
        "FROM\n" +
        "	Usuarios U \n" +
        "WHERE\n" +
        "	U.Id_Perfil = 11 \n" +
        "	AND U.Id_Cliente = " +
        Id_Cliente +
        " \n" +
        "	AND U.Activo = 1;"
    );

    const arremailp = emailp.map(function (email) {
      return email.Email;
    });

    const datemail = new Date().toLocaleDateString('en-GB');
    const filePathName1 = path.resolve(__dirname, "../views/email/emailplan_spci.hbs"); 
    const mensaje = fs.readFileSync(filePathName1, "utf8");
    const template = hbs.compile(mensaje);

    const context = {
      datemail, 
    };

    const html = template(context);

    await transporter.sendMail({
      from: "SAPMA DRT <notificaciones@sercoing.cl>",
      to: [arremailp],
      cc: Email,
      bcc: "notificaciones.sapma@sercoing.cl",
      subject: "Envío de Tareas (Lider SPCI)",
      html,
      attachments: [
        {
          filename: "imagen1.png",
          path: "./src/public/img/imagen1.png",
          cid: "imagen1",
        },
      ],
    });

    res.send("ok");

  } catch (error) {
    
    console.log(error);

  }
});

router.get("/pdf/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_C', 'Cli_B', 'Cli_A', 'Cli_D', 'Cli_E', 'Plan', 'Admincli', 'GerVer', 'Supervisor', 'Operaciones']), async (req, res) => {

  try {

    const { IDT, CODIGO } = req.params;
    const consultaImagenes = await pool.query("SELECT Archivos FROM Adjuntos WHERE Id_Tarea IN (?)", [IDT]);
    let archivo;
    if (consultaImagenes.length > 0) {
      archivo = consultaImagenes[0].Archivos;
    } else {
      archivo = '';
    }
    const imagenes = [];

    if (archivo && archivo.length > 0) {
      const img = archivo.split('|');
      const rutaImagenes = path.resolve(__dirname, "../images/");

      const images = img.map((imgNombre) => {
        const imagePath = path.join(rutaImagenes, `${IDT}_${imgNombre}`);

        try {
          const imageData = fs.readFileSync(imagePath);
          const base64Image = Buffer.from(imageData).toString('base64');
          return 'data:image/png;base64,' + base64Image;
        } catch (err) {
          // Imagen no encontrada, se omite
          return null;
        }
      }).filter(img => img !== null); // Filtra las imágenes que sí se pudieron cargar

      imagenes.push(...images);
    }
    const info_prot = await pool.query("SELECT\n" +
      " Tareas.Id AS TR_TAREA_ID,\n" +
      " date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
      " Protocolos.Id AS 'TR_PROT_ID',\n" +
      " TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
      " UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
      " Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
      " Equipos.Tag_DMH AS 'TR_TAG_DMH',\n" +
      " Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
      " Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
      " UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
      " Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
      " Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
      " Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
      " TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
      " TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
      " Estados.Descripcion AS 'TR_ESTADO',\n" +
      " CONVERT ( CAST( CONVERT ( IF ( Tarea_Respuesta.Respuesta = 'SC', 'No aplica',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SSR', 'Sistema sin revisar.', IF(Tarea_Respuesta.Respuesta = 'SOP', 'Sistema operativo',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SOCO', 'Sist. operativo con obs.', IF(Tarea_Respuesta.Respuesta = 'SFS', 'Sist. fuera de serv.',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 ) AS BINARY ) USING UTF8 ) AS 'TR_RESPUESTA',\n" +
      " Usuarios.Descripcion AS 'TR_TECNICO',\n" +
      " UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
      " IF ( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
      " TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
      " TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
      " IF( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
      " Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
      " EQ.SecDESC AS 'TR_SECTOR',\n" +
      " EQ.AreaDESC AS 'TR_AREA',\n" +
      " EQ.GerDESC AS 'TR_GERENCIA' \n" +
      " FROM\n" +
      " Protocolos\n" +
      " INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
      " INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
      " INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
      " INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
      " AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
      " INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
      " INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
      " INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
      " AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
      " AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
      " INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
      " INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
      " INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
      " LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
      " LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
      " INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
      " INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
      " INNER JOIN (\n" +
      " SELECT\n" +
      " E.Id 'EqID',\n" +
      " S.Descripcion 'SecDESC',\n" +
      " A.Descripcion 'AreaDESC',\n" +
      " G.Descripcion 'GerDESC',\n" +
      " C.Descripcion 'CteDESC' \n" +
      " FROM\n" +
      " Equipos E\n" +
      " INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
      " INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
      " INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
      " INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
      " ) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
      " WHERE \n" +
      " Tareas.Id = "+IDT+" \n" +
      " ORDER BY TR_PROT_DESC_CAPI  ASC, \n" +
      " FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC;"
    );

    let turno;
    let fechaturno;

    const liderTurno = await pool.query(`
      SELECT
        U.Descripcion AS TURNO,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_comentario = 'Validada por lider turno'
        AND TE.te_Estado_val_lider_turno = 1
        AND H.ht_id = ?
      LIMIT 1;
    `, [IDT]);
    
      if (liderTurno.length > 0) {
        turno = liderTurno[0].TURNO;
        const fechaObj = new Date(liderTurno[0].FECHA);
        fechaturno = fechaObj.toLocaleString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false // Usa formato 24 horas
        });  
      } else {
        turno = ''; 
      }
    
    let spci;
    let fechaspci;

    const liderSpci = await pool.query(`
      SELECT
        U.Descripcion AS SPCI,
				H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_id = ?
				AND H.ht_comentario = 'Validada por lider spci' 
        AND TE.te_Estado_val = 1
        AND TE.te_Estado_val_lider_turno=1
      LIMIT 1;
    `, [IDT]);  

    if (liderSpci.length > 0) {
      spci = liderSpci[0].SPCI;
      const fechaObj = new Date(liderSpci[0].FECHA);
      fechaspci = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      spci = ''; 
    }
    
    let clienteAprob;
    let fechacliente;

    const aprobCliente = await pool.query(`
       SELECT
        U.Descripcion AS CLIENTE,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE 
        TE.te_Id_aux_estado = 4
        AND TE.te_Id_Tarea = ?
        AND H.ht_comentario = 'Tarea validada por cliente'  
    `, [IDT]);

    if (aprobCliente.length > 0) {
      clienteAprob = aprobCliente[0].CLIENTE;
      const fechaObj = new Date(aprobCliente[0].FECHA);
      fechacliente = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      clienteAprob = ''; 
    }

    const ruta =  path.resolve(__dirname ,"../pdf/" + IDT + "_"+CODIGO+".pdf");
    const estado = info_prot[0].TR_ESTADO;
    const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs"); 
    const html1 = fs.readFileSync(filePathName, "utf8");
    const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
    const imageBuffer = fs.readFileSync(ruta_imagen);
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const img = 'data:image/png;base64,'+base64Image;

    const TR_PROT_DESC_TAREATIPO = info_prot[0].TR_PROT_DESC_TAREATIPO;
    const TR_EQUIPO_COD= info_prot[0].TR_EQUIPO_COD;
    const TR_TAG_DMH = info_prot[0].TR_TAG_DMH;
    const TR_GERENCIA = info_prot[0].TR_GERENCIA;
    const TR_AREA = info_prot[0].TR_AREA;
    const TR_SECTOR = info_prot[0].TR_SECTOR;
    const TR_ESTADO = info_prot[0].TR_ESTADO;
    const TR_TIPO_EQUIPO = info_prot[0].TR_TIPO_EQUIPO;

    const options = {
      format: 'letter',
      printBackground: true,
      margin: {
        top: '160px', 
        right: '20px',
        bottom: '70px',
        left: '20px',
      },
      displayHeaderFooter: true,
      headerTemplate: `
      <style>
        .site-header { 
          border-bottom: 1px solid rgb(227, 227, 227); 
          margin-top: 20px;
          margin-left: 25px;
          padding-bottom: 10px;
          font-family: Verdana, Geneva, Tahoma, sans-serif;
          color: #2b2d42;
          display: flex; 
          justify-content: space-between; 
          width: 93%;
        } 

        .site-identity img { 
          max-width: 200px; 
          margin-top: -15px;
        }

        .text_header { 
          word-wrap: break-word; 
          max-width: calc(100% - 180px); 
        }

        .text_header h6 { 
          font-size: 10px; 
          margin: 0 0 0 5px; 
          display: inline-block; 
        }

        .text_header label { 
          font-size: 10px; 
          margin: 5px 0 0 5px; 
          display: inline-block; 
        }
        
      </style>
      <div class="site-header">
          <div class="text_header">
            <h6>PROTOCOLO Nº: ${IDT} / ${TR_PROT_DESC_TAREATIPO} / ${TR_TIPO_EQUIPO}</h6><br>
            <h6>CODIGO SAPMA / TAG DMH:</h6><label>${TR_EQUIPO_COD} / ${TR_TAG_DMH}</label><br>
            <h6>GERENCIA:</h6><label>${TR_GERENCIA}</label><br>
            <h6>AREA:</h6><label>${TR_AREA}</label><br>
            <h6>SECTOR:</h6><label>${TR_SECTOR}</label><br>
            <h6>ESTADO:</h6><label>${TR_ESTADO}</label>
          </div>
          <div class="site-identity">
            <img src="${img}" alt="Imagen">
          </div>
        </div>   
        `,
      footerTemplate: `
        <div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px; margin: 0 auto;">
          <center>SAPMA-Sercoing | Tarea Nº: ${IDT} | Estado: ${estado} | Página <span class="pageNumber"></span> de <span class="totalPages"></span></center>
        </div>
      `,
    };

    const reparaciones = await pool.query('SELECT Id_Tarea_Origen FROM Tareas_Reparaciones WHERE Id_Tarea_Nueva = ?', [IDT]);

    let tarea_origen = null;
    let estado_origen = null;
    let obs_origen = null;
    let protocolo_origen = null;
    const imagenes_origen = [];

    if (reparaciones.length > 0) {
      tarea_origen = reparaciones[0].Id_Tarea_Origen;
      const consultaImagenes_origen =  await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea IN (?)", [tarea_origen]);
      let archivo_origen;
      if (consultaImagenes_origen.length > 0) {
        archivo_origen = consultaImagenes_origen[0].Archivos;
      } else {
        archivo_origen = '';
      }


      if (archivo_origen && archivo_origen.length > 0) {
        const img_origen = archivo_origen.split('|');
        const rutaImagenes_origen = path.resolve(__dirname, "../images/");

        const images_origen = img_origen.map((imgNombre) => {
          const imagePath_origen = path.join(rutaImagenes_origen, `${tarea_origen}_${imgNombre}`);

          try {
            const imageData_origen = fs.readFileSync(imagePath_origen);
            const base64Image_origen = Buffer.from(imageData_origen).toString('base64');
            return 'data:image/png;base64,' + base64Image_origen;
          } catch (err) {
            // Imagen no encontrada, se omite
            return null;
          }
        }).filter(img => img_origen !== null); // Filtra las imágenes que sí se pudieron cargar

        imagenes_origen.push(...images_origen);
      }

      const origen = await pool.query(
        `
          SELECT
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
                        IF(TD.tdet_Estado_Equipo = 'SOCO', 'Sist. operativo con obs.', IF(TD.tdet_Estado_Equipo = 'SFS', 'Sist. fuera de serv.', IF(TD.tdet_Estado_Equipo = 'SNO', 'Sist. no operativo', TD.tdet_Estado_Equipo)))
                      )
                    )
                  ) USING UTF8
                ) AS BINARY
              ) USING UTF8
            ) AS ESTADO_EQUIPO_ORIGEN,
            TD.tdet_Observaciones_Estado AS OBSERVACIONES_ORIGEN,
            TP.Descripcion AS PROTOCOLO_ORIGEN
          FROM
            Tareas_Detalle TD
            INNER JOIN Tareas T ON T.Id = TD.tdet_Id_Tarea
            INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
            INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo 
          WHERE
            TD.tdet_Id_Tarea =  ?
        `,
        [tarea_origen]
      );

      if (origen.length > 0) {
        estado_origen = origen[0].ESTADO_EQUIPO_ORIGEN;
        obs_origen = origen[0].OBSERVACIONES_ORIGEN;
        protocolo_origen = origen[0].PROTOCOLO_ORIGEN;
      }
    }

    let context = {
      IDT: info_prot[0].TR_TAREA_ID,
      TR_GERENCIA: info_prot[0].TR_GERENCIA,
      TR_AREA: info_prot[0].TR_AREA,
      TR_SECTOR: info_prot[0].TR_SECTOR,
      FECHA: info_prot[0].FECHA,
      TAREATIPO: info_prot[0].TR_PROT_TAREATIPO,
      TR_PROT_DESC_TAREATIPO: info_prot[0].TR_PROT_DESC_TAREATIPO,
      TR_EQUIPO_COD: info_prot[0].TR_EQUIPO_COD,
      TR_PROT_ID: info_prot[0].TR_PROT_ID,
      TR_PROT_DESC_PROT: info_prot[0].TR_PROT_DESC_PROT,
      TR_ESTADO: info_prot[0].TR_ESTADO,
      prot: info_prot,
      img: img, 
      imagenes: imagenes,
      turno: turno,
      fechaturno: fechaturno,
      spci: spci,
      fechaspci: fechaspci,
      clienteAprob: clienteAprob,
      fechacliente: fechacliente,
      tarea_origen: tarea_origen,
      estado_origen: estado_origen,
      obs_origen: obs_origen,
      protocolo_origen: protocolo_origen,
      imagenes_origen: imagenes_origen
    }

    let template = hbs.compile(html1);
    let html2 = template(context);
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox','--disable-image-cache']

        // headless: true,
        // ignoreHTTPSErrors: true,
        // args: ['--disable-image-cache']
    });

    const page = await browser.newPage();
    
    await page.setContent(html2, {
        waitUntil: 'networkidle0'
    });
    
    const buffer = await page.pdf(options);
    
    fs.writeFile("src/pdf/" + IDT + "_" + CODIGO + ".pdf", buffer, () => console.log('PDF guardado'));
    
    // const fileName = IDT + "_" + CODIGO + ".pdf";

    // res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.send(buffer);

    const fileName = IDT + "_" + CODIGO + ".pdf";

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
    
    await browser.close();

  } catch (error) {
    console.log(error);
  }

});

router.get("/pdfc/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_C']), async (req, res) => {
  try {

    const { IDT, CODIGO } = req.params;
    const consultaImagenes = await pool.query("SELECT Archivos FROM Adjuntos WHERE Id_Tarea IN (?)", [IDT]);
    let archivo;
    if (consultaImagenes.length > 0) {
      archivo = consultaImagenes[0].Archivos;
    } else {
      archivo = '';
    }
    const imagenes = [];

    if (archivo && archivo.length > 0) {
      const img = archivo.split('|');
      const rutaImagenes = path.resolve(__dirname, "../images/");

      const images = img.map((imgNombre) => {
        const imagePath = path.join(rutaImagenes, `${IDT}_${imgNombre}`);

        try {
          const imageData = fs.readFileSync(imagePath);
          const base64Image = Buffer.from(imageData).toString('base64');
          return 'data:image/png;base64,' + base64Image;
        } catch (err) {
          // Imagen no encontrada, se omite
          return null;
        }
      }).filter(img => img !== null); // Filtra las imágenes que sí se pudieron cargar

      imagenes.push(...images);
    }
    
    const info_prot = await pool.query("SELECT\n" +
      " Tareas.Id AS TR_TAREA_ID,\n" +
      " date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
      " Protocolos.Id AS 'TR_PROT_ID',\n" +
      " TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
      " UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
      " Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
      " Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
      " Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
      " UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
      " Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
      " Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
      " Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
      " TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
      " TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
      " Estados.Descripcion AS 'TR_ESTADO',\n" +
      " CONVERT ( CAST( CONVERT ( IF ( Tarea_Respuesta.Respuesta = 'SC', 'No aplica',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SSR', 'Sistema sin revisar.', IF(Tarea_Respuesta.Respuesta = 'SOP', 'Sistema operativo',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SOCO', 'Sist. operativo con obs.', IF(Tarea_Respuesta.Respuesta = 'SFS', 'Sist. fuera de serv.',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 ) AS BINARY ) USING UTF8 ) AS 'TR_RESPUESTA',\n" +
      " Usuarios.Descripcion AS 'TR_TECNICO',\n" +
      " UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
      " IF ( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
      " TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
      " TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
      " IF( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
      " Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
      " EQ.SecDESC AS 'TR_SECTOR',\n" +
      " EQ.AreaDESC AS 'TR_AREA',\n" +
      " EQ.GerDESC AS 'TR_GERENCIA' \n" +
      " FROM\n" +
      " Protocolos\n" +
      " INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
      " INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
      " INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
      " INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
      " AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
      " INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
      " INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
      " INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
      " AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
      " AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
      " INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
      " INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
      " INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
      " LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
      " LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
      " INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
      " INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
      " INNER JOIN (\n" +
      " SELECT\n" +
      " E.Id 'EqID',\n" +
      " S.Descripcion 'SecDESC',\n" +
      " A.Descripcion 'AreaDESC',\n" +
      " G.Descripcion 'GerDESC',\n" +
      " C.Descripcion 'CteDESC' \n" +
      " FROM\n" +
      " Equipos E\n" +
      " INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
      " INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
      " INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
      " INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
      " ) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
      " WHERE \n" +
      " Tareas.Id = "+IDT+" \n" +
      " ORDER BY TR_PROT_DESC_CAPI  ASC, \n" +
      " FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC;"
    );

    let turno;
    let fechaturno;

    const liderTurno = await pool.query(`
      SELECT
        U.Descripcion AS TURNO,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_comentario = 'Validada por lider turno'
        AND TE.te_Estado_val_lider_turno = 1
        AND H.ht_id = ?
      LIMIT 1;
    `, [IDT]);
    
      if (liderTurno.length > 0) {
        turno = liderTurno[0].TURNO;
        const fechaObj = new Date(liderTurno[0].FECHA);
        fechaturno = fechaObj.toLocaleString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false // Usa formato 24 horas
        });  
      } else {
        turno = ''; 
      }
    
    let spci;
    let fechaspci;

    const liderSpci = await pool.query(`
      SELECT
        U.Descripcion AS SPCI,
				H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_id = ?
				AND H.ht_comentario = 'Validada por lider spci' 
        AND TE.te_Estado_val = 1
        AND TE.te_Estado_val_lider_turno=1
      LIMIT 1;
    `, [IDT]);  

    if (liderSpci.length > 0) {
      spci = liderSpci[0].SPCI;
      const fechaObj = new Date(liderSpci[0].FECHA);
      fechaspci = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      spci = ''; 
    }
    
    let clienteAprob;
    let fechacliente;

    const aprobCliente = await pool.query(`
       SELECT
        U.Descripcion AS CLIENTE,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE 
        TE.te_Id_aux_estado = 4
        AND TE.te_Id_Tarea = ?
        AND H.ht_comentario = 'Tarea validada por cliente'  
    `, [IDT]);

    if (aprobCliente.length > 0) {
      clienteAprob = aprobCliente[0].CLIENTE;
      const fechaObj = new Date(aprobCliente[0].FECHA);
      fechacliente = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      clienteAprob = ''; 
    }

    const ruta =  path.resolve(__dirname ,"../pdf/" + IDT + "_"+CODIGO+".pdf");
    const estado = info_prot[0].TR_ESTADO;
    const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs"); 
    const html1 = fs.readFileSync(filePathName, "utf8");
    const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
    const imageBuffer = fs.readFileSync(ruta_imagen);
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const img = 'data:image/png;base64,'+base64Image;

    const TR_PROT_DESC_TAREATIPO = info_prot[0].TR_PROT_DESC_TAREATIPO;
    const TR_EQUIPO_COD= info_prot[0].TR_EQUIPO_COD;
    const TR_GERENCIA = info_prot[0].TR_GERENCIA;
    const TR_AREA = info_prot[0].TR_AREA;
    const TR_SECTOR = info_prot[0].TR_SECTOR;
    const TR_ESTADO = info_prot[0].TR_ESTADO;

    const options = {
      format: 'letter',
      printBackground: true,
      margin: {
        top: '160px', 
        right: '20px',
        bottom: '70px',
        left: '20px',
      },
      displayHeaderFooter: true,
      headerTemplate: `
      <style>
        .site-header { 
          border-bottom: 1px solid rgb(227, 227, 227); 
          margin-top: 20px;
          margin-left: 25px;
          padding-bottom: 10px;
          font-family: Verdana, Geneva, Tahoma, sans-serif;
          color: #2b2d42;
          display: flex; 
          justify-content: space-between; 
          width: 93%;
        } 

        .site-identity img { 
          max-width: 200px; 
          margin-top: -15px;
        }

        .text_header { 
          word-wrap: break-word; 
          max-width: calc(100% - 180px); 
        }

        .text_header h6 { 
          font-size: 10px; 
          margin: 0 0 0 5px; 
          display: inline-block; 
        }

        .text_header label { 
          font-size: 10px; 
          margin: 5px 0 0 5px; 
          display: inline-block; 
        }
        
      </style>
      <div class="site-header">
          <div class="text_header">
            <h6>PROTOCOLO Nº: ${IDT} / ${TR_PROT_DESC_TAREATIPO}</h6><br>
            <h6>TAG:</h6><label>${TR_EQUIPO_COD}</label><br>
            <h6>GERENCIA:</h6><label>${TR_GERENCIA}</label><br>
            <h6>AREA:</h6><label>${TR_AREA}</label><br>
            <h6>SECTOR:</h6><label>${TR_SECTOR}</label><br>
            <h6>ESTADO:</h6><label>${TR_ESTADO}</label>
          </div>
          <div class="site-identity">
            <img src="${img}" alt="Imagen">
          </div>
        </div>   
        `,
      footerTemplate: `
        <div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px; margin: 0 auto;">
          <center>SAPMA-Sercoing | Tarea Nº: ${IDT} | Estado: ${estado} | Página <span class="pageNumber"></span> de <span class="totalPages"></span></center>
        </div>
      `,
    };

    const reparaciones = await pool.query('SELECT Id_Tarea_Origen FROM Tareas_Reparaciones WHERE Id_Tarea_Nueva = ?', [IDT]);

    let tarea_origen = null;
    let estado_origen = null;
    let obs_origen = null;
    let protocolo_origen = null;
    const imagenes_origen = [];

    if (reparaciones.length > 0) {
      tarea_origen = reparaciones[0].Id_Tarea_Origen;
      const consultaImagenes_origen =  await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea IN (?)", [tarea_origen]);
      let archivo_origen;
      if (consultaImagenes_origen.length > 0) {
        archivo_origen = consultaImagenes_origen[0].Archivos;
      } else {
        archivo_origen = '';
      }


      if (archivo_origen && archivo_origen.length > 0) {
        const img_origen = archivo_origen.split('|');
        const rutaImagenes_origen = path.resolve(__dirname, "../images/");

        const images_origen = img_origen.map((imgNombre) => {
          const imagePath_origen = path.join(rutaImagenes_origen, `${tarea_origen}_${imgNombre}`);

          try {
            const imageData_origen = fs.readFileSync(imagePath_origen);
            const base64Image_origen = Buffer.from(imageData_origen).toString('base64');
            return 'data:image/png;base64,' + base64Image_origen;
          } catch (err) {
            // Imagen no encontrada, se omite
            return null;
          }
        }).filter(img => img_origen !== null); // Filtra las imágenes que sí se pudieron cargar

        imagenes_origen.push(...images_origen);
      }

      const origen = await pool.query(
        `
          SELECT
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
                        IF(TD.tdet_Estado_Equipo = 'SOCO', 'Sist. operativo con obs.', IF(TD.tdet_Estado_Equipo = 'SFS', 'Sist. fuera de serv.', IF(TD.tdet_Estado_Equipo = 'SNO', 'Sist. no operativo', TD.tdet_Estado_Equipo)))
                      )
                    )
                  ) USING UTF8
                ) AS BINARY
              ) USING UTF8
            ) AS ESTADO_EQUIPO_ORIGEN,
            TD.tdet_Observaciones_Estado AS OBSERVACIONES_ORIGEN,
            TP.Descripcion AS PROTOCOLO_ORIGEN
          FROM
            Tareas_Detalle TD
            INNER JOIN Tareas T ON T.Id = TD.tdet_Id_Tarea
            INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
            INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo 
          WHERE
            TD.tdet_Id_Tarea =  ?
        `,
        [tarea_origen]
      );

      if (origen.length > 0) {
        estado_origen = origen[0].ESTADO_EQUIPO_ORIGEN;
        obs_origen = origen[0].OBSERVACIONES_ORIGEN;
        protocolo_origen = origen[0].PROTOCOLO_ORIGEN;
      }
    }

    let context = {
      IDT: info_prot[0].TR_TAREA_ID,
      TR_GERENCIA: info_prot[0].TR_GERENCIA,
      TR_AREA: info_prot[0].TR_AREA,
      TR_SECTOR: info_prot[0].TR_SECTOR,
      FECHA: info_prot[0].FECHA,
      TAREATIPO: info_prot[0].TR_PROT_TAREATIPO,
      TR_PROT_DESC_TAREATIPO: info_prot[0].TR_PROT_DESC_TAREATIPO,
      TR_EQUIPO_COD: info_prot[0].TR_EQUIPO_COD,
      TR_PROT_ID: info_prot[0].TR_PROT_ID,
      TR_PROT_DESC_PROT: info_prot[0].TR_PROT_DESC_PROT,
      TR_ESTADO: info_prot[0].TR_ESTADO,
      prot: info_prot,
      img: img, 
      imagenes: imagenes,
      turno: turno,
      fechaturno: fechaturno,
      spci: spci,
      fechaspci: fechaspci,
      clienteAprob: clienteAprob,
      fechacliente: fechacliente,
      tarea_origen: tarea_origen,
      estado_origen: estado_origen,
      obs_origen: obs_origen,
      protocolo_origen: protocolo_origen,
      imagenes_origen: imagenes_origen
    }

    let template = hbs.compile(html1);
    let html2 = template(context);
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox','--disable-image-cache']
    });

    const page = await browser.newPage();
    
    await page.setContent(html2, {
        waitUntil: 'networkidle0'
    });
    

    
    const buffer = await page.pdf(options);
    
    fs.writeFile("src/pdf/" + IDT + "_" + CODIGO + ".pdf", buffer, () => console.log('PDF guardado'));
    
    // const fileName = IDT + "_" + CODIGO + ".pdf";

    // res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.send(buffer);

    const fileName = IDT + "_" + CODIGO + ".pdf";

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
    
    await browser.close();

  } catch (error) {
    console.log(error);
  }

});

router.get("/pdfb/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_B']), async (req, res) => {
  try {

    const { IDT, CODIGO } = req.params;
    const consultaImagenes = await pool.query("SELECT Archivos FROM Adjuntos WHERE Id_Tarea IN (?)", [IDT]);
    let archivo;
    if (consultaImagenes.length > 0) {
      archivo = consultaImagenes[0].Archivos;
    } else {
      archivo = '';
    }
    const imagenes = [];

    if (archivo && archivo.length > 0) {
      const img = archivo.split('|');
      const rutaImagenes = path.resolve(__dirname, "../images/");

      const images = img.map((imgNombre) => {
        const imagePath = path.join(rutaImagenes, `${IDT}_${imgNombre}`);

        try {
          const imageData = fs.readFileSync(imagePath);
          const base64Image = Buffer.from(imageData).toString('base64');
          return 'data:image/png;base64,' + base64Image;
        } catch (err) {
          // Imagen no encontrada, se omite
          return null;
        }
      }).filter(img => img !== null); // Filtra las imágenes que sí se pudieron cargar

      imagenes.push(...images);
    }
    
    const info_prot = await pool.query("SELECT\n" +
      " Tareas.Id AS TR_TAREA_ID,\n" +
      " date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
      " Protocolos.Id AS 'TR_PROT_ID',\n" +
      " TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
      " UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
      " Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
      " Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
      " Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
      " UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
      " Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
      " Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
      " Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
      " TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
      " TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
      " Estados.Descripcion AS 'TR_ESTADO',\n" +
      " CONVERT ( CAST( CONVERT ( IF ( Tarea_Respuesta.Respuesta = 'SC', 'No aplica',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SSR', 'Sistema sin revisar.', IF(Tarea_Respuesta.Respuesta = 'SOP', 'Sistema operativo',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SOCO', 'Sist. operativo con obs.', IF(Tarea_Respuesta.Respuesta = 'SFS', 'Sist. fuera de serv.',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 ) AS BINARY ) USING UTF8 ) AS 'TR_RESPUESTA',\n" +
      " Usuarios.Descripcion AS 'TR_TECNICO',\n" +
      " UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
      " IF ( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
      " TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
      " TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
      " IF( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
      " Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
      " EQ.SecDESC AS 'TR_SECTOR',\n" +
      " EQ.AreaDESC AS 'TR_AREA',\n" +
      " EQ.GerDESC AS 'TR_GERENCIA' \n" +
      " FROM\n" +
      " Protocolos\n" +
      " INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
      " INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
      " INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
      " INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
      " AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
      " INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
      " INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
      " INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
      " AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
      " AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
      " INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
      " INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
      " INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
      " LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
      " LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
      " INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
      " INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
      " INNER JOIN (\n" +
      " SELECT\n" +
      " E.Id 'EqID',\n" +
      " S.Descripcion 'SecDESC',\n" +
      " A.Descripcion 'AreaDESC',\n" +
      " G.Descripcion 'GerDESC',\n" +
      " C.Descripcion 'CteDESC' \n" +
      " FROM\n" +
      " Equipos E\n" +
      " INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
      " INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
      " INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
      " INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
      " ) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
      " WHERE \n" +
      " Tareas.Id = "+IDT+" \n" +
      " ORDER BY TR_PROT_DESC_CAPI  ASC, \n" +
      " FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC;"
    );

    let turno;
    let fechaturno;

    const liderTurno = await pool.query(`
      SELECT
        U.Descripcion AS TURNO,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_comentario = 'Validada por lider turno'
        AND TE.te_Estado_val_lider_turno = 1
        AND H.ht_id = ?
      LIMIT 1;
    `, [IDT]);
    
      if (liderTurno.length > 0) {
        turno = liderTurno[0].TURNO;
        const fechaObj = new Date(liderTurno[0].FECHA);
        fechaturno = fechaObj.toLocaleString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false // Usa formato 24 horas
        });  
      } else {
        turno = ''; 
      }
    
    let spci;
    let fechaspci;

    const liderSpci = await pool.query(`
      SELECT
        U.Descripcion AS SPCI,
				H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_id = ?
				AND H.ht_comentario = 'Validada por lider spci' 
        AND TE.te_Estado_val = 1
        AND TE.te_Estado_val_lider_turno=1
      LIMIT 1;
    `, [IDT]);  

    if (liderSpci.length > 0) {
      spci = liderSpci[0].SPCI;
      const fechaObj = new Date(liderSpci[0].FECHA);
      fechaspci = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      spci = ''; 
    }
    
    let clienteAprob;
    let fechacliente;

    const aprobCliente = await pool.query(`
       SELECT
        U.Descripcion AS CLIENTE,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE 
        TE.te_Id_aux_estado = 4
        AND TE.te_Id_Tarea = ?
        AND H.ht_comentario = 'Tarea validada por cliente'  
    `, [IDT]);

    if (aprobCliente.length > 0) {
      clienteAprob = aprobCliente[0].CLIENTE;
      const fechaObj = new Date(aprobCliente[0].FECHA);
      fechacliente = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      clienteAprob = ''; 
    }

    const ruta =  path.resolve(__dirname ,"../pdf/" + IDT + "_"+CODIGO+".pdf");
    const estado = info_prot[0].TR_ESTADO;
    const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs"); 
    const html1 = fs.readFileSync(filePathName, "utf8");
    const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
    const imageBuffer = fs.readFileSync(ruta_imagen);
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const img = 'data:image/png;base64,'+base64Image;

    const TR_PROT_DESC_TAREATIPO = info_prot[0].TR_PROT_DESC_TAREATIPO;
    const TR_EQUIPO_COD= info_prot[0].TR_EQUIPO_COD;
    const TR_GERENCIA = info_prot[0].TR_GERENCIA;
    const TR_AREA = info_prot[0].TR_AREA;
    const TR_SECTOR = info_prot[0].TR_SECTOR;
    const TR_ESTADO = info_prot[0].TR_ESTADO;

    const options = {
      format: 'letter',
      printBackground: true,
      margin: {
        top: '160px', 
        right: '20px',
        bottom: '70px',
        left: '20px',
      },
      displayHeaderFooter: true,
      headerTemplate: `
      <style>
        .site-header { 
          border-bottom: 1px solid rgb(227, 227, 227); 
          margin-top: 20px;
          margin-left: 25px;
          padding-bottom: 10px;
          font-family: Verdana, Geneva, Tahoma, sans-serif;
          color: #2b2d42;
          display: flex; 
          justify-content: space-between; 
          width: 93%;
        } 

        .site-identity img { 
          max-width: 200px; 
          margin-top: -15px;
        }

        .text_header { 
          word-wrap: break-word; 
          max-width: calc(100% - 180px); 
        }

        .text_header h6 { 
          font-size: 10px; 
          margin: 0 0 0 5px; 
          display: inline-block; 
        }

        .text_header label { 
          font-size: 10px; 
          margin: 5px 0 0 5px; 
          display: inline-block; 
        }
        
      </style>
      <div class="site-header">
          <div class="text_header">
            <h6>PROTOCOLO Nº: ${IDT} / ${TR_PROT_DESC_TAREATIPO}</h6><br>
            <h6>TAG:</h6><label>${TR_EQUIPO_COD}</label><br>
            <h6>GERENCIA:</h6><label>${TR_GERENCIA}</label><br>
            <h6>AREA:</h6><label>${TR_AREA}</label><br>
            <h6>SECTOR:</h6><label>${TR_SECTOR}</label><br>
            <h6>ESTADO:</h6><label>${TR_ESTADO}</label>
          </div>
          <div class="site-identity">
            <img src="${img}" alt="Imagen">
          </div>
        </div>   
        `,
      footerTemplate: `
        <div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px; margin: 0 auto;">
          <center>SAPMA-Sercoing | Tarea Nº: ${IDT} | Estado: ${estado} | Página <span class="pageNumber"></span> de <span class="totalPages"></span></center>
        </div>
      `,
    };

    const reparaciones = await pool.query('SELECT Id_Tarea_Origen FROM Tareas_Reparaciones WHERE Id_Tarea_Nueva = ?', [IDT]);

    let tarea_origen = null;
    let estado_origen = null;
    let obs_origen = null;
    let protocolo_origen = null;
    const imagenes_origen = [];

    if (reparaciones.length > 0) {
      tarea_origen = reparaciones[0].Id_Tarea_Origen;
      const consultaImagenes_origen =  await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea IN (?)", [tarea_origen]);
      let archivo_origen;
      if (consultaImagenes_origen.length > 0) {
        archivo_origen = consultaImagenes_origen[0].Archivos;
      } else {
        archivo_origen = '';
      }


      if (archivo_origen && archivo_origen.length > 0) {
        const img_origen = archivo_origen.split('|');
        const rutaImagenes_origen = path.resolve(__dirname, "../images/");

        const images_origen = img_origen.map((imgNombre) => {
          const imagePath_origen = path.join(rutaImagenes_origen, `${tarea_origen}_${imgNombre}`);

          try {
            const imageData_origen = fs.readFileSync(imagePath_origen);
            const base64Image_origen = Buffer.from(imageData_origen).toString('base64');
            return 'data:image/png;base64,' + base64Image_origen;
          } catch (err) {
            // Imagen no encontrada, se omite
            return null;
          }
        }).filter(img => img_origen !== null); // Filtra las imágenes que sí se pudieron cargar

        imagenes_origen.push(...images_origen);
      }

      const origen = await pool.query(
        `
          SELECT
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
                        IF(TD.tdet_Estado_Equipo = 'SOCO', 'Sist. operativo con obs.', IF(TD.tdet_Estado_Equipo = 'SFS', 'Sist. fuera de serv.', IF(TD.tdet_Estado_Equipo = 'SNO', 'Sist. no operativo', TD.tdet_Estado_Equipo)))
                      )
                    )
                  ) USING UTF8
                ) AS BINARY
              ) USING UTF8
            ) AS ESTADO_EQUIPO_ORIGEN,
            TD.tdet_Observaciones_Estado AS OBSERVACIONES_ORIGEN,
            TP.Descripcion AS PROTOCOLO_ORIGEN
          FROM
            Tareas_Detalle TD
            INNER JOIN Tareas T ON T.Id = TD.tdet_Id_Tarea
            INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
            INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo 
          WHERE
            TD.tdet_Id_Tarea =  ?
        `,
        [tarea_origen]
      );

      if (origen.length > 0) {
        estado_origen = origen[0].ESTADO_EQUIPO_ORIGEN;
        obs_origen = origen[0].OBSERVACIONES_ORIGEN;
        protocolo_origen = origen[0].PROTOCOLO_ORIGEN;
      }
    }

    let context = {
      IDT: info_prot[0].TR_TAREA_ID,
      TR_GERENCIA: info_prot[0].TR_GERENCIA,
      TR_AREA: info_prot[0].TR_AREA,
      TR_SECTOR: info_prot[0].TR_SECTOR,
      FECHA: info_prot[0].FECHA,
      TAREATIPO: info_prot[0].TR_PROT_TAREATIPO,
      TR_PROT_DESC_TAREATIPO: info_prot[0].TR_PROT_DESC_TAREATIPO,
      TR_EQUIPO_COD: info_prot[0].TR_EQUIPO_COD,
      TR_PROT_ID: info_prot[0].TR_PROT_ID,
      TR_PROT_DESC_PROT: info_prot[0].TR_PROT_DESC_PROT,
      TR_ESTADO: info_prot[0].TR_ESTADO,
      prot: info_prot,
      img: img, 
      imagenes: imagenes,
      turno: turno,
      fechaturno: fechaturno,
      spci: spci,
      fechaspci: fechaspci,
      clienteAprob: clienteAprob,
      fechacliente: fechacliente,
      tarea_origen: tarea_origen,
      estado_origen: estado_origen,
      obs_origen: obs_origen,
      protocolo_origen: protocolo_origen,
      imagenes_origen: imagenes_origen
    }

    let template = hbs.compile(html1);
    let html2 = template(context);
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox','--disable-image-cache']
    });

    const page = await browser.newPage();
    
    await page.setContent(html2, {
        waitUntil: 'networkidle0'
    });
    

    
    const buffer = await page.pdf(options);
    
    fs.writeFile("src/pdf/" + IDT + "_" + CODIGO + ".pdf", buffer, () => console.log('PDF guardado'));
    
    // const fileName = IDT + "_" + CODIGO + ".pdf";

    // res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.send(buffer);

    const fileName = IDT + "_" + CODIGO + ".pdf";

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
    
    await browser.close();

  } catch (error) {
    console.log(error);
  }

});

router.get("/pdfa/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_A']), async (req, res) => {
  try {

    const { IDT, CODIGO } = req.params;
    const consultaImagenes = await pool.query("SELECT Archivos FROM Adjuntos WHERE Id_Tarea IN (?)", [IDT]);
    let archivo;
    if (consultaImagenes.length > 0) {
      archivo = consultaImagenes[0].Archivos;
    } else {
      archivo = '';
    }
    const imagenes = [];

    if (archivo && archivo.length > 0) {
      const img = archivo.split('|');
      const rutaImagenes = path.resolve(__dirname, "../images/");

      const images = img.map((imgNombre) => {
        const imagePath = path.join(rutaImagenes, `${IDT}_${imgNombre}`);

        try {
          const imageData = fs.readFileSync(imagePath);
          const base64Image = Buffer.from(imageData).toString('base64');
          return 'data:image/png;base64,' + base64Image;
        } catch (err) {
          // Imagen no encontrada, se omite
          return null;
        }
      }).filter(img => img !== null); // Filtra las imágenes que sí se pudieron cargar

      imagenes.push(...images);
    }
    
    const info_prot = await pool.query("SELECT\n" +
      " Tareas.Id AS TR_TAREA_ID,\n" +
      " date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
      " Protocolos.Id AS 'TR_PROT_ID',\n" +
      " TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
      " UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
      " Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
      " Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
      " Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
      " UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
      " Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
      " Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
      " Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
      " TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
      " TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
      " Estados.Descripcion AS 'TR_ESTADO',\n" +
      " CONVERT ( CAST( CONVERT ( IF ( Tarea_Respuesta.Respuesta = 'SC', 'No aplica',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SSR', 'Sistema sin revisar.', IF(Tarea_Respuesta.Respuesta = 'SOP', 'Sistema operativo',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SOCO', 'Sist. operativo con obs.', IF(Tarea_Respuesta.Respuesta = 'SFS', 'Sist. fuera de serv.',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 ) AS BINARY ) USING UTF8 ) AS 'TR_RESPUESTA',\n" +
      " Usuarios.Descripcion AS 'TR_TECNICO',\n" +
      " UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
      " IF ( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
      " TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
      " TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
      " IF( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
      " Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
      " EQ.SecDESC AS 'TR_SECTOR',\n" +
      " EQ.AreaDESC AS 'TR_AREA',\n" +
      " EQ.GerDESC AS 'TR_GERENCIA' \n" +
      " FROM\n" +
      " Protocolos\n" +
      " INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
      " INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
      " INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
      " INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
      " AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
      " INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
      " INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
      " INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
      " AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
      " AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
      " INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
      " INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
      " INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
      " LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
      " LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
      " INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
      " INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
      " INNER JOIN (\n" +
      " SELECT\n" +
      " E.Id 'EqID',\n" +
      " S.Descripcion 'SecDESC',\n" +
      " A.Descripcion 'AreaDESC',\n" +
      " G.Descripcion 'GerDESC',\n" +
      " C.Descripcion 'CteDESC' \n" +
      " FROM\n" +
      " Equipos E\n" +
      " INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
      " INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
      " INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
      " INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
      " ) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
      " WHERE \n" +
      " Tareas.Id = "+IDT+" \n" +
      " ORDER BY TR_PROT_DESC_CAPI  ASC, \n" +
      " FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC;"
    );

    let turno;
    let fechaturno;

    const liderTurno = await pool.query(`
      SELECT
        U.Descripcion AS TURNO,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_comentario = 'Validada por lider turno'
        AND TE.te_Estado_val_lider_turno = 1
        AND H.ht_id = ?
      LIMIT 1;
    `, [IDT]);
    
      if (liderTurno.length > 0) {
        turno = liderTurno[0].TURNO;
        const fechaObj = new Date(liderTurno[0].FECHA);
        fechaturno = fechaObj.toLocaleString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false // Usa formato 24 horas
        });  
      } else {
        turno = ''; 
      }
    
    let spci;
    let fechaspci;

    const liderSpci = await pool.query(`
      SELECT
        U.Descripcion AS SPCI,
				H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_id = ?
				AND H.ht_comentario = 'Validada por lider spci' 
        AND TE.te_Estado_val = 1
        AND TE.te_Estado_val_lider_turno=1
      LIMIT 1;
    `, [IDT]);  

    if (liderSpci.length > 0) {
      spci = liderSpci[0].SPCI;
      const fechaObj = new Date(liderSpci[0].FECHA);
      fechaspci = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      spci = ''; 
    }
    
    let clienteAprob;
    let fechacliente;

    const aprobCliente = await pool.query(`
       SELECT
        U.Descripcion AS CLIENTE,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE 
        TE.te_Id_aux_estado = 4
        AND TE.te_Id_Tarea = ?
        AND H.ht_comentario = 'Tarea validada por cliente'  
    `, [IDT]);

    if (aprobCliente.length > 0) {
      clienteAprob = aprobCliente[0].CLIENTE;
      const fechaObj = new Date(aprobCliente[0].FECHA);
      fechacliente = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      clienteAprob = ''; 
    }

    const ruta =  path.resolve(__dirname ,"../pdf/" + IDT + "_"+CODIGO+".pdf");
    const estado = info_prot[0].TR_ESTADO;
    const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs"); 
    const html1 = fs.readFileSync(filePathName, "utf8");
    const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
    const imageBuffer = fs.readFileSync(ruta_imagen);
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const img = 'data:image/png;base64,'+base64Image;

    const TR_PROT_DESC_TAREATIPO = info_prot[0].TR_PROT_DESC_TAREATIPO;
    const TR_EQUIPO_COD= info_prot[0].TR_EQUIPO_COD;
    const TR_GERENCIA = info_prot[0].TR_GERENCIA;
    const TR_AREA = info_prot[0].TR_AREA;
    const TR_SECTOR = info_prot[0].TR_SECTOR;
    const TR_ESTADO = info_prot[0].TR_ESTADO;

    const options = {
      format: 'letter',
      printBackground: true,
      margin: {
        top: '160px', 
        right: '20px',
        bottom: '70px',
        left: '20px',
      },
      displayHeaderFooter: true,
      headerTemplate: `
      <style>
        .site-header { 
          border-bottom: 1px solid rgb(227, 227, 227); 
          margin-top: 20px;
          margin-left: 25px;
          padding-bottom: 10px;
          font-family: Verdana, Geneva, Tahoma, sans-serif;
          color: #2b2d42;
          display: flex; 
          justify-content: space-between; 
          width: 93%;
        } 

        .site-identity img { 
          max-width: 200px; 
          margin-top: -15px;
        }

        .text_header { 
          word-wrap: break-word; 
          max-width: calc(100% - 180px); 
        }

        .text_header h6 { 
          font-size: 10px; 
          margin: 0 0 0 5px; 
          display: inline-block; 
        }

        .text_header label { 
          font-size: 10px; 
          margin: 5px 0 0 5px; 
          display: inline-block; 
        }
        
      </style>
      <div class="site-header">
          <div class="text_header">
            <h6>PROTOCOLO Nº: ${IDT} / ${TR_PROT_DESC_TAREATIPO}</h6><br>
            <h6>TAG:</h6><label>${TR_EQUIPO_COD}</label><br>
            <h6>GERENCIA:</h6><label>${TR_GERENCIA}</label><br>
            <h6>AREA:</h6><label>${TR_AREA}</label><br>
            <h6>SECTOR:</h6><label>${TR_SECTOR}</label><br>
            <h6>ESTADO:</h6><label>${TR_ESTADO}</label>
          </div>
          <div class="site-identity">
            <img src="${img}" alt="Imagen">
          </div>
        </div>   
        `,
      footerTemplate: `
        <div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px; margin: 0 auto;">
          <center>SAPMA-Sercoing | Tarea Nº: ${IDT} | Estado: ${estado} | Página <span class="pageNumber"></span> de <span class="totalPages"></span></center>
        </div>
      `,
    };

    const reparaciones = await pool.query('SELECT Id_Tarea_Origen FROM Tareas_Reparaciones WHERE Id_Tarea_Nueva = ?', [IDT]);

    let tarea_origen = null;
    let estado_origen = null;
    let obs_origen = null;
    let protocolo_origen = null;
    const imagenes_origen = [];

    if (reparaciones.length > 0) {
      tarea_origen = reparaciones[0].Id_Tarea_Origen;
      const consultaImagenes_origen =  await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea IN (?)", [tarea_origen]);
      let archivo_origen;
      if (consultaImagenes_origen.length > 0) {
        archivo_origen = consultaImagenes_origen[0].Archivos;
      } else {
        archivo_origen = '';
      }


      if (archivo_origen && archivo_origen.length > 0) {
        const img_origen = archivo_origen.split('|');
        const rutaImagenes_origen = path.resolve(__dirname, "../images/");

        const images_origen = img_origen.map((imgNombre) => {
          const imagePath_origen = path.join(rutaImagenes_origen, `${tarea_origen}_${imgNombre}`);

          try {
            const imageData_origen = fs.readFileSync(imagePath_origen);
            const base64Image_origen = Buffer.from(imageData_origen).toString('base64');
            return 'data:image/png;base64,' + base64Image_origen;
          } catch (err) {
            // Imagen no encontrada, se omite
            return null;
          }
        }).filter(img => img_origen !== null); // Filtra las imágenes que sí se pudieron cargar

        imagenes_origen.push(...images_origen);
      }

      const origen = await pool.query(
        `
          SELECT
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
                        IF(TD.tdet_Estado_Equipo = 'SOCO', 'Sist. operativo con obs.', IF(TD.tdet_Estado_Equipo = 'SFS', 'Sist. fuera de serv.', IF(TD.tdet_Estado_Equipo = 'SNO', 'Sist. no operativo', TD.tdet_Estado_Equipo)))
                      )
                    )
                  ) USING UTF8
                ) AS BINARY
              ) USING UTF8
            ) AS ESTADO_EQUIPO_ORIGEN,
            TD.tdet_Observaciones_Estado AS OBSERVACIONES_ORIGEN,
            TP.Descripcion AS PROTOCOLO_ORIGEN
          FROM
            Tareas_Detalle TD
            INNER JOIN Tareas T ON T.Id = TD.tdet_Id_Tarea
            INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
            INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo 
          WHERE
            TD.tdet_Id_Tarea =  ?
        `,
        [tarea_origen]
      );

      if (origen.length > 0) {
        estado_origen = origen[0].ESTADO_EQUIPO_ORIGEN;
        obs_origen = origen[0].OBSERVACIONES_ORIGEN;
        protocolo_origen = origen[0].PROTOCOLO_ORIGEN;
      }
    }

    let context = {
      IDT: info_prot[0].TR_TAREA_ID,
      TR_GERENCIA: info_prot[0].TR_GERENCIA,
      TR_AREA: info_prot[0].TR_AREA,
      TR_SECTOR: info_prot[0].TR_SECTOR,
      FECHA: info_prot[0].FECHA,
      TAREATIPO: info_prot[0].TR_PROT_TAREATIPO,
      TR_PROT_DESC_TAREATIPO: info_prot[0].TR_PROT_DESC_TAREATIPO,
      TR_EQUIPO_COD: info_prot[0].TR_EQUIPO_COD,
      TR_PROT_ID: info_prot[0].TR_PROT_ID,
      TR_PROT_DESC_PROT: info_prot[0].TR_PROT_DESC_PROT,
      TR_ESTADO: info_prot[0].TR_ESTADO,
      prot: info_prot,
      img: img, 
      imagenes: imagenes,
      turno: turno,
      fechacliente: fechacliente,
      spci: spci,
      fechaspci: fechaspci,
      clienteAprob: clienteAprob,
      fechacliente: fechacliente,
      tarea_origen: tarea_origen,
      estado_origen: estado_origen,
      obs_origen: obs_origen,
      protocolo_origen: protocolo_origen,
      imagenes_origen: imagenes_origen
    }

    let template = hbs.compile(html1);
    let html2 = template(context);
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox','--disable-image-cache']
    });

    const page = await browser.newPage();
    
    await page.setContent(html2, {
        waitUntil: 'networkidle0'
    });
    

    
    const buffer = await page.pdf(options);
    
    fs.writeFile("src/pdf/" + IDT + "_" + CODIGO + ".pdf", buffer, () => console.log('PDF guardado'));
    
    // const fileName = IDT + "_" + CODIGO + ".pdf";

    // res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.send(buffer);

    const fileName = IDT + "_" + CODIGO + ".pdf";

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
    
    await browser.close();

  } catch (error) {
    console.log(error);
  }

});

router.get("/pdfd/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_D']), async (req, res) => {
  try {

    const { IDT, CODIGO } = req.params;
    const consultaImagenes = await pool.query("SELECT Archivos FROM Adjuntos WHERE Id_Tarea IN (?)", [IDT]);
    let archivo;
    if (consultaImagenes.length > 0) {
      archivo = consultaImagenes[0].Archivos;
    } else {
      archivo = '';
    }
    const imagenes = [];

    if (archivo && archivo.length > 0) {
      const img = archivo.split('|');
      const rutaImagenes = path.resolve(__dirname, "../images/");

      const images = img.map((imgNombre) => {
        const imagePath = path.join(rutaImagenes, `${IDT}_${imgNombre}`);

        try {
          const imageData = fs.readFileSync(imagePath);
          const base64Image = Buffer.from(imageData).toString('base64');
          return 'data:image/png;base64,' + base64Image;
        } catch (err) {
          // Imagen no encontrada, se omite
          return null;
        }
      }).filter(img => img !== null); // Filtra las imágenes que sí se pudieron cargar

      imagenes.push(...images);
    }
    
    const info_prot = await pool.query("SELECT\n" +
      " Tareas.Id AS TR_TAREA_ID,\n" +
      " date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
      " Protocolos.Id AS 'TR_PROT_ID',\n" +
      " TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
      " UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
      " Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
      " Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
      " Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
      " UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
      " Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
      " Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
      " Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
      " TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
      " TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
      " Estados.Descripcion AS 'TR_ESTADO',\n" +
      " CONVERT ( CAST( CONVERT ( IF ( Tarea_Respuesta.Respuesta = 'SC', 'No aplica',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SSR', 'Sistema sin revisar.', IF(Tarea_Respuesta.Respuesta = 'SOP', 'Sistema operativo',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SOCO', 'Sist. operativo con obs.', IF(Tarea_Respuesta.Respuesta = 'SFS', 'Sist. fuera de serv.',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 ) AS BINARY ) USING UTF8 ) AS 'TR_RESPUESTA',\n" +
      " Usuarios.Descripcion AS 'TR_TECNICO',\n" +
      " UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
      " IF ( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
      " TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
      " TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
      " IF( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
      " Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
      " EQ.SecDESC AS 'TR_SECTOR',\n" +
      " EQ.AreaDESC AS 'TR_AREA',\n" +
      " EQ.GerDESC AS 'TR_GERENCIA' \n" +
      " FROM\n" +
      " Protocolos\n" +
      " INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
      " INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
      " INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
      " INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
      " AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
      " INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
      " INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
      " INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
      " AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
      " AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
      " INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
      " INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
      " INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
      " LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
      " LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
      " INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
      " INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
      " INNER JOIN (\n" +
      " SELECT\n" +
      " E.Id 'EqID',\n" +
      " S.Descripcion 'SecDESC',\n" +
      " A.Descripcion 'AreaDESC',\n" +
      " G.Descripcion 'GerDESC',\n" +
      " C.Descripcion 'CteDESC' \n" +
      " FROM\n" +
      " Equipos E\n" +
      " INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
      " INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
      " INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
      " INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
      " ) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
      " WHERE \n" +
      " Tareas.Id = "+IDT+" \n" +
      " ORDER BY TR_PROT_DESC_CAPI  ASC, \n" +
      " FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC;"
    );

    let turno;
    let fechaturno;

    const liderTurno = await pool.query(`
      SELECT
        U.Descripcion AS TURNO,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_comentario = 'Validada por lider turno'
        AND TE.te_Estado_val_lider_turno = 1
        AND H.ht_id = ?
      LIMIT 1;
    `, [IDT]);
    
      if (liderTurno.length > 0) {
        turno = liderTurno[0].TURNO;
        const fechaObj = new Date(liderTurno[0].FECHA);
        fechaturno = fechaObj.toLocaleString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false // Usa formato 24 horas
        });  
      } else {
        turno = ''; 
      }
    
    let spci;
    let fechaspci;

    const liderSpci = await pool.query(`
      SELECT
        U.Descripcion AS SPCI,
				H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_id = ?
				AND H.ht_comentario = 'Validada por lider spci' 
        AND TE.te_Estado_val = 1
        AND TE.te_Estado_val_lider_turno=1
      LIMIT 1;
    `, [IDT]);  

    if (liderSpci.length > 0) {
      spci = liderSpci[0].SPCI;
      const fechaObj = new Date(liderSpci[0].FECHA);
      fechaspci = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      spci = ''; 
    }
    
    let clienteAprob;
    let fechacliente;

    const aprobCliente = await pool.query(`
       SELECT
        U.Descripcion AS CLIENTE,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE 
        TE.te_Id_aux_estado = 4
        AND TE.te_Id_Tarea = ?
        AND H.ht_comentario = 'Tarea validada por cliente'  
    `, [IDT]);

    if (aprobCliente.length > 0) {
      clienteAprob = aprobCliente[0].CLIENTE;
      const fechaObj = new Date(aprobCliente[0].FECHA);
      fechacliente = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      clienteAprob = ''; 
    }

    const ruta =  path.resolve(__dirname ,"../pdf/" + IDT + "_"+CODIGO+".pdf");
    const estado = info_prot[0].TR_ESTADO;
    const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs"); 
    const html1 = fs.readFileSync(filePathName, "utf8");
    const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
    const imageBuffer = fs.readFileSync(ruta_imagen);
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const img = 'data:image/png;base64,'+base64Image;

    const TR_PROT_DESC_TAREATIPO = info_prot[0].TR_PROT_DESC_TAREATIPO;
    const TR_EQUIPO_COD= info_prot[0].TR_EQUIPO_COD;
    const TR_GERENCIA = info_prot[0].TR_GERENCIA;
    const TR_AREA = info_prot[0].TR_AREA;
    const TR_SECTOR = info_prot[0].TR_SECTOR;
    const TR_ESTADO = info_prot[0].TR_ESTADO;

    const options = {
      format: 'letter',
      printBackground: true,
      margin: {
        top: '160px', 
        right: '20px',
        bottom: '70px',
        left: '20px',
      },
      displayHeaderFooter: true,
      headerTemplate: `
      <style>
        .site-header { 
          border-bottom: 1px solid rgb(227, 227, 227); 
          margin-top: 20px;
          margin-left: 25px;
          padding-bottom: 10px;
          font-family: Verdana, Geneva, Tahoma, sans-serif;
          color: #2b2d42;
          display: flex; 
          justify-content: space-between; 
          width: 93%;
        } 

        .site-identity img { 
          max-width: 200px; 
          margin-top: -15px;
        }

        .text_header { 
          word-wrap: break-word; 
          max-width: calc(100% - 180px); 
        }

        .text_header h6 { 
          font-size: 10px; 
          margin: 0 0 0 5px; 
          display: inline-block; 
        }

        .text_header label { 
          font-size: 10px; 
          margin: 5px 0 0 5px; 
          display: inline-block; 
        }
        
      </style>
      <div class="site-header">
          <div class="text_header">
            <h6>PROTOCOLO Nº: ${IDT} / ${TR_PROT_DESC_TAREATIPO}</h6><br>
            <h6>TAG:</h6><label>${TR_EQUIPO_COD}</label><br>
            <h6>GERENCIA:</h6><label>${TR_GERENCIA}</label><br>
            <h6>AREA:</h6><label>${TR_AREA}</label><br>
            <h6>SECTOR:</h6><label>${TR_SECTOR}</label><br>
            <h6>ESTADO:</h6><label>${TR_ESTADO}</label>
          </div>
          <div class="site-identity">
            <img src="${img}" alt="Imagen">
          </div>
        </div>   
        `,
      footerTemplate: `
        <div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px; margin: 0 auto;">
          <center>SAPMA-Sercoing | Tarea Nº: ${IDT} | Estado: ${estado} | Página <span class="pageNumber"></span> de <span class="totalPages"></span></center>
        </div>
      `,
    };

    const reparaciones = await pool.query('SELECT Id_Tarea_Origen FROM Tareas_Reparaciones WHERE Id_Tarea_Nueva = ?', [IDT]);

    let tarea_origen = null;
    let estado_origen = null;
    let obs_origen = null;
    let protocolo_origen = null;
    const imagenes_origen = [];

    if (reparaciones.length > 0) {
      tarea_origen = reparaciones[0].Id_Tarea_Origen;
      const consultaImagenes_origen =  await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea IN (?)", [tarea_origen]);
      let archivo_origen;
      if (consultaImagenes_origen.length > 0) {
        archivo_origen = consultaImagenes_origen[0].Archivos;
      } else {
        archivo_origen = '';
      }


      if (archivo_origen && archivo_origen.length > 0) {
        const img_origen = archivo_origen.split('|');
        const rutaImagenes_origen = path.resolve(__dirname, "../images/");

        const images_origen = img_origen.map((imgNombre) => {
          const imagePath_origen = path.join(rutaImagenes_origen, `${tarea_origen}_${imgNombre}`);

          try {
            const imageData_origen = fs.readFileSync(imagePath_origen);
            const base64Image_origen = Buffer.from(imageData_origen).toString('base64');
            return 'data:image/png;base64,' + base64Image_origen;
          } catch (err) {
            // Imagen no encontrada, se omite
            return null;
          }
        }).filter(img => img_origen !== null); // Filtra las imágenes que sí se pudieron cargar

        imagenes_origen.push(...images_origen);
      }

      const origen = await pool.query(
        `
          SELECT
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
                        IF(TD.tdet_Estado_Equipo = 'SOCO', 'Sist. operativo con obs.', IF(TD.tdet_Estado_Equipo = 'SFS', 'Sist. fuera de serv.', IF(TD.tdet_Estado_Equipo = 'SNO', 'Sist. no operativo', TD.tdet_Estado_Equipo)))
                      )
                    )
                  ) USING UTF8
                ) AS BINARY
              ) USING UTF8
            ) AS ESTADO_EQUIPO_ORIGEN,
            TD.tdet_Observaciones_Estado AS OBSERVACIONES_ORIGEN,
            TP.Descripcion AS PROTOCOLO_ORIGEN
          FROM
            Tareas_Detalle TD
            INNER JOIN Tareas T ON T.Id = TD.tdet_Id_Tarea
            INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
            INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo 
          WHERE
            TD.tdet_Id_Tarea =  ?
        `,
        [tarea_origen]
      );

      if (origen.length > 0) {
        estado_origen = origen[0].ESTADO_EQUIPO_ORIGEN;
        obs_origen = origen[0].OBSERVACIONES_ORIGEN;
        protocolo_origen = origen[0].PROTOCOLO_ORIGEN;
      }
    }

    let context = {
      IDT: info_prot[0].TR_TAREA_ID,
      TR_GERENCIA: info_prot[0].TR_GERENCIA,
      TR_AREA: info_prot[0].TR_AREA,
      TR_SECTOR: info_prot[0].TR_SECTOR,
      FECHA: info_prot[0].FECHA,
      TAREATIPO: info_prot[0].TR_PROT_TAREATIPO,
      TR_PROT_DESC_TAREATIPO: info_prot[0].TR_PROT_DESC_TAREATIPO,
      TR_EQUIPO_COD: info_prot[0].TR_EQUIPO_COD,
      TR_PROT_ID: info_prot[0].TR_PROT_ID,
      TR_PROT_DESC_PROT: info_prot[0].TR_PROT_DESC_PROT,
      TR_ESTADO: info_prot[0].TR_ESTADO,
      prot: info_prot,
      img: img, 
      imagenes: imagenes,
      turno: turno,
      fechaturno: fechaturno,
      spci: spci,
      fechaspci: fechaspci,
      fechacliente: fechacliente,
      clienteAprob: clienteAprob,
      tarea_origen: tarea_origen,
      estado_origen: estado_origen,
      obs_origen: obs_origen,
      protocolo_origen: protocolo_origen,
      imagenes_origen: imagenes_origen
    }

    let template = hbs.compile(html1);
    let html2 = template(context);
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox','--disable-image-cache']
    });

    const page = await browser.newPage();
    
    await page.setContent(html2, {
        waitUntil: 'networkidle0'
    });
    

    
    const buffer = await page.pdf(options);
    
    fs.writeFile("src/pdf/" + IDT + "_" + CODIGO + ".pdf", buffer, () => console.log('PDF guardado'));
    
    // const fileName = IDT + "_" + CODIGO + ".pdf";

    // res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.send(buffer);

    const fileName = IDT + "_" + CODIGO + ".pdf";

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
    
    await browser.close();

  } catch (error) {
    console.log(error);
  }

});

router.get("/pdfe/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_E']), async (req, res) => {
  try {

    const { IDT, CODIGO } = req.params;
    const consultaImagenes = await pool.query("SELECT Archivos FROM Adjuntos WHERE Id_Tarea IN (?)", [IDT]);
    let archivo;
    if (consultaImagenes.length > 0) {
      archivo = consultaImagenes[0].Archivos;
    } else {
      archivo = '';
    }
    const imagenes = [];

    if (archivo && archivo.length > 0) {
      const img = archivo.split('|');
      const rutaImagenes = path.resolve(__dirname, "../images/");

      const images = img.map((imgNombre) => {
        const imagePath = path.join(rutaImagenes, `${IDT}_${imgNombre}`);

        try {
          const imageData = fs.readFileSync(imagePath);
          const base64Image = Buffer.from(imageData).toString('base64');
          return 'data:image/png;base64,' + base64Image;
        } catch (err) {
          // Imagen no encontrada, se omite
          return null;
        }
      }).filter(img => img !== null); // Filtra las imágenes que sí se pudieron cargar

      imagenes.push(...images);
    }
    
    const info_prot = await pool.query("SELECT\n" +
      " Tareas.Id AS TR_TAREA_ID,\n" +
      " date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
      " Protocolos.Id AS 'TR_PROT_ID',\n" +
      " TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
      " UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
      " Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
      " Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
      " Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
      " UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
      " Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
      " Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
      " Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
      " TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
      " TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
      " Estados.Descripcion AS 'TR_ESTADO',\n" +
      " CONVERT ( CAST( CONVERT ( IF ( Tarea_Respuesta.Respuesta = 'SC', 'No aplica',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SSR', 'Sistema sin revisar.', IF(Tarea_Respuesta.Respuesta = 'SOP', 'Sistema operativo',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SOCO', 'Sist. operativo con obs.', IF(Tarea_Respuesta.Respuesta = 'SFS', 'Sist. fuera de serv.',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 ) AS BINARY ) USING UTF8 ) AS 'TR_RESPUESTA',\n" +
      " Usuarios.Descripcion AS 'TR_TECNICO',\n" +
      " UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
      " IF ( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
      " TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
      " TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
      " IF( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
      " Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
      " EQ.SecDESC AS 'TR_SECTOR',\n" +
      " EQ.AreaDESC AS 'TR_AREA',\n" +
      " EQ.GerDESC AS 'TR_GERENCIA' \n" +
      " FROM\n" +
      " Protocolos\n" +
      " INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
      " INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
      " INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
      " INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
      " AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
      " INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
      " INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
      " INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
      " AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
      " AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
      " INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
      " INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
      " INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
      " LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
      " LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
      " INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
      " INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
      " INNER JOIN (\n" +
      " SELECT\n" +
      " E.Id 'EqID',\n" +
      " S.Descripcion 'SecDESC',\n" +
      " A.Descripcion 'AreaDESC',\n" +
      " G.Descripcion 'GerDESC',\n" +
      " C.Descripcion 'CteDESC' \n" +
      " FROM\n" +
      " Equipos E\n" +
      " INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
      " INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
      " INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
      " INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
      " ) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
      " WHERE \n" +
      " Tareas.Id = "+IDT+" \n" +
      " ORDER BY TR_PROT_DESC_CAPI  ASC, \n" +
      " FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC;"
    );
    let turno;
    let fechaturno;

    const liderTurno = await pool.query(`
      SELECT
        U.Descripcion AS TURNO,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_comentario = 'Validada por lider turno'
        AND TE.te_Estado_val_lider_turno = 1
        AND H.ht_id = ?
      LIMIT 1;
    `, [IDT]);
    
      if (liderTurno.length > 0) {
        turno = liderTurno[0].TURNO;
        const fechaObj = new Date(liderTurno[0].FECHA);
        fechaturno = fechaObj.toLocaleString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false // Usa formato 24 horas
        });  
      } else {
        turno = ''; 
      }
    
    let spci;
    let fechaspci;

    const liderSpci = await pool.query(`
      SELECT
        U.Descripcion AS SPCI,
				H.ht_fecha AS FECHA
      FROM
        Historia_tareas H 
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE
        H.ht_id = ?
				AND H.ht_comentario = 'Validada por lider spci' 
        AND TE.te_Estado_val = 1
        AND TE.te_Estado_val_lider_turno=1
      LIMIT 1;
    `, [IDT]);  

    if (liderSpci.length > 0) {
      spci = liderSpci[0].SPCI;
      const fechaObj = new Date(liderSpci[0].FECHA);
      fechaspci = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      spci = ''; 
    }
    
    let clienteAprob;
    let fechacliente;

    const aprobCliente = await pool.query(`
       SELECT
        U.Descripcion AS CLIENTE,
        H.ht_fecha AS FECHA
      FROM
        Historia_tareas H
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
        INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = H.ht_id
      WHERE 
        TE.te_Id_aux_estado = 4
        AND TE.te_Id_Tarea = ?
        AND H.ht_comentario = 'Tarea validada por cliente'  
    `, [IDT]);

    if (aprobCliente.length > 0) {
      clienteAprob = aprobCliente[0].CLIENTE;
      const fechaObj = new Date(aprobCliente[0].FECHA);
      fechacliente = fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Usa formato 24 horas
      });  
    } else {
      clienteAprob = ''; 
    }

    const ruta =  path.resolve(__dirname ,"../pdf/" + IDT + "_"+CODIGO+".pdf");
    const estado = info_prot[0].TR_ESTADO;
    const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs"); 
    const html1 = fs.readFileSync(filePathName, "utf8");
    const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
    const imageBuffer = fs.readFileSync(ruta_imagen);
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const img = 'data:image/png;base64,'+base64Image;

    const TR_PROT_DESC_TAREATIPO = info_prot[0].TR_PROT_DESC_TAREATIPO;
    const TR_EQUIPO_COD= info_prot[0].TR_EQUIPO_COD;
    const TR_GERENCIA = info_prot[0].TR_GERENCIA;
    const TR_AREA = info_prot[0].TR_AREA;
    const TR_SECTOR = info_prot[0].TR_SECTOR;
    const TR_ESTADO = info_prot[0].TR_ESTADO;

    const options = {
      format: 'letter',
      printBackground: true,
      margin: {
        top: '160px', 
        right: '20px',
        bottom: '70px',
        left: '20px',
      },
      displayHeaderFooter: true,
      headerTemplate: `
      <style>
        .site-header { 
          border-bottom: 1px solid rgb(227, 227, 227); 
          margin-top: 20px;
          margin-left: 25px;
          padding-bottom: 10px;
          font-family: Verdana, Geneva, Tahoma, sans-serif;
          color: #2b2d42;
          display: flex; 
          justify-content: space-between; 
          width: 93%;
        } 

        .site-identity img { 
          max-width: 200px; 
          margin-top: -15px;
        }

        .text_header { 
          word-wrap: break-word; 
          max-width: calc(100% - 180px); 
        }

        .text_header h6 { 
          font-size: 10px; 
          margin: 0 0 0 5px; 
          display: inline-block; 
        }

        .text_header label { 
          font-size: 10px; 
          margin: 5px 0 0 5px; 
          display: inline-block; 
        }
        
      </style>
      <div class="site-header">
          <div class="text_header">
            <h6>PROTOCOLO Nº: ${IDT} / ${TR_PROT_DESC_TAREATIPO}</h6><br>
            <h6>TAG:</h6><label>${TR_EQUIPO_COD}</label><br>
            <h6>GERENCIA:</h6><label>${TR_GERENCIA}</label><br>
            <h6>AREA:</h6><label>${TR_AREA}</label><br>
            <h6>SECTOR:</h6><label>${TR_SECTOR}</label><br>
            <h6>ESTADO:</h6><label>${TR_ESTADO}</label>
          </div>
          <div class="site-identity">
            <img src="${img}" alt="Imagen">
          </div>
        </div>   
        `,
      footerTemplate: `
        <div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px; margin: 0 auto;">
          <center>SAPMA-Sercoing | Tarea Nº: ${IDT} | Estado: ${estado} | Página <span class="pageNumber"></span> de <span class="totalPages"></span></center>
        </div>
      `,
    };

    const reparaciones = await pool.query('SELECT Id_Tarea_Origen FROM Tareas_Reparaciones WHERE Id_Tarea_Nueva = ?', [IDT]);

    let tarea_origen = null;
    let estado_origen = null;
    let obs_origen = null;
    let protocolo_origen = null;
    const imagenes_origen = [];

    if (reparaciones.length > 0) {
      tarea_origen = reparaciones[0].Id_Tarea_Origen;
      const consultaImagenes_origen =  await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea IN (?)", [tarea_origen]);
      let archivo_origen;
      if (consultaImagenes_origen.length > 0) {
        archivo_origen = consultaImagenes_origen[0].Archivos;
      } else {
        archivo_origen = '';
      }


      if (archivo_origen && archivo_origen.length > 0) {
        const img_origen = archivo_origen.split('|');
        const rutaImagenes_origen = path.resolve(__dirname, "../images/");

        const images_origen = img_origen.map((imgNombre) => {
          const imagePath_origen = path.join(rutaImagenes_origen, `${tarea_origen}_${imgNombre}`);

          try {
            const imageData_origen = fs.readFileSync(imagePath_origen);
            const base64Image_origen = Buffer.from(imageData_origen).toString('base64');
            return 'data:image/png;base64,' + base64Image_origen;
          } catch (err) {
            // Imagen no encontrada, se omite
            return null;
          }
        }).filter(img => img_origen !== null); // Filtra las imágenes que sí se pudieron cargar

        imagenes_origen.push(...images_origen);
      }

      const origen = await pool.query(
        `
          SELECT
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
                        IF(TD.tdet_Estado_Equipo = 'SOCO', 'Sist. operativo con obs.', IF(TD.tdet_Estado_Equipo = 'SFS', 'Sist. fuera de serv.', IF(TD.tdet_Estado_Equipo = 'SNO', 'Sist. no operativo', TD.tdet_Estado_Equipo)))
                      )
                    )
                  ) USING UTF8
                ) AS BINARY
              ) USING UTF8
            ) AS ESTADO_EQUIPO_ORIGEN,
            TD.tdet_Observaciones_Estado AS OBSERVACIONES_ORIGEN,
            TP.Descripcion AS PROTOCOLO_ORIGEN
          FROM
            Tareas_Detalle TD
            INNER JOIN Tareas T ON T.Id = TD.tdet_Id_Tarea
            INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
            INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo 
          WHERE
            TD.tdet_Id_Tarea =  ?
        `,
        [tarea_origen]
      );

      if (origen.length > 0) {
        estado_origen = origen[0].ESTADO_EQUIPO_ORIGEN;
        obs_origen = origen[0].OBSERVACIONES_ORIGEN;
        protocolo_origen = origen[0].PROTOCOLO_ORIGEN;
      }
    }

    let context = {
      IDT: info_prot[0].TR_TAREA_ID,
      TR_GERENCIA: info_prot[0].TR_GERENCIA,
      TR_AREA: info_prot[0].TR_AREA,
      TR_SECTOR: info_prot[0].TR_SECTOR,
      FECHA: info_prot[0].FECHA,
      TAREATIPO: info_prot[0].TR_PROT_TAREATIPO,
      TR_PROT_DESC_TAREATIPO: info_prot[0].TR_PROT_DESC_TAREATIPO,
      TR_EQUIPO_COD: info_prot[0].TR_EQUIPO_COD,
      TR_PROT_ID: info_prot[0].TR_PROT_ID,
      TR_PROT_DESC_PROT: info_prot[0].TR_PROT_DESC_PROT,
      TR_ESTADO: info_prot[0].TR_ESTADO,
      prot: info_prot,
      img: img, 
      imagenes: imagenes,
      turno: turno,
      fechaturno: fechaturno,
      spci: spci,
      fechaspci: fechaspci,
      clienteAprob: clienteAprob,
      fechacliente: fechacliente,
      tarea_origen: tarea_origen,
      estado_origen: estado_origen,
      obs_origen: obs_origen,
      protocolo_origen: protocolo_origen,
      imagenes_origen: imagenes_origen
    }

    let template = hbs.compile(html1);
    let html2 = template(context);
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox','--disable-image-cache']
    });

    const page = await browser.newPage();
    
    await page.setContent(html2, {
        waitUntil: 'networkidle0'
    });

    
    const buffer = await page.pdf(options);
    
    fs.writeFile("src/pdf/" + IDT + "_" + CODIGO + ".pdf", buffer, () => console.log('PDF guardado'));
    
    // const fileName = IDT + "_" + CODIGO + ".pdf";

    // res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.send(buffer);

    const fileName = IDT + "_" + CODIGO + ".pdf";

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
    
    await browser.close();

  } catch (error) {
    console.log(error);
  }

});

router.post('/resumen_detalle', isLoggedIn, async (req, res) => {
    try {
      const {id} = req.body;
      const gTarea = await pool.query("SELECT\n" +
      "VD.TAREA,\n" +
      "VD.SERVICIO,\n" +
      "VD.CODIGO,\n" +
      "E.Descripcion AS EQUIPO,\n" +
      "date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
      "VD.TECNICO,\n" +
      "VD.ESTADO_TAREA\n" +
      "FROM\n" +
      "	VIEW_DetalleEquiposDET VD \n" +
      "	INNER JOIN Equipos E ON E.Codigo = VD.CODIGO\n" +
      "WHERE\n" +
      "	VD.TAREA = ?", [id]);
      console.log(gTarea[0]);
      res.json(gTarea[0]);

    } catch (error) {
      console.log(error);  
    }
});

router.get('/detalle_tareas', isLoggedIn, authRole(['Admincli', 'Plan', 'Supervisor', 'Operaciones']), async function (req, res) {
  res.render('protocolos/ingreso');
});

router.post('/info_tarea', isLoggedIn, authRole(['Admincli', 'Plan','Supervisor', 'Operaciones']), async function (req, res) {

  try {

    const {Id} = req.body;

    const consulta = await pool.query(
      "SELECT\n" +
      "	VTD.idTarea AS ID,\n" +
      "	date_format( VTD.tareaFecha, '%d-%m-%Y' ) AS FECHA,\n" +
      "	VTD.codigoEquipo AS EQUIPO,\n" +
      "	VTD.tagDmh AS TAG_DMH,\n" +
      "	E.Descripcion AS ESTADO_TAREA,\n" +
      "	P.Id AS ID_PROTOCOLO,\n" +
      "	P.Descripcion AS PROTOCOLO,\n" +
      "	U.Login AS TECNICO,\n" +
      "	VTD.gerencia AS GERENCIA,\n" +
      "	VTD.area AS AREA,\n" +
      "	VTD.sector AS SECTOR,\n" +
      "CASE\n" +
      "		\n" +
      "		WHEN TLC.Id_Tarea IS NOT NULL THEN\n" +
      "		1 ELSE 0 \n" +
      "	END AS CAMBIOS \n" +
      "FROM\n" +
      "	VIEW_tareasDET VTD\n" +
      "	INNER JOIN Protocolos P ON P.Id = VTD.idProtocolo\n" +
      "	INNER JOIN Estados E ON E.Id = VTD.tareaEstado\n" +
      "	INNER JOIN Tareas T ON T.Id = VTD.idTarea\n" +
      "	INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
      "	LEFT JOIN Tareas_log_cambios TLC ON TLC.Id_Tarea = VTD.idTarea \n" +
      "WHERE\n" +
      "	VTD.idTarea = ? \n" +
      "	LIMIT 1;", [Id]
    );

    if (!consulta){
      res.json({ title: "Sin Información." });
    }else{
      res.json(consulta);
      console.log(consulta);
    }
    
  } catch (error) {
     
    console.log(error);

  }

});

router.post('/ver_cambios', isLoggedIn, authRole(['Admincli', 'Plan', 'Supervisor','Operaciones']), async function (req, res) { 
  try {
  
    const {Id} = req.body;

    const consulta = await pool.query(
      "SELECT\n" +
      " date_format( Fecha, '%d-%m-%Y' ) AS FECHA,\n" +
      "	Usuario AS USUARIO,\n" +
      "	Campos_actualizar AS RUTA,\n" +
      "	Actual AS ORIGINAL,\n" +
      "	Nuevo AS CAMBIO\n" +
      "FROM\n" +
      "	Tareas_log_cambios\n" +
      "WHERE\n" +
      "	Id_tarea = ?;", [Id]
    );
   
    if (!consulta){
      res.json({name: "Sin Informacion"})
    }else{
      res.json(consulta)
    }
  
  } catch (error) {

    console.log(error);
  
  }
});

router.post('/consulProt', isLoggedIn, authRole(['Plan', 'Admincli', 'Supervisor', 'Operaciones']), async function (req, res) {

  try {

    const {id, idProtocolo} = req.body;

    const info = await pool.query("SELECT\n" +
      "	PC.Descripcion AS DESC_CAPITULO,\n" +
      "	PCA.Descripcion AS DESC_CAPTURA,\n" +
      "	TR.Capitulo AS TR_CAPITULO,\n" +
      "	TR.Correlativo AS TR_CORRELATIVO,\n" +
      "	TR.Respuesta AS TR_RESPUESTA,\n" +
      "	T.Opciones AS TIPO \n" +
      "FROM\n" +
      "	Tarea_Respuesta TR\n" +
      "	INNER JOIN Protocolo_Capturas PCA ON PCA.Capitulo = TR.Capitulo \n" +
      "	AND PCA.Correlativo = TR.Correlativo\n" +
      "	INNER JOIN Protocolo_Capitulo PC ON PC.Id_Protocolo = PCA.Id_Protocolo \n" +
      "	AND PC.Capitulo = PCA.Capitulo\n" +
      "	INNER JOIN TipoRespuesta T ON T.Id = PCA.Id_TipoRespuesta \n" +
      "WHERE\n" +
      "	TR.Id_Tarea = ? \n" +
      "	AND PCA.Id_Protocolo = ?;", [id,idProtocolo]
    );

    if (!info){

      res.json({tittle: "No se encuentra informacion de la tarea"});

    }else{

      const groupedData = info.reduce((result, currentItem) => {
        const chapter = currentItem.DESC_CAPITULO;

        if (!result[chapter]) {
          result[chapter] = [];
        }
      
        const { DESC_CAPITULO, ...rest } = currentItem;
      
        result[chapter].push(rest);
      
        return result;
      }, {});

      const finalResult = Object.keys(groupedData).map(chapter => {

        return {
          DESC_CAPITULO: chapter,
          items: groupedData[chapter]

        };
      });      
      
     res.json(finalResult);

    } 

    
  } catch (error) {
    
    console.log(error);

  }

});

router.post('/consultaImagenes', isLoggedIn, authRole(['Plan', 'Admincli', 'Operaciones']), async (req, res) => {
  try {
    const { Id } = req.body;

    const consultaImagenes = await pool.query(
      "SELECT Archivos FROM Adjuntos WHERE Id_Tarea = ?;",
      [Id]
    );

    const imagenes = [];
    const archivosValidos = [];

    if (Array.isArray(consultaImagenes) && consultaImagenes.length > 0) {
      const rutaImagenes = path.resolve(__dirname, "../images");

      consultaImagenes.forEach(row => {
        const nombres = row.Archivos.split('|').filter(Boolean);

        nombres.forEach(filename => {
          const rutaCompleta = path.join(rutaImagenes, `${Id}_${filename}`);
          console.log("Ruta completa:", rutaCompleta); // Debugging line
          if (fs.existsSync(rutaCompleta)) {
            imagenes.push(`/images/${Id}_${filename}`);
            archivosValidos.push(filename);
          }
        });
      });
    }

    // Convertimos el array a una cadena con "|"
    const archivos = archivosValidos.join('|');
            console.log("Archivos:", archivos);
    console.log("Imagenes:", imagenes); 

    return res.json({ imagenes: imagenes, archivos: archivos });

  } catch (error) {
    console.error("Error en /consultaImagenes:", error);
    return res
      .status(500)
      .json({ message: "Hubo un error al obtener las imágenes." });
  }
});

router.post('/updateData', isLoggedIn, authRole(['Admincli', 'Plan', 'Operaciones']), uploadForUpdate.array('newImages'), async function (req, res) {
  try {
    const { inputs, changes, images } = req.body;
    const parsedInputs = JSON.parse(inputs);
    const parsedChanges = JSON.parse(changes);
    console.log(images);
    const Id_Tarea = parsedInputs[0].Id_Tarea;
    const {Login} = req.user;
    const date = new Date();

    const updateQuery = `
      UPDATE Tarea_Respuesta 
      SET Respuesta = ? 
      WHERE Id_Tarea = ? AND Capitulo = ? AND Correlativo = ?
    `;

    for (const input of parsedInputs) {
      const { Respuesta, Id_Tarea, Capitulo, Correlativo } = input;

      await new Promise((resolve, reject) => {
        pool.query(updateQuery, [Respuesta, Id_Tarea, Capitulo, Correlativo], (queryError, results) => {
          if (queryError) {
            return reject(queryError);
          }
          resolve(results);
        });
      });
    }

    parsedChanges.forEach(async (change) => {

      const query = 'INSERT INTO Tareas_log_cambios (Id_Tarea, Fecha, Usuario, Campos_actualizar, Actual, Nuevo) VALUES (?,?,?,?,?,?)';
      const values = [Id_Tarea, date, Login, change.field, change.originalValue, change.newValue];
  
      try {
          await pool.query(query, values); 
          console.log('Insert exitoso');
      } catch (error) {
          console.error('Error al insertar:', error);
      }
    });

    const act_sop = await pool.query(`UPDATE Tareas_Detalle
      INNER JOIN (
        SELECT
          T.Id,
          COALESCE ( MAX( CASE WHEN PCA.Descripcion = '1. Estado' THEN TR.Respuesta END ), '- INC -' ) AS EstadoEquipo ,
          T.Id_Estado
        FROM
          Tareas T
          INNER JOIN Protocolo_Capitulo PC ON T.Id_Protocolo = PC.Id_Protocolo
          INNER JOIN Protocolo_Capturas PCA ON PCA.Id_Protocolo = T.Id_Protocolo 
          AND PCA.Capitulo = PC.Capitulo
          LEFT JOIN Tarea_Respuesta TR ON TR.Id_Tarea = T.Id 
          AND TR.Capitulo = PC.Capitulo 
          AND TR.Correlativo = PCA.Correlativo 
        WHERE
          T.Id IN ( ? ) 
          AND PCA.Descripcion IN ( '1. Estado' ) 
        GROUP BY
          T.Id 
        ) 
        AS ACT ON ACT.Id = tdet_Id_Tarea 
        SET tdet_Estado_Equipo = EstadoEquipo 
      WHERE
        tdet_Id_Tarea > 1;`, [Id_Tarea]
    );

    const act_est = await pool.query(`UPDATE Tareas_Detalle
      INNER JOIN (
        SELECT
          T.Id,
        CASE
            
            WHEN COALESCE ( MAX( CASE WHEN PCA.Descripcion = '2. Observaciones EST' THEN TR.Respuesta END ), '- INC -' ) = 'SC' THEN
              '-' ELSE COALESCE ( MAX( CASE WHEN PCA.Descripcion = '2. Observaciones EST' THEN TR.Respuesta END ), '- INC -' ) 
            END AS Obs_EstadoEquipo,
            T.Id_Estado 
          FROM
            Tareas T
            INNER JOIN Protocolo_Capitulo PC ON T.Id_Protocolo = PC.Id_Protocolo
            INNER JOIN Protocolo_Capturas PCA ON PCA.Id_Protocolo = T.Id_Protocolo 
            AND PCA.Capitulo = PC.Capitulo
            LEFT JOIN Tarea_Respuesta TR ON TR.Id_Tarea = T.Id 
            AND TR.Capitulo = PC.Capitulo 
            AND TR.Correlativo = PCA.Correlativo 
            WHERE
            T.Id IN (?) 
            AND PCA.Descripcion IN ( '2. Observaciones EST' ) 
          GROUP BY
            T.Id 
            
          ) AS ACT ON ACT.Id = tdet_Id_Tarea 
          SET tdet_Observaciones_Estado = Obs_EstadoEquipo 
        WHERE
          tdet_Id_Tarea > 1;`, [Id_Tarea]
    );

    const update = await pool.query('UPDATE Tareas_Detalle SET tdet_Estado_Equipo = null, tdet_Observaciones_Estado = null WHERE tdet_Id_tarea = ?;', [Id_Tarea]);   

    if (images.length >= 0) {
        const updateAdjuntos = await pool.query(`UPDATE Adjuntos SET Archivos = ? WHERE Id_Tarea = ?;`, [images, Id_Tarea]);
    }

    if (req.files && req.files.length > 0) {
        const savedFilenames = req.files.map(f => f.originalname);
        const rows = await pool.query('SELECT Archivos FROM Adjuntos WHERE Id_Tarea = ?', [Id_Tarea]);
        if (rows.length === 0){
          const nuevo = savedFilenames.join('|');
          await pool.query('INSERT INTO Adjuntos (Id_Tarea, Archivos) VALUES (?,?);', [Id_Tarea, nuevo])
        }
    }
    const act_tarea_detalle = await pool.query('call sp_ActualizarTareaDetalle();');

    res.send('ok');
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      res.status(500).send('Error al actualizar los datos');
    }
  }
});


router.get('/tarea_manual', isLoggedIn, authRole(['Admincli', 'Plan', 'Supervisor', 'Operaciones']), async (req, res) => {
  const gerencias = await pool.query("SELECT\n" +
    "	Id,\n" +
    "	Descripcion \n" +
    "FROM\n" +
    "	Gerencias ;"
  );

  const tecnicos = await pool.query(`
    SELECT
      Id, 
      Login
    FROM
      Usuarios 
    WHERE
      Id_Perfil = 3 
      AND Login NOT LIKE '%test%'
      AND Login NOT LIKE '%rvegs001%';`
  );

  const tipo_emergente = await pool.query(`
    SELECT
      Id,
      Descripcion 
    FROM
      TipoContingente
    `
  );

  res.render('protocolos/manual', {gerencias: gerencias, tecnicos: tecnicos, tipo_emergente: tipo_emergente});
});

router.post('/respuesta_manual', isLoggedIn, authRole(['Admincli', 'Plan','Supervisor', 'Operaciones']), async (req, res) => {
  
  try {

    const {tarea, date1, date2} = req.body;
  
    if (tarea){

      const consulta = await pool.query(`
         SELECT
          VTD.idTarea AS ID,
          date_format( VTD.tareaFecha, '%d-%m-%Y' ) AS FECHA,
          VTD.codigoEquipo AS EQUIPO,
          VTD.tagDmh AS TAG_DMH,
          E.Descripcion AS ESTADO_TAREA,
          P.Id AS ID_PROTOCOLO,
          P.Descripcion AS PROTOCOLO,
          U.Login AS TECNICO,
          VTD.gerencia AS GERENCIA,
          VTD.area AS AREA,
          VTD.sector AS SECTOR
        FROM
          VIEW_tareasDET VTD
          INNER JOIN Protocolos P ON P.Id = VTD.idProtocolo
          INNER JOIN Estados E ON E.Id = VTD.tareaEstado
          INNER JOIN Tareas T ON T.Id = VTD.idTarea
          INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico
        WHERE
          VTD.tareaEstado IN (1, 2)
          AND VTD.idTarea = ?;
        `, [tarea]);

        if (!consulta){
          res.json({ mensaje: "Esta tarea no cumple con los criterios para ser completada de forma manual." });
        }else{
          res.json(consulta);
        }
      
    }else{
      
      const consulta = await pool.query(`
        SELECT
         VTD.idTarea AS ID,
         date_format( VTD.tareaFecha, '%d-%m-%Y' ) AS FECHA,
         VTD.codigoEquipo AS EQUIPO,
         VTD.tagDmh AS TAG_DMH,
         E.Descripcion AS ESTADO_TAREA,
         P.Id AS ID_PROTOCOLO,
         P.Descripcion AS PROTOCOLO,
         U.Login AS TECNICO,
         VTD.gerencia AS GERENCIA,
         VTD.area AS AREA,
         VTD.sector AS SECTOR
       FROM
         VIEW_tareasDET VTD
         INNER JOIN Protocolos P ON P.Id = VTD.idProtocolo
         INNER JOIN Estados E ON E.Id = VTD.tareaEstado
         INNER JOIN Tareas T ON T.Id = VTD.idTarea
         INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico
       WHERE
         VTD.tareaEstado IN (1, 2)
          AND VTD.tareaFecha BETWEEN ? AND ?
          ORDER BY VTD.tareaFecha DESC
       `, [date1, date2]);

       if (!consulta){
         res.json({ mensaje: "No hay tareas en el rango seleccionado." });
       }else{
         res.json(consulta);
       }


    }
    
  } catch (error) { 

    console.log(error);
  
  }
});

router.post('/respuesta_manual_id', isLoggedIn, authRole(['Admincli', 'Plan', 'Supervisor', 'Operaciones']), async (req, res) => {
  
  try {

    const {idProt} = req.body;

    const info = await pool.query(`SELECT
        PC.Descripcion AS CAPITULO,
        PC.Capitulo AS Id_CAPITULO,
        PCA.Correlativo AS ID_CORRELATIVO,
        PCA.Descripcion AS CORRELATIVO,
        TP.Opciones AS TIPO_RESPUESTA
      FROM
        Protocolo_Capitulo PC 
        INNER JOIN Protocolo_Capturas PCA ON PCA.Id_Protocolo = PC.Id_Protocolo AND PCA.Capitulo = PC.Capitulo
        INNER JOIN TipoRespuesta TP ON TP.Id = PCA.Id_TipoRespuesta
      WHERE
        PC.Id_Protocolo = ?`, [idProt]
        
    );

    

    if (!info){

      res.json({tittle: "No se encuentra protocolo"});

    }else{

      const groupedData = info.reduce((result, currentItem) => {
        const chapter = currentItem.CAPITULO;

        if (!result[chapter]) {
          result[chapter] = [];
        }
      
        const { CAPITULO, ...rest } = currentItem;
      
        result[chapter].push(rest);
      
        return result;
      }, {});

      const finalResult = Object.keys(groupedData).map(chapter => {

        return {
          CAPITULO: chapter,
          items: groupedData[chapter]

        };
      });      

     res.json(finalResult);

    } 

    
  } catch (error) {
    
    console.log(error);

  }

});

router.post('/nueva_respuesta', isLoggedIn, authRole(['Admincli', 'Plan', 'Supervisor', 'Operaciones']), upload.array('images[]', 10), async (req, res) => {
    
  try {

        const data = JSON.parse(req.body.data);
        const { Id_Tarea } = req.body;
        const {Id} = req.user;

        const consulta_estado = await pool.query(`SELECT Id_Estado FROM Tareas WHERE Id = ?`, [Id_Tarea]);

        const estado = consulta_estado[0].Id_Estado;

        for (const chapter of data) {
            for (const item of chapter) {
                const { tareaId, idCapitulo, idCorrelativo, respuesta } = item;

                const primera = await pool.query('INSERT INTO Tarea_Respuesta (Id_Tarea, Capitulo, Correlativo, Id_Equipo, Respuesta) VALUES (?, ?, ?, ?, ?)', 
                [tareaId, idCapitulo, idCorrelativo, 0,  respuesta]);

            }
        }


        const segunda = await pool.query('UPDATE Tareas SET Id_Estado = 5 WHERE Id = ?;', [Id_Tarea]);  

        const titulo = "Sube protocolo"
        const obs = "Sube protocolo (W)";
        const fechaActualizada = new Date();

        const tercera = await pool.query(`INSERT INTO Historia_tareas (ht_id, ht_usuario, ht_titulo, ht_fecha, ht_comentario)
        VALUES (?, ?, ?, ?, ?);`,[Id_Tarea, Id, titulo, fechaActualizada, obs ]);

        if (req.files && req.files.length > 0) {
          const fileNames = req.files.map((file, index) => {
              const fileName = `${Id_Tarea}_${index}.jpg`; 
              return fileName;
          });

          const archivosConcatenados = fileNames.join('|');

          await pool.query('INSERT INTO Adjuntos (Id_Tarea, Archivos) VALUES (?, ?)', [Id_Tarea, archivosConcatenados]);

        }

        const act_tarea_detalle = await pool.query('call sp_ActualizarTareaDetalle();');

        res.status(200).json({ message: 'Datos e imágenes procesados correctamente.' });
    } catch (error) {
        console.error('Error al procesar los datos:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud.' });
    }

});

router.post('/crear_emergente', isLoggedIn, authRole(['Admincli', 'Plan', 'Supervisor', 'Operaciones']), async (req, res) => {

  try {

    const {fecha, tecnico, protocolo, equipo, tipo_emergente} = req.body;
    console.log(req.body);
    const {usuario, Id_Cliente, Id} = req.user;

    await pool.query(`INSERT INTO Tareas (Fecha, Id_Tecnico, Id_Equipo, Id_Protocolo, Contingente, Prueba) VALUES (?, ?, ?, ?, ?, 0);`,[fecha, tecnico, equipo, protocolo, tipo_emergente], async (err, results) => {
      if (err) {
        console.error('Error al insertar la tarea:', err);
        res.status(500).json({ error: 'Error al insertar la tarea.' });
      } else {

        const nueva_tarea = results.insertId;
        const contingente = req.body.tipo_emergente;
        console.log(contingente);

        if (contingente > 0) { 
            const titulo = "Tarea creada";
            const comentario = "Tarea emergente (W)";
            const fechaActual = new Date();
            
            const log = await pool.query(
                `INSERT INTO Historia_tareas (ht_id, ht_usuario, ht_titulo, ht_fecha, ht_comentario) VALUES (?, ?, ?, ?, ?)`, 
                [nueva_tarea, Id, titulo, fechaActual, comentario]
            );
            
            const cuarta = await pool.query(
                `UPDATE Tareas SET Contingente_Web = 1 WHERE Id= ?`, 
                [nueva_tarea]
            );
        
        } else {
            const titulo = "Tarea creada";
            const comentario = "Sin observaciones";
            const fechaActual = new Date();
            
            const log = await pool.query(
                `INSERT INTO Historia_tareas (ht_id, ht_usuario, ht_titulo, ht_fecha, ht_comentario) VALUES (?, ?, ?, ?, ?)`, 
                [nueva_tarea, Id, titulo, fechaActual, comentario]
            );
        }
      

        const actualizacion = await pool.query(`
          UPDATE Tareas_Estado SET te_usuario = ?, te_metodo = ? WHERE te_Id_Tarea = ?
          `, [usuario, 'M-E', nueva_tarea]
        );

        res.status(200).json(nueva_tarea);

        const tareas = await pool.query(
          "SELECT\n" +
          "	T.Id AS ID,\n" +
          "	DATE_FORMAT(T.Fecha, '%Y-%m-%d') AS FECHA,\n" +
          "	U.Descripcion AS TECNICO,\n" +
          "	E.Descripcion AS ESTADO,\n" +
          "	EQ.Codigo AS EQUIPO,\n" +
          "	TP.Descripcion AS TIPO,\n" +
          "	P.Descripcion AS PROTOCOLO \n" +
          "FROM\n" +
          "	Tareas T\n" +
          "	INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
          "	INNER JOIN Estados E ON E.Id = T.Id_Estado\n" +
          "	INNER JOIN Equipos EQ ON EQ.Id = T.Id_Equipo\n" +
          "	INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo \n" +
          "	INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
          "WHERE\n" +
          "	T.Id IN (?)\n" +
          "ORDER BY T.Fecha ASC;", [nueva_tarea]
        );

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
                Creado_por: usuario
            });
        } 

        var wb = XLSX.utils.book_new();
        var ws = XLSX.utils.json_to_sheet(info);

        var range = XLSX.utils.decode_range(ws['!ref']);
        var colWidths = [];
        for (var col = range.s.c; col <= range.e.c; col++) {
            var maxWidth = 0;
            for (var row = range.s.r; row <= range.e.r; row++) {
                var cell_address = {c:col, r:row};
                var cell_ref = XLSX.utils.encode_cell(cell_address);
                var cell = ws[cell_ref];
                if (cell) {
                    var cellValue = cell.v.toString();
                    if (cellValue.length > maxWidth) {
                        maxWidth = cellValue.length;
                    }
                }
            }
            colWidths.push({wch:maxWidth});
        }

        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws);

        var buffer = XLSX.write(wb, {type:'buffer', bookType:'xlsx'});    
        const datemail = new Date().toLocaleDateString('en-GB');
        const filePathName1 = path.resolve(__dirname, "../views/email/tareas.hbs"); 
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
        const {Email} = req.user;  
        await transporter.sendMail({
        from: "SAPMA DRT <notificaciones@sercoing.cl>",
        // to: "marancibia@sercoing.cl",
        to: [email_plan, Email],
        bcc: "notificaciones.sapma@sercoing.cl",
        subject: "Tareas Emergente Creada",
        html,
        attachments: [
            {
            filename: "imagen1.png",
            path: "./src/public/img/imagen1.png",
            cid: "imagen1",

            },
            {
            filename: 'tarea_'+datemail+'.xlsx',
            content: buffer
            }
        ],
        });

      }
    });
    
  } catch (error) {
    
    console.log(error);

  }

});

router.post('/historial', isLoggedIn, authRole(['Admincli', 'Plan', 'Supervisor', 'Operaciones']), async (req, res) => {
  
  try {

    const {idTarea} = req.body;

    const consulta = await pool.query(`
      SELECT
        H.ht_id AS ID,
        H.ht_fecha AS FECHA,
        H.ht_titulo AS TITULO,
        H.ht_comentario AS COMENTARIO,
        U.Descripcion AS USUARIO
      FROM
        Historia_tareas H
        INNER JOIN Usuarios U ON U.Id = H.ht_usuario
      WHERE
        H.ht_id = ?
        ORDER BY H.ht_fecha ASC;
    `, [idTarea])

    if (!consulta){
      res.json({ title: "Sin Información." });
    }else{
      res.json(consulta);
    }

  } catch (error) {

    console.log(error);

  }
});

module.exports = router;


