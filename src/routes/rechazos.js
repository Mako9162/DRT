const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole} = require('../lib/rol');
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path"); 
const hbs = require("handlebars");

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

router.get('/rechazadas', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan','Supervisor']), async (req, res)=>{
    
  try {

    const {Id_Perfil, Id} = req.user;
    const test = '%test';

    switch (Id_Perfil) {
      case 2:
      case 6:
      case 9:
      case 11:

        
        const rechazadas = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", NULL, NULL, NULL, NULL, ?, ?, NULL, 1 );',
            [test, Id_Perfil]
        );

        if (!rechazadas) {
            res.render('rechazos/rechazos', { Mensaje: "Sin Tareas Pendientes" });
        } else {
            res.render('rechazos/rechazos', { listas: rechazadas[0] });
        }

      break;
      
      case 4:
      case 5:
      case 7:
      case 8:
      case 10:

            const rechazadas1 = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", NULL, NULL, NULL, NULL, ?, ?, ?, 1 );',
                  [test, Id_Perfil, Id]
              );

              if (!rechazadas1) {
                  res.render('rechazos/rechazos', { Mensaje: "Sin Tareas Pendientes" });
              } else {
                  res.render('rechazos/rechazos', { listas: rechazadas1[0] });
              }

      break;
      
    }



  } catch (error) {
    
    console.log(error);

  }

});

router.post('/rechazos', authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan','Supervisor']), isLoggedIn, async (req, res)=>{

  try {

    const { Login, Email, Id, Id_Cliente } = req.user;
    const tareas = req.body.result; 
    
    const idTareas = tareas.map(item => item.idTarea);
    
    await pool.query("UPDATE Validacion_Tareas SET Val_rechazo = 1 WHERE Val_tarea_id IN (?)", [idTareas]);
    
    await pool.query(
        "UPDATE Validacion_Tareas SET Val_respnombre = ?, Val_fechaval_cte = NOW() WHERE Val_tarea_id IN (?)",
        [Login, idTareas]
    );
    
    const date2 = new Date().toISOString().split('T')[0]; 
    
    for (const tarea of tareas) {
        await pool.query(
            "UPDATE Validacion_Tareas SET Val_obs = CONCAT(IFNULL(Val_obs, ''), ?) WHERE Val_tarea_id = ?",
            [`${date2} RECHAZADA POR: ${Login} OBS: ${tarea.obs} | `, tarea.idTarea]
        );
    }

    const fechaActual = new Date();
    const titulo = "Rechazada por cliente";

    for (const  tarea of tareas) {
      await pool.query(
        "INSERT INTO Historia_tareas (ht_id, ht_usuario, ht_titulo, ht_fecha, ht_comentario) VALUES (?, ?, ?, ?, ?)",
          [tarea.idTarea, Id, titulo, fechaActual, tarea.obs || 'Rechazada sin observaciones', ]
      );
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

    const filePathName1 = path.resolve(__dirname, "../views/email/emailrech.hbs"); 
    const mensaje = fs.readFileSync(filePathName1, "utf8");
    const datemail = new Date().toLocaleDateString('en-GB');

    const template = hbs.compile(mensaje);
    const context = {
        datemail, 
    };
    const html = template(context);

    await transporter.sendMail({
        from: "SAPMA DRT <notificaciones@sercoing.cl>",
        to: arremailp,
        cc: Email,
        bcc: correo,
        subject: "Tareas Rechazadas",
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

router.post('/mensajerech', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan','Supervisor']), async (req, res)=>{

try {
    const {Id} = req.user;
    const { idt } = req.body;
    const tareasR = idt.map(item => item[0]);

    const queries = idt.map(item => {
        return pool.query(
            "UPDATE Validacion_Tareas SET Val_obs = ? WHERE Val_tarea_id = ?",
            [item[1], item[0]]
        );
    });

    await Promise.all(queries);

    const fechaActual = new Date();
    const titulo = "Comentario agregado";

    const queries2 = idt.map(item => {
        return pool.query(
            "INSERT INTO Historia_tareas (ht_id, ht_usuario, ht_titulo, ht_fecha, ht_comentario) VALUES (?, ?, ?, ?, ?)",
            [item[0], Id, titulo, fechaActual, item[2]]
        );
    });

    await Promise.all(queries2);

    const [emailp, Email] = await Promise.all([
      pool.query(
          "SELECT U.Id, U.Email FROM Usuarios U WHERE U.Id_Perfil = 2 AND U.Activo = 1"
      ),
      pool.query(
          "SELECT Email FROM Usuarios U INNER JOIN Validacion_Tareas VT ON VT.Val_respnombre = U.Descripcion WHERE VT.Val_tarea_id IN (?)",
          [tareasR]
      )
    ]);

    const arremailp = emailp.map(email => email.Email);
    const arreEmail = Email.map(email => email.Email);

    const filePathName1 = path.resolve(__dirname, "../views/email/emailmesj.hbs");
    const mensaje = fs.readFileSync(filePathName1, "utf8");
    const datemail = new Date().toLocaleDateString('en-GB');
    const template = hbs.compile(mensaje);
    const context = { datemail };
    const html = template(context);

    await transporter.sendMail({
        from: "SAPMA DRT <notificaciones@sercoing.cl>",
        to: arreEmail,
        cc: arremailp,
        bcc: correo,
        subject: "Notificación de Comentarios en Tareas Rechazadas",
        html,
        attachments: [
            {
                filename: "imagen1.png",
                path: "./src/public/img/imagen1.png",
                cid: "imagen1"
            }
        ]
    });

    res.send("ok");

} catch (error) {
    console.log(error);
}


});

router.post('/aprorech', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan','Supervisor']), async (req, res)=>{
    
  try {

    const {idt} = req.body;
    const {usuario, Id} = req.user;
    const tareasA = idt.map(item => item[0]);

    const actualizaTareas = await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [tareasA]);
    const actualizaValTareas = await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+usuario+"', Val_fechaval_cte = NOW(), Val_rechazo = 0 WHERE  Val_tarea_id IN (?);", [tareasA]);

    let queries = '';

    idt.forEach(function(item) {
        queries += "UPDATE Validacion_Tareas SET Val_obs = '" + item[1] + "' WHERE Val_tarea_id = " + item[0] + ";"; 
    });

    await pool.query(queries);

    const fechaActual = new Date();
    const titulo = "Aprobada por cliente";

    const queries2 = idt.map(item => {
        return pool.query(
            "INSERT INTO Historia_tareas (ht_id, ht_usuario, ht_titulo, ht_fecha, ht_comentario) VALUES (?, ?, ?, ?, ?)",
            [item[0], Id, titulo, fechaActual, item[2] || 'Tarea validada por cliente']
        );
    });

    await Promise.all(queries2);

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
      "						T.Id IN ( "+tareasA+" ) \n" +
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
      ],
    });

    res.send("ok");

  } catch (error) {
    
    console.log(error);

  } 
});

module.exports = router;


