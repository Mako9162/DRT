const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole } = require('../lib/rol');
const nodemailer = require('nodemailer');
const hbs = require("handlebars");
const fs = require("fs");
const path = require("path"); 
const ExcelJS = require('exceljs');
const moment = require('moment');

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

router.get('/aprobadas', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan', 'Supervisor']), async (req, res)=>{
    res.render( 'aprob/aprobadas');
});

router.post('/aprobadas', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan', 'Supervisor']), async (req, res)=>{
    
    try {
        const {tarea, date1, date2} = req.body;
        const {Id, Id_Perfil} = req.user;
        const test = '%test';

        switch (Id_Perfil) {
            case 2:
            case 6:
            case 9:
            case 11:

            if (tarea > 0){

                const aprob = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", ?, NULL, NULL, NULL, ?, ?, NULL, NULL);',
                    [tarea, test, Id_Perfil]
                );
    
                if(!aprob){
                    res.json({ title: "No se encuentran tareas en el rango seleccionado!!!" });
                }else{
                    res.json(aprob[0]);
                }

            }else{

                const aprob = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", NULL, NULL, ?, ?, ?, ?, NULL, NULL);',
                    [date1, date2, test, Id_Perfil]
                );
    
                if(!aprob){
                    res.json({ title: "No se encuentran tareas en el rango seleccionado!!!" });
                }else{
                    res.json(aprob[0]);
                }

            }
            
            break;

            case 4:
            case 5:
            case 7:
            case 8:
            case 10:

            if (tarea > 0){

                const aprob = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", ?, NULL, NULL, NULL, ?, ?, ?, NULL );',
                    [tarea, test, Id_Perfil, Id]
                );
    
                if(!aprob){
                    res.json({ title: "No se encuentran tareas en el rango seleccionado!!!" });
                }else{
                    res.json(aprob[0]);
                }

            }else{

                const aprob = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", NULL, NULL, ?, ?, ?, ?, ?, NULL );',
                    [date1, date2, test, Id_Perfil, Id]
                );
    
                if(!aprob){
                    res.json({ title: "No se encuentran tareas en el rango seleccionado!!!" });
                }else{
                    res.json(aprob[0]);
                }

            }

            break;
            
        }

    } catch (error) {
        console.log(error);
    }

});

router.get('/aprobaciones', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan', 'Supervisor']), async (req, res)=>{

    try {

        const {Id, Id_Perfil} = req.user;
        const test = '%test';

        switch (Id_Perfil) {
            case 2:
            case 6:
            case 9:

                const actualizar_tareas1 = await pool.query('CALL sp_ActualizarTareaDetalle();');
        
                const aprobaciones1 = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", NULL, NULL, NULL, NULL, ?, ?, NULL, 0 );',
                    [test, Id_Perfil]
                );
        
                if (!aprobaciones1) {
                    res.render('aprob/aprob', { Mensaje: "Sin Tareas Pendientes" });
                } else {
                    res.render('aprob/aprob', { aprob: aprobaciones1[0] });
                }

                break;
            case 4:
            case 5:
            case 7:
            case 8:
            case 10:
            case 11:
  
                const actualizar_tareas2 = await pool.query('CALL sp_ActualizarTareaDetalle();');
            
                const aprobaciones2 = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", NULL, NULL, NULL, NULL, ?, ?, ?, 0 );',
                    [test, Id_Perfil, Id]
                );
        
                if (!aprobaciones2) {
                    res.render('aprob/aprob', { Mensaje: "Sin Tareas Pendientes" });
                } else {
                    res.render('aprob/aprob', { aprob: aprobaciones2[0] });
                }

                break;
        }
        

    } catch (error) {
        
        console.log(error);

    }
    
});

router.post('/aprobaciones', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan', 'Supervisor']), async (req, res)=>{

    try {

        const idt = (req.body.idt);
        const id_user = req.user.Id;
        const Login = req.user.usuario;
        var data = [];
        var est_or= "Terminada validada";

        if (req.body['datos']) {
            for (var i = 0; i < req.body['datos'].length; i++) {
              var tarea = {
                Tarea: req.body['datos'][i]['idt'],
                Fecha: req.body['datos'][i]['fecha'],
                Estado_de_Tarea: est_or,
                Tipo_de_servicio: req.body['datos'][i]['tipo'],
                Codigo_Sapma: req.body['datos'][i]['tag'],
                Tag_DMH: req.body['datos'][i]['tag_dmh'],
                Gerencia: req.body['datos'][i]['ger'],
                Area: req.body['datos'][i]['area'],
                Sector: req.body['datos'][i]['sector'],
                Detalle_de_ubicacion: req.body['datos'][i]['ubi'],
                Ubicacion_tecnica: req.body['datos'][i]['tec'],
                Estado_equipo: req.body['datos'][i]['estequi'],
                Observacion_equipo: req.body['datos'][i]['estadoequi'],
                Repuesto: req.body['datos'][i]['repu'],
                Observacion: req.body['datos'][i]['obs'],
                Fecha_aprobacion: req.body['datos'][i]['clientDate'],
                Aprobado_por: Login
              };
              data.push(tarea);
            }
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(path.resolve(__dirname, "../plantillas/aprobaciones.xlsx"));
        const worksheet = workbook.getWorksheet(1);        
        let fila = 5; 

        data.forEach((dato) => {
            worksheet.getCell('A' + fila).value = dato.Tarea;
            worksheet.getCell('B' + fila).value = dato.Fecha;
            worksheet.getCell('C' + fila).value = dato.Estado_de_Tarea;
            worksheet.getCell('D' + fila).value = dato.Tipo_de_servicio;
            worksheet.getCell('E' + fila).value = dato.Codigo_Sapma;
            worksheet.getCell('E' + fila).value = dato.Tag_DMH;
            worksheet.getCell('F' + fila).value = dato.Gerencia;
            worksheet.getCell('G' + fila).value = dato.Area;
            worksheet.getCell('H' + fila).value = dato.Sector;
            worksheet.getCell('I' + fila).value = dato.Detalle_de_ubicacion;
            worksheet.getCell('J' + fila).value = dato.Ubicacion_tecnica;
            worksheet.getCell('K' + fila).value = dato.Estado_equipo;
            worksheet.getCell('L' + fila).value = dato.Observacion_equipo;
            worksheet.getCell('M' + fila).value = dato.Repuesto;
            worksheet.getCell('N' + fila).value = dato.Observacion;
            worksheet.getCell('O' + fila).value = dato.Fecha_aprobacion;
            worksheet.getCell('P' + fila).value = dato.Aprobado_por;
            fila++; // Avanza a la siguiente fila
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const datas = Object.values(req.body);
        const data1 = datas[0];
        const {Id_Cliente} = req.user;
        const arreglo1 = idt;
        const arreglo2 = req.body.obsd;
        const obs = "APROBADA | "+arreglo2;
        const arreglo3 = arreglo1.map(Number);
        const date = new Date();
        var arreglo4 = arreglo3.map((item, index) => {
            return [arreglo2[index]];
        });

        const fechaActual = new Date();
        const titulo = "Aprobada por cliente";
        const obsHisto = "Tarea validada por cliente";
    
        const sql = `
        INSERT INTO Historia_tareas (ht_id, ht_usuario, ht_titulo, ht_fecha, ht_comentario)
        VALUES (?, ?, ?, ?, ?)
        `;

        for (const tarea of idt) {
             const idTarea  = tarea;
            await pool.query(sql, [idTarea, id_user, titulo, fechaActual, obsHisto]);
        }

        const act1 = await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo3]);
        const act2 = await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3]);

        let queries = '';

        arreglo4.forEach(function(item) {
            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+'APROBADA | '+item+"' WHERE Val_tarea_id = ?; "; 
        });

        await pool.query(queries, arreglo3);

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
            "						T.Id IN ( "+arreglo3+" ) \n" +
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
        const filePathName1 = path.resolve(__dirname, "../views/email/emailcli.hbs"); 
        const mensaje = fs.readFileSync(filePathName1, "utf8");

        const template = hbs.compile(mensaje);
        const context = {
        datemail, 
        };
        const html = template(context);

        await transporter.sendMail({
            from: "SAPMA DRT <notificaciones@sercoing.cl>",
            //to: "marancibia@sercoing.cl",
            to: arremailp,
            cc: [arremail, arremailgen],
            bcc: correo,
            subject: "Tareas Aprobadas",
            html,
            attachments: [
                {
                filename: "imagen1.png",
                path: "./src/public/img/imagen1.png",
                cid: "imagen1",
                },
                {
                filename: 'aprobaciones_'+datemail+'.xlsx',
                content: buffer
                }
            ],
        });

        res.send('ok');

    } catch (error) {
        console.log(error);

    }

});

router.get('/validacion_ssr', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {

    try {

        const consulta = await pool.query(`
            SELECT
                VD.TAREA AS TAREA,
                date_format( VD.FECHA, '%d-%m-%Y' ) AS FECHA,
                VD.ESTADO_TAREA AS ESTADO_TAREA,
                VD.SERVICIO AS SERVICIO,
                VD.CODIGO AS CODIGO,
                VD.GERENCIA AS GERENCIA,
                VD.AREA AS AREA,
                VD.SECTOR AS SECTOR,
                VD.DETALLE_UBICACION AS DETALLE,
                VD.UBICACION_TECNICA AS TECNICA,
            IF
                (
                    VD.ESTADO_EQUIPO = 'SC',
                    'No aplica',
                IF
                    (
                        VD.ESTADO_EQUIPO = 'SSR',
                        'Sistema sin revisar.',
                    IF
                        (
                            VD.ESTADO_EQUIPO = 'SOP',
                            'Sistema operativo',
                        IF
                            (
                                VD.ESTADO_EQUIPO = 'SOCO',
                                'Sist. operativo con obs.',
                            IF
                                (
                                    VD.ESTADO_EQUIPO = 'SFS',
                                    'Sist. fuera de serv.',
                                IF
                                ( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS 'ESTADO_EQUIPO',
            IF
                (
                    VD.OBS_ESTADO_EQUIPO = 'SC',
                    '',
                    CONCAT(
                        UPPER(
                            LEFT (
                                REPLACE (
                                    REPLACE (
                                        REPLACE ( REPLACE ( REPLACE ( REPLACE ( VD.OBS_ESTADO_EQUIPO, 'Ã¡', 'á' ), 'Ã©', 'é' ), 'Ã­', 'í' ), 'Ã³', 'ó' ),
                                        'Ãº',
                                        'ú' 
                                    ),
                                    'Ã±',
                                    'ñ' 
                                ),
                                1 
                            )),
                        SUBSTRING(
                            REPLACE (
                                REPLACE (
                                    REPLACE ( REPLACE ( REPLACE ( REPLACE ( VD.OBS_ESTADO_EQUIPO, 'Ã¡', 'á' ), 'Ã©', 'é' ), 'Ã­', 'í' ), 'Ã³', 'ó' ),
                                    'Ãº',
                                    'ú' 
                                ),
                                'Ã±',
                                'ñ' 
                            ),
                            2 
                        ) 
                    ) 
                ) AS OBS_EQUIPO,
                VD.REPUESTOS AS REPUESTOS,
                VD.TAREA_ANTERIOR AS TAREA_ANTERIOR,
                date_format( VD.FECHA_TAREA_ANTERIOR, '%d-%m-%Y' ) AS FECHA_ANTERIOR,
            IF
                (
                    VD.EST_EQUIPO_TAREA_ANTERIOR = 'SC',
                    'No aplica',
                IF
                    (
                        VD.EST_EQUIPO_TAREA_ANTERIOR = 'SSR',
                        'Sistema sin revisar.',
                    IF
                        (
                            VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOP',
                            'Sistema operativo',
                        IF
                            (
                                VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOCO',
                                'Sist. operativo con obs.',
                            IF
                                (
                                    VD.EST_EQUIPO_TAREA_ANTERIOR = 'SFS',
                                    'Sist. fuera de serv.',
                                IF
                                ( VD.EST_EQUIPO_TAREA_ANTERIOR = 'SNO', 'Sist. no operativo', VD.EST_EQUIPO_TAREA_ANTERIOR )))))) AS 'ESTADO_EQUIPO_ANTERIOR' 
            FROM
                VIEW_DetalleEquiposDET VD
                INNER JOIN Tareas T ON T.Id = VD.TAREA
                INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA
                INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA
                INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id 
            WHERE
                T.Id_Estado = 5 
                AND TV.te_Estado_val = 1 
                AND U.Descripcion NOT LIKE '%test' 
                AND VT.Val_rechazo = 0 
                AND VD.OBS_ESTADO_EQUIPO LIKE '% | SSR' 
            ORDER BY
                TAREA DESC;
            `
        );
         
        if (!consulta){
            res.render('aprob/aprob_ssr', {Mensaje: "Sin Tareas Pendientes"});
        }else{
            res.render('aprob/aprob_ssr', { aprob: consulta});
        }
        
    } catch (error) {
        
        console.log(error);

    }
});

router.post('/apobacion_ssr', isLoggedIn, authRole(['Admincli', 'Plan','Supervisor']), async (req, res) => {
    
    const idt = (req.body.idt);
    const Login = req.user.usuario;
    var data = [];
    var est_or= "Terminada validada";
    
    if (req.body['datos']) {

      for (var i = 0; i < req.body['datos'].length; i++) {
        var tarea = {
          Tarea: req.body['datos'][i]['idt'],
          Fecha: req.body['datos'][i]['fecha'],
          Estado_de_Tarea: est_or,
          Tipo_de_servicio: req.body['datos'][i]['tipo'],
          Tag: req.body['datos'][i]['tag'],
          Gerencia: req.body['datos'][i]['ger'],
          Area: req.body['datos'][i]['area'],
          Sector: req.body['datos'][i]['sector'],
          Detalle_de_ubicacion: req.body['datos'][i]['ubi'],
          Ubicacion_tecnica: req.body['datos'][i]['tec'],
          Estado_equipo: req.body['datos'][i]['estequi'],
          Observacion_equipo: req.body['datos'][i]['estadoequi'],
          Repuesto: req.body['datos'][i]['repu'],
          Observacion: req.body['datos'][i]['obs'],
          Fecha_aprobacion: req.body['datos'][i]['clientDate'],
          Aprobado_por: Login
        };
        data.push(tarea);
      }
    }
    
    const workbook = new ExcelJS.Workbook();
    
    await workbook.xlsx.readFile(path.resolve(__dirname, "../plantillas/aprobaciones.xlsx"));

    const worksheet = workbook.getWorksheet(1);

    
    let fila = 5; 
    data.forEach((dato) => {
        worksheet.getCell('A' + fila).value = dato.Tarea;
        worksheet.getCell('B' + fila).value = dato.Fecha;
        worksheet.getCell('C' + fila).value = dato.Estado_de_Tarea;
        worksheet.getCell('D' + fila).value = dato.Tipo_de_servicio;
        worksheet.getCell('E' + fila).value = dato.Tag;
        worksheet.getCell('F' + fila).value = dato.Gerencia;
        worksheet.getCell('G' + fila).value = dato.Area;
        worksheet.getCell('H' + fila).value = dato.Sector;
        worksheet.getCell('I' + fila).value = dato.Detalle_de_ubicacion;
        worksheet.getCell('J' + fila).value = dato.Ubicacion_tecnica;
        worksheet.getCell('K' + fila).value = dato.Estado_equipo;
        worksheet.getCell('L' + fila).value = dato.Observacion_equipo;
        worksheet.getCell('M' + fila).value = dato.Repuesto;
        worksheet.getCell('N' + fila).value = dato.Observacion;
        worksheet.getCell('O' + fila).value = dato.Fecha_aprobacion;
        worksheet.getCell('P' + fila).value = dato.Aprobado_por;
        fila++; // Avanza a la siguiente fila
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
        
    const datas = Object.values(req.body);
    const data1 = datas[0];
    const {Id_Cliente} = req.user;
    const arreglo1 = idt;
    const arreglo2 = req.body.obsd;
    const obs = "APROBADA | "+arreglo2;
    const arreglo3 = arreglo1.map(Number);
    const date = new Date();
    var arreglo4 = arreglo3.map((item, index) => {
        return [arreglo2[index]];
    });

    await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo3], async (err, result) => {
        if(err){
            console.log(err);
        }else{                  
            await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
                if(err){
                    console.log(err);
                }else{
                    res.json({message: "archivo creado"});
                    let queries = '';

                    arreglo4.forEach(function(item) {
                        queries += "UPDATE Validacion_Tareas SET Val_obs = '"+'APROBADA | '+item+"' WHERE Val_tarea_id = ?; "; 
                    });
                    pool.query(queries, arreglo3, async (err, result) => {
                        if(err){
                            console.log(err);
                        }else{

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
                            const filePathName1 = path.resolve(__dirname, "../views/email/ssr.hbs"); 
                            const mensaje = fs.readFileSync(filePathName1, "utf8");
                    
                            const template = hbs.compile(mensaje);
                            const context = {
                            datemail, 
                            };
                            const html = template(context);
                    
                            await transporter.sendMail({
                            from: "SAPMA DRT <notificaciones@sercoing.cl>",
                            to: arremailp,
                            bcc: correo,
                            subject: "Tareas Validadas - SSR",
                            html,
                            attachments: [
                                {
                                filename: "imagen1.png",
                                path: "./src/public/img/imagen1.png",
                                cid: "imagen1",
                                },
                                {
                                filename: 'ssr_'+datemail+'.xlsx',
                                content: buffer
                                }
                            ],
                            });
                        }
            
                    });
                }

            });  
            
        }
    });
});

router.post('/generar_codigo', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan', 'Supervisor']), async function (req, res) {
    try {
        
        const { Id, Email, Login } = req.user;
        const datemail = moment().format('DD-MM-YYYY');

        const characters = '0123456789';
        let randomCode = '';
        for (let i = 0; i < 6; i++) {
            randomCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        const update = await pool.query('UPDATE Usuarios SET CodigoTemporal = ? WHERE Id = ?;', [randomCode, Id]);

        if (update.affectedRows > 0) {
            const filePathName1 = path.resolve(__dirname, "../views/email/codigo.hbs");
            const mensaje = fs.readFileSync(filePathName1, "utf8");
            const template = hbs.compile(mensaje);
            const context = {
                datemail,
                Login,
                randomCode
            };
            const html = template(context);
    
            await transporter.sendMail({
                from: "SAPMA DRT <notificaciones@sercoing.cl>",
                to:  Email,
                // bcc: "notificaciones.sapma@sercoing.cl",
                subject: "Codigo de validación",
                html,
                attachments: [
                    {
                        filename: "imagen1.png",
                        path: "./src/public/img/imagen1.png",
                        cid: "imagen1",
    
                    }
                ]
            });
        }

        
    } catch (error) {

        console.log(error);
        
    }
});

router.post('/verificar_codigo', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan', 'Supervisor']), async (req, res) => {
    const {codigo} = req.body;
    console.log(req.body);
    const {Id} = req.user;
    try {

        const pass = await pool.query('SELECT CodigoTemporal FROM Usuarios WHERE Id =?;', [Id]);

        if (pass[0].CodigoTemporal === codigo) {
            const update = await pool.query('UPDATE Usuarios SET CodigoTemporal = NULL WHERE Id =?;', [Id]);

            res.json({ success: true });
        }else{
            res.json({ success: false });
        }
        
    } catch (error) {

        console.log(error);
    
    }
});

module.exports = router;


   
