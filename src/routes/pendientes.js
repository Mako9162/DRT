const express = require("express");
const router = express.Router();
const pool = require("../database");
const { isLoggedIn } = require("../lib/auth");
const { authRole } = require("../lib/rol");
const moment = require('moment');
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path"); 
const hbs = require("handlebars");
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer();

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

router.get('/tareas_pendientes', isLoggedIn, authRole(['Admincli', 'Plan','Supervisor']), async (req, res) => {

    const fecha_anio = await pool.query("SELECT\n" +
        "    YEAR(Fecha) AS Anio,\n" +
        "    COUNT(*) AS Cantidad\n" +
        "FROM\n" +
        "    Tareas\n" +
        " WHERE Fecha BETWEEN '2020/01/01' AND '2100/01/01'\n" +
        "GROUP BY\n" +
        "    YEAR(Fecha)\n" +
        "ORDER BY\n" +
        "    Anio"
    );

    const gerencias = await pool.query("SELECT\n" +
        "	Id,\n" +
        "	Descripcion \n" +
        "FROM\n" +
        "	Gerencias ;"
    );

    res.render("pendientes/pendientes",{
        fecha_anio: fecha_anio,
        gerencias: gerencias
    });
});

router.get('/mes/:year', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
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

router.get('/ger/:gerencia', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
  const gerencia = req.params.gerencia;
  console.log(gerencia);
  const areas = await pool.query("SELECT\n" +
    "	Id,\n" +
    "	Descripcion \n" +
    "FROM\n" +
    "	Areas \n" +
    "WHERE\n" +
    "	Id_Gerencia = ?;", [gerencia]
  );
 

  res.json(areas);

});

router.get('/area/:area', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
  const area = req.params.area;

  const sector = await pool.query("SELECT\n" +
    "	Id,\n" +
    "	Descripcion \n" +
    "FROM\n" +
    "	Sectores \n" +
    "WHERE\n" +
    "	Id_Area = ?;", [area]
  );

  res.json(sector);
  
});

router.get('/sector/:sector', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
  const sector = req.params.sector;

  const equipos = await pool.query("SELECT\n" +
    "	Id,\n" +
    "	Codigo \n" +
    "FROM\n" +
    "	Equipos \n" +
    "WHERE\n" +
    "	Id_Sector = ?;", [sector]
  );

  res.json(equipos);
  
});

router.get('/equipo_p/:equipo', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
  const equipo = req.params.equipo;

  const protocolo = await pool.query(`
    SELECT
      P.Id AS ID,
      P.Descripcion AS PROTOCOLO
    FROM
      Equipos E 
      INNER JOIN EquipoProtocolo EP ON EP.ep_id_equipo = E.Id
      INNER JOIN Protocolos P ON P.Id = EP.ep_id_protocolo
    WHERE
      E.Id = ?
      GROUP BY P.Id;
    `, [equipo]
  );

  res.json(protocolo);
  
});

router.post('/pendiente_archivo', isLoggedIn, authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
  try {

    const { ano, mes, gerencia, area, sector } = req.body;

    const f_ini = moment(`${ano}-${mes}-01`, 'YYYY-MM-DD').format('YYYY-MM-DD');
    const f_fin = moment(`${ano}-${mes}-01`, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD');

    let data;
    let query;

    switch (true) {
      case !!gerencia && !area && !sector:
        query = `
          SELECT
          T.Id AS TAREA,
          T.Fecha AS FECHA,
          T.Id_Protocolo AS ID_PROTOCOLO,
          P.DEscripcion AS PROTOCOLO,
          E.Descripcion AS ESTADO,
          VE.vce_codigo AS CODIGO,
          VE.vcgas_gerenciaN AS GERENCIA,
          VE.vcgas_areaN AS AREA,
          VE.vcgas_sectorN AS SECTOR 
          FROM Tareas T
          JOIN VIEW_tareaCliente V ON V.vtc_tareaId = T.Id
          JOIN VIEW_equiposCteGerAreSec VE ON VE.vce_idEquipo = T.Id_Equipo
          INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
          INNER JOIN Estados E ON E.Id = T.Id_Estado
          WHERE V.vtc_idCliente = 1
          AND VE.vcgas_idGerencia = ?
          AND T.Fecha BETWEEN ? AND ?
          AND T.Id_Estado IN (1, 2);`;
        data = await pool.query(query, [gerencia, f_ini, f_fin]);
        break;

      case !!gerencia && !!area && !sector:
        query = `
          SELECT
          T.Id AS TAREA,
          T.Fecha AS FECHA,
          T.Id_Protocolo AS ID_PROTOCOLO,
          P.DEscripcion AS PROTOCOLO,
          E.Descripcion AS ESTADO,
          VE.vce_codigo AS CODIGO,
          VE.vcgas_gerenciaN AS GERENCIA,
          VE.vcgas_areaN AS AREA,
          VE.vcgas_sectorN AS SECTOR 
          FROM Tareas T
          JOIN VIEW_tareaCliente V ON V.vtc_tareaId = T.Id
          JOIN VIEW_equiposCteGerAreSec VE ON VE.vce_idEquipo = T.Id_Equipo
          INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
          INNER JOIN Estados E ON E.Id = T.Id_Estado
          WHERE V.vtc_idCliente = 1
          AND VE.vcgas_idGerencia = ?
          AND VE.vcgas_idArea = ?
          AND T.Fecha BETWEEN ? AND ?
          AND T.Id_Estado IN (1, 2);`;
        data = await pool.query(query, [gerencia, area, f_ini, f_fin]);
        break;

      case !!gerencia && !!area && !!sector:
        query = `
          SELECT
          T.Id AS TAREA,
          T.Fecha AS FECHA,
          T.Id_Protocolo AS ID_PROTOCOLO,
          P.DEscripcion AS PROTOCOLO,
          E.Descripcion AS ESTADO,
          VE.vce_codigo AS CODIGO,
          VE.vcgas_gerenciaN AS GERENCIA,
          VE.vcgas_areaN AS AREA,
          VE.vcgas_sectorN AS SECTOR 
          FROM Tareas T
          JOIN VIEW_tareaCliente V ON V.vtc_tareaId = T.Id
          JOIN VIEW_equiposCteGerAreSec VE ON VE.vce_idEquipo = T.Id_Equipo
          INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
          INNER JOIN Estados E ON E.Id = T.Id_Estado
          WHERE V.vtc_idCliente = 1
          AND VE.vcgas_idGerencia = ?
          AND VE.vcgas_idArea = ?
          AND VE.vcgas_idSector = ?
          AND T.Fecha BETWEEN ? AND ?
          AND T.Id_Estado IN (1, 2);`;
        data = await pool.query(query, [gerencia, area, sector, f_ini, f_fin]);
        break;

      default:
        res.status(400).send('Parametros inválidos');
        return;
    }

    if (data.length === 0) {
      res.status(204).send('No se encontraron resultados'); 
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheetTareas = workbook.addWorksheet('Tareas');

    const headerRow = Object.keys(data[0]).map((key) => ({ header: key, key: key }));

    headerRow.push({ header: 'FECHA_EJECUCION', key: 'columnaExtra1' });
    headerRow.push({ header: 'TECNICO_EJECUTOR', key: 'columnaExtra2' });
    headerRow.push({ header: 'OBSERVACION_EST', key: 'columnaExtra3' });

    worksheetTareas.columns = headerRow;

    data.forEach((row) => {
      worksheetTareas.addRow({
        ...row,
        columnaExtra1: '',
        columnaExtra2: '',
        columnaExtra3: ''
      });
    });

    worksheetTareas.getColumn('columnaExtra1').numFmt = 'dd-mm-yyyy';

    worksheetTareas.getColumn('columnaExtra1').eachCell((cell) => {
      cell.dataValidation = {
        type: 'date',
        operator: 'greaterThan',
        formula1: '01-01-1900',
        showErrorMessage: true,
        errorTitle: 'Formato de fecha incorrecto',
        error: 'Por favor, ingresa una fecha válida en formato dd-mm-aaaa.',
        errorStyle: 'stop'
      };
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Disposition', 'attachment; filename="pendientes.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error al generar el archivo Excel');
  }

});

router.post('/comprobar_tareas', isLoggedIn, upload.single('file'), authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
  
  try {
      const workbook = XLSX.read(req.file.buffer);
      const cargaSheet = workbook.Sheets['Tareas'];

      const columnsToExtract = [
        { index: 0, name: 'TAREA' },
      ];

      const data = [];

      let rowIndex = 1;
      while (cargaSheet[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })]) {
        const rowData = {};

        const rowHasData = columnsToExtract.every(({ index, name }) => {
          const cell = cargaSheet[XLSX.utils.encode_cell({ r: rowIndex, c: index })];
          
          if (index === 9 && cell) {
            const fechaExcel = XLSX.SSF.parse_date_code(cell.v);
            const fechaFormateada = new Date(fechaExcel.y, fechaExcel.m - 1, fechaExcel.d);
            rowData[name] = fechaFormateada.toISOString().split('T')[0]; 
          } else {
            rowData[name] = cell ? cell.v : null;
          }

          return cell !== undefined && cell.v !== undefined && cell.v !== null && cell.v !== '';
        });

        if (rowHasData) {
          data.push(rowData);
        }

        rowIndex++;
      }

      const tareas = [...new Set(data.map(item => item.TAREA))];

      const verificacion = await pool.query(
        'SELECT Id_Tarea FROM Tarea_Respuesta Where Id_Tarea IN (?) GROUP BY Id_Tarea;',[tareas]
      );

      if(!verificacion.length) {  
        res.json({ status: 'ok' });
      } else {
        res.json({ status: 'error'});
      }      
  } catch (error) {
    
    console.log(error);

  }
});

router.post('/actualizar_tareas_pendientes', isLoggedIn, upload.single('file'), authRole(['Plan', 'Admincli','Supervisor']), async (req, res) => {
 
  try {

    const {usuario, Email, Id} = req.user;
    const fechaHoraCliente = req.body.fecha_hora_cliente; 
    const workbook = XLSX.read(req.file.buffer);
    const cargaSheet = workbook.Sheets['Tareas'];

    const columnsToExtract = [
      { index: 0, name: 'TAREA' },
      { index: 1, name: 'FECHA' },
      { index: 4, name: 'ESTADO' },
      { index: 5, name: 'CODIGO' },
      { index: 6, name: 'GERENCIA' },
      { index: 7, name: 'AREA' },
      { index: 8, name: 'SECTOR' },
      { index: 9, name: 'FECHA_EJECUCION' },
      { index: 10, name: 'TECNICO_EJECUTOR' },
      { index: 11, name: 'OBSERVACION_EST' }
    ];

    const data = [];

    let rowIndex = 1;
    while (cargaSheet[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })]) {
      const rowData = {};

      const rowHasData = columnsToExtract.every(({ index, name }) => {
        const cell = cargaSheet[XLSX.utils.encode_cell({ r: rowIndex, c: index })];
        
        if (index === 9 && cell) {
          const fechaExcel = XLSX.SSF.parse_date_code(cell.v);
          const fechaFormateada = new Date(fechaExcel.y, fechaExcel.m - 1, fechaExcel.d);
          rowData[name] = fechaFormateada.toISOString().split('T')[0]; 
        } else {
          rowData[name] = cell ? cell.v : null;
        }

        return cell !== undefined && cell.v !== undefined && cell.v !== null && cell.v !== '';
      });

      if (rowHasData) {
        data.push(rowData);
      }

      rowIndex++;
    }

    const tareas = [...new Set(data.map(item => item.TAREA))];

    const fecha = data.map(item => ({
      tarea: item.TAREA,
      fecha_ejecucion: item.FECHA_EJECUCION
    }));

    const tecnico = data.map(item => ({
      tarea: item.TAREA,
      tecnico: item.TECNICO_EJECUTOR
    }));

    const estado= data.map(item=> ({
      tarea: item.TAREA,
      estado_op: 'SSR',
    }));

    const observacion= data.map(item=> ({
      tarea: item.TAREA,
      observacion_est: item.OBSERVACION_EST + ' | SSR',
    }));

    const inserts = await pool.query(
      `
      INSERT INTO Tarea_Respuesta ( Id_Tarea, Capitulo, Correlativo, Id_Equipo, Respuesta ) SELECT
      T.Id,
      PC.Capitulo,
      PCA.Correlativo,
      T.Id_Equipo,
      'SC' 
      FROM
        Tareas T 
        INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
        INNER JOIN Protocolo_Capitulo PC ON PC.Id_Protocolo = P.Id
        INNER JOIN Protocolo_Capturas PCA ON PCA.Id_Protocolo = P.Id 
        AND PCA.Capitulo = PC.Capitulo 
      WHERE
        T.ID IN ( ? );
      `,
      [tareas]
    );

    for (const item of fecha) {
      const update1 = await pool.query(
        `
        UPDATE Tarea_Respuesta TR
        INNER JOIN Tareas T ON TR.Id_Tarea = T.Id
        INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
        INNER JOIN Protocolo_Capitulo PC ON PC.Id_Protocolo = P.Id
        INNER JOIN Protocolo_Capturas PCA ON PCA.Id_Protocolo = P.Id 
        AND PCA.Capitulo = PC.Capitulo 
        SET TR.Respuesta = ? 
        WHERE
          PCA.Capitulo = 1 
          AND PCA.Correlativo = 1
          AND TR.Capitulo = 1 
          AND TR.Correlativo = 1 
          AND T.Id = ?;
        `,
        [item.fecha_ejecucion, item.tarea]
      );
    }

    for (const item of tecnico) {
      const update2 = await pool.query(
        `
        UPDATE Tarea_Respuesta TR
        INNER JOIN Tareas T ON TR.Id_Tarea = T.Id
        INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
        INNER JOIN Protocolo_Capitulo PC ON PC.Id_Protocolo = P.Id
        INNER JOIN Protocolo_Capturas PCA ON PCA.Id_Protocolo = P.Id 
        AND PCA.Capitulo = PC.Capitulo 
        SET TR.Respuesta = ? 
        WHERE
          PCA.Capitulo = 1 
          AND PCA.Correlativo = 2
          AND TR.Capitulo = 1 
          AND TR.Correlativo = 2 
          AND T.Id = ?;
        `,
        [item.tecnico, item.tarea]
      );
    }

    for (const item of estado) {
      const update3 = await pool.query(
        `
        UPDATE Tarea_Respuesta TR
        INNER JOIN Tareas T ON TR.Id_Tarea = T.Id
        INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
        INNER JOIN Protocolo_Capitulo PC ON PC.Id_Protocolo = P.Id
        INNER JOIN Protocolo_Capturas PCA ON PCA.Id_Protocolo = P.Id 
        AND PCA.Capitulo = PC.Capitulo 
        SET TR.Respuesta = ? 
        WHERE
        PC.Descripcion LIKE '%Estado%'	
        AND PCA.Descripcion LIKE '%Estado%'	
        AND PC.Capitulo = PCA.Capitulo
        AND PCA.Capitulo = TR.Capitulo 
        AND PCA.Correlativo = TR.Correlativo
        AND T.Id = ? 
        `,
        [item.estado_op, item.tarea]
      );
    }

    for (const item of observacion) {
      const update4 = await pool.query(
        `
        UPDATE Tarea_Respuesta TR
        INNER JOIN Tareas T ON TR.Id_Tarea = T.Id
        INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo
        INNER JOIN Protocolo_Capitulo PC ON PC.Id_Protocolo = P.Id
        INNER JOIN Protocolo_Capturas PCA ON PCA.Id_Protocolo = P.Id 
        AND PCA.Capitulo = PC.Capitulo 
        SET TR.Respuesta = ? 
        WHERE
        PC.Descripcion LIKE '%Estado%'	
        AND PCA.Descripcion LIKE '%Observaciones EST%'	
        AND PC.Capitulo = PCA.Capitulo
        AND PCA.Capitulo = TR.Capitulo 
        AND PCA.Correlativo = TR.Correlativo
        AND T.Id = ? 
        `,
        [item.observacion_est, item.tarea]
      );
    }

    const act_tareas = await pool.query(
      'UPDATE Tareas SET Id_Estado = 5 WHERE Id IN (?);', [tareas]
    );

    const date = new Date();

    const arr = tareas.map(function (id) {
      return [id, 5, 'Ajuste interno | SSR',2, usuario, date, 0];
    });

    const act_tareas_val = await pool.query(
      `UPDATE Tareas_Estado SET te_Estado_val = 1 WHERE te_Id_Tarea IN (?);`, [tareas]
    );

    const act_val_tareas = await pool.query(
      'INSERT INTO Validacion_Tareas (Val_tarea_id, Val_id_estado, Val_obs, Val_id_estado_old, Val_respsapma, Val_fechaval_inf, Val_rechazo) Values ?', [arr]
    );

    const arr_historia = tareas.map(function (id_tarea) {
      return [id_tarea, Id, 'Validada SSR', date, 'Ajuste interno | SSR',];
    });

    const act_historia = await pool.query(
      `INSERT INTO Historia_tareas (ht_id, ht_usuario, ht_titulo, ht_fecha, ht_comentario)
      VALUES (?)`, [arr_historia] 
    );

    const workbookOut = new ExcelJS.Workbook();
    const worksheet = workbookOut.addWorksheet('Tareas Actualizadas');

    worksheet.columns = [
      { header: 'TAREA', key: 'TAREA'},
      { header: 'FECHA', key: 'FECHA', style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'ESTADO_TAREA_ANTERIOR', key: 'ESTADO'},
      { header: 'CODIGO', key: 'CODIGO'},
      { header: 'GERENCIA', key: 'GERENCIA'},
      { header: 'AREA', key: 'AREA'},
      { header: 'SECTOR', key: 'SECTOR'},
      { header: 'FECHA_EJECUCION', key: 'FECHA_EJECUCION'},
      { header: 'TECNICO_EJECUTOR', key: 'TECNICO_EJECUTOR'},
      { header: 'OBSERVACION_EST', key: 'OBSERVACION_EST'},
      { header: 'ESTADO_OPERACIONAL', key: 'ESTADO_OPERACIONAL'},
      { header: 'NUEVO_ESTADO_TAREA', key: 'NUEVO_ESTADO_TAREA'},
      { header: 'ACTUALIZADO_POR', key: 'ACTUALIZADO_POR'},
      { header: 'FECHA_ACTUALIZACION', key: 'FECHA_ACTUALIZACION'}
    ];

    data.forEach(item => {
      worksheet.addRow({
        ...item,
        ESTADO_OPERACIONAL: 'Sistema sin revisar',
        NUEVO_ESTADO_TAREA: 'Terminada sin validar',
        ACTUALIZADO_POR: usuario,
        FECHA_ACTUALIZACION: fechaHoraCliente.replace('T', ' ').split('.')[0]
      });
    });

    const buffer = await workbookOut.xlsx.writeBuffer();

    const datemail = new Date().toLocaleDateString('en-GB');
    const filePathName1 = path.resolve(__dirname, "../views/email/pendientes.hbs"); 
    const mensaje = fs.readFileSync(filePathName1, "utf8");
    const template = hbs.compile(mensaje);
    const context = {datemail};
    const html = template(context); 

    await transporter.sendMail({
      from: "SAPMA DRT <notificaciones@sercoing.cl>",
      to: [Email],
      bcc: "notificaciones.sapma@sercoing.cl",
      subject: "Tareas Actualizadas",
      html,
      attachments: [
        {
          filename: "imagen1.png",
          path: "./src/public/img/imagen1.png",
          cid: "imagen1",
        },
        {
          filename: 'tareas_actualizadas_'+datemail+'.xlsx',
          content: buffer
        }
      ],
    });

    await pool.query(
      'call sp_ActualizarTareaDetalle();'
    );

    res.send('ok');

  } catch (error) {
    console.log(error);
  }
  
});

module.exports = router;