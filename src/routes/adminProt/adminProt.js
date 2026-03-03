const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { isLoggedIn } = require('../../lib/auth');
const { authRole} = require('../../lib/rol');

// Inicio
router.get('/adminProtocolos', isLoggedIn, authRole(['Plan', 'Admincli']) , async (req, res) =>{
    try {
        const tipoProtocolo= await pool.query(`
            SELECT Id AS ID, CONCAT(Descripcion,' ', Abreviacion) AS DESCRIPCION FROM TipoProtocolo;
            `
        );
        const tipo_equipo = await pool.query(`
            SELECT Id AS ID, Descripcion AS DESCRIPCION FROM TipoEquipo ORDER BY Id ASC;`
        );

        res.render('adminprot/protocolos', {tipoProtocolo, tipo_equipo});
    } catch (error) {
        console.log(error);
        res.status(500).send('Error interno del servidor');
    }

});

// Obtener tipos de protocolo
router.post('/tipoProt', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {
        const { tipoProt } = req.body;
        const protocolos = await pool.query(`
            SELECT
                P.Id AS Id,
                P.Descripcion AS Protocolo,
                CONCAT(TE.Id,'. ',TE.Descripcion) AS TipoEquipo
            FROM
                Protocolos P
                INNER JOIN TipoEquipo TE ON TE.Id = P.Id_TipoEquipo
            WHERE
                P.Id_TipoProtocolo = ?
                AND P.Id_Cliente = 1
            `, [tipoProt]
        );
        res.json(protocolos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los protocolos' });
    }    
});

// Obtener los tipos de respuestas
router.get('/tipoRespuesta', isLoggedIn, authRole(['Plan', 'Admincli']) , async (req, res) =>{
    try {
        const tipo_respuesta = await pool.query("SELECT Id, Descripcion FROM TipoRespuesta");
        res.json(tipo_respuesta);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los tipos de respuesta' });
    }  
});

// Ver protocolo cxompleto
router.post('/verProt', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {
    const { protId } = req.body;
    const protocoloFull = await pool.query(`
        SELECT
            P.Id_Protocolo AS ID_PROTOCOLO,
            P.Capitulo AS ID_CAPITULO,
            P.Descripcion AS CAPITULO,
            PC.Correlativo AS CORRELATIVO,
            PC.Descripcion AS CAPTURA,
            TR.Id AS ID_TR,
            TR.Descripcion AS TIPO_RESPUESTA,
            PC.Obligatorio AS OBLIGATORIO,
            (
                SELECT
                    CASE WHEN COUNT(T.Id_Protocolo) > 0 THEN 1 ELSE 0 END
                FROM
                    Tareas T
                WHERE
                    T.Id_Protocolo = P.Id_Protocolo
                    AND T.Id_Estado <> 1
            ) AS TIENE_TAREAS
        FROM
            Protocolo_Capitulo P
            INNER JOIN Protocolo_Capturas PC ON PC.Capitulo = P.Capitulo
            AND PC.Id_Protocolo = P.Id_Protocolo
            INNER JOIN TipoRespuesta TR ON TR.Id = PC.Id_TipoRespuesta
        WHERE
            P.Id_Protocolo = ?;
        `,[protId]);
    res.json(protocoloFull);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los protocolos' });
    }    
});

// Duplicar un protocolo exiatente
router.post('/duplicarProt', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {Id_Cliente} = req.user;
    const {tipoprotocolo, tipoe, protocolo, protdup} = req.body;
    try {

        const new_prot = await pool.query(`
            INSERT INTO Protocolos (Id_TipoProtocolo, Descripcion, Id_TipoEquipo, Es_Ubicacion, Id_Cliente) VALUES (?,?,?,0,?);`, 
            [tipoprotocolo, protocolo, tipoe, Id_Cliente]
        );

        const newId = new_prot.insertId;
    
        const capitulos = await pool.query(`
            SELECT
                P.Capitulo AS ID_CAPITULO,
                P.Descripcion AS CAPITULO,
            P.Es_Varios AS VARIOS
            FROM
                Protocolo_Capitulo P
                INNER JOIN Protocolo_Capturas PC ON PC.Capitulo = P.Capitulo AND PC.Id_Protocolo = P.Id_Protocolo
                INNER JOIN  TipoRespuesta TR ON TR.Id = PC.Id_TipoRespuesta
            WHERE
            P.Id_Protocolo =? GROUP BY P.Capitulo;` , [protdup]
        );
        
        const capitulosConProtocolo = []; // Array para almacenar los arrays con los datos de cada capítulo

        capitulos.forEach((capitulo) => {
            const array = []; // Array para almacenar los datos de cada capítulo

            array.push(newId);
            array.push(capitulo.ID_CAPITULO);
            array.push(capitulo.CAPITULO);
            array.push(capitulo.VARIOS);

            capitulosConProtocolo.push(array); // Agregar el array al resultado final
        });

        let query = "INSERT INTO Protocolo_Capitulo (Id_Protocolo, Capitulo, Descripcion, Es_Varios) VALUES ";
        const values = [];
        capitulosConProtocolo.forEach((capitulo, index) => {
            query += "(?,?,?,?)";
            values.push(...capitulo);
            if (index !== capitulosConProtocolo.length - 1) {
            query += ",";
            }
        });

        await pool.query(query, values);

        const capturas = await pool.query(`
            SELECT
                PC.Capitulo AS CAPITULO, 
                PC.Correlativo AS CORRELATIVO,
                PC.Subcapitulo AS SUB,
                PC.Descripcion AS CAPTURA,
                PC.Obligatorio AS OBLIGATORIO,
                TR.Id AS TR
            FROM
                Protocolo_Capitulo P
                INNER JOIN Protocolo_Capturas PC ON PC.Capitulo = P.Capitulo AND PC.Id_Protocolo = P.Id_Protocolo
                INNER JOIN  TipoRespuesta TR ON TR.Id = PC.Id_TipoRespuesta
            WHERE
                P.Id_Protocolo =?;`,[protdup]
        );

        const capturasConProtocolo = [];

        capturas.forEach((captura) => {
            const array = []; // Array para almacenar los datos de cada capítulo

            array.push(newId);
            array.push(captura.CAPITULO);
            array.push(captura.SUB);
            array.push(captura.CORRELATIVO);
            array.push(captura.CAPTURA);
            array.push(captura.OBLIGATORIO);
            array.push(captura.TR);

            capturasConProtocolo.push(array); // Agregar el array al resultado final
        });

        let query1 = "INSERT INTO Protocolo_Capturas (Id_Protocolo, Capitulo, Subcapitulo, Correlativo, Descripcion, Obligatorio, Id_TipoRespuesta) VALUES ";
        const values1 = [];
        capturasConProtocolo.forEach((captura, index) => {
            query1 += "(?,?,?,?,?,?,?)";
            values1.push(...captura);
            if (index !== capturasConProtocolo.length - 1) {
                query1 += ",";
            }
        });

        await pool.query(query1, values1);
        const actualizacion = await pool.query (`UPDATE Protocolo_Capitulo
            SET Descripcion = REPLACE(Descripcion, UNHEX('C2A0'), '');`);

        res.json({message: 'Protocolo creado correctamente'});        
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al duplicar el protocolo' });
    }
});

// Cambiar el nombre del protocolo
router.post('/cambiarNombreProt', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { protId, newName } = req.body;
    try {
        const nombre_prot = await pool.query("UPDATE Protocolos SET Descripcion = ? WHERE Id = ?;",[newName, protId]);
        res.json({message: 'Protocolo actualizado correctamente', newName: newName, protId: protId});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Ocurrió un error al cambiar el nombre del protocolo' });
    }
});

// Actualizar protocolo
router.post('/actualizarProtocolo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {
        const {capitulos, idProtocolo} = req.body;

        var capitulosConProtocolo = capitulos.map(function(capitulo) {
            return [
                idProtocolo,
                capitulo.idCapitulo,
                capitulo.descripcion,
                0
            ];
        });

        const capturasConProtocolo = [];

        capitulos.forEach(capitulo => {
            capitulo.capturas.forEach((captura, idx) => {
                capturasConProtocolo.push([
                    idProtocolo,                
                    capitulo.idCapitulo,        
                    0,                          
                    captura.idCaptura,          
                    captura.descripcion,        
                    captura.tipoRespuesta,       
                    captura.obligatorio ? 1 : 0
                ]);
            });
        });

        const delCapturas = await pool.query("DELETE FROM Protocolo_Capturas WHERE Id_Protocolo = ?", [idProtocolo]);
        const delCapitulos = await pool.query("DELETE FROM Protocolo_Capitulo WHERE Id_Protocolo = ?", [idProtocolo]);

        let query = "INSERT INTO Protocolo_Capitulo (Id_Protocolo, Capitulo, Descripcion, Es_Varios) VALUES ";
        const values = [];
        capitulosConProtocolo.forEach((capitulo, index) => {
            query += "(?,?,?,?)";
            values.push(...capitulo);
            if (index !== capitulosConProtocolo.length - 1) {
            query += ",";
            }
        });
        
        await pool.query(query, values);

        let query1 = "INSERT INTO Protocolo_Capturas (Id_Protocolo, Capitulo, Subcapitulo, Correlativo, Descripcion, Id_TipoRespuesta, Obligatorio) VALUES ";
        const values1 = [];
        capturasConProtocolo.forEach((captura, index) => {
            query1 += "(?,?,?,?,?,?,?)";
            values1.push(...captura);
            if (index !== capturasConProtocolo.length - 1) {
                query1 += ",";
            }
        });

        await pool.query(query1, values1);
        const actualizacion = await pool.query (`UPDATE Protocolo_Capitulo SET Descripcion = REPLACE(Descripcion, UNHEX('C2A0'), '');`);

        res.json({success:true, message: 'Protocolo actualizado correctamente'});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el protocolo' });
    }

});

// Creacion de protocolo desde 0
router.post('/crearProtocolo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {
        const { Id_Cliente } = req.user;
        const { tipoProt,tipoEquipo, nombreProt, capitulos } = req.body;

        const new_prot = await pool.query("INSERT INTO Protocolos (Id_TipoProtocolo, Descripcion, Id_TipoEquipo, Es_Ubicacion, Id_Cliente) VALUES (?,?,?,0,?);", [
            tipoProt, nombreProt, tipoEquipo, Id_Cliente
        ]);
        const newId = new_prot.insertId;

        const newCapitulos = capitulos.map((capitulo) => [newId, capitulo.orden, capitulo.descripcion, 0]);

        const capturasConProtocolo = [];

        capitulos.forEach(capitulo => {
            capitulo.capturas.forEach((captura, idx) => {
                capturasConProtocolo.push([
                    newId,                
                    capitulo.orden,        
                    0,                          
                    captura.orden,          
                    captura.descripcion,        
                    captura.tipoRespuesta,       
                    captura.obligatorio ? 1 : 0
                ]);
            });
        });

        let query = "INSERT INTO Protocolo_Capitulo (Id_Protocolo, Capitulo, Descripcion, Es_Varios) VALUES ";
        const values = [];
        newCapitulos.forEach((capitulo, index) => {
            query += "(?,?,?,?)";
            values.push(...capitulo);
            if (index !== newCapitulos.length - 1) {
            query += ",";
            }
        });
        await pool.query(query, values);

        let query1 = "INSERT INTO Protocolo_Capturas (Id_Protocolo, Capitulo, Subcapitulo, Correlativo, Descripcion, Id_TipoRespuesta, Obligatorio) VALUES ";
        const values1 = [];
        capturasConProtocolo.forEach((captura, index) => {
            query1 += "(?,?,?,?,?,?,?)";
            values1.push(...captura);
            if (index !== capturasConProtocolo.length - 1) {
                query1 += ",";
            }
        });

        await pool.query(query1, values1);
        const actualizacion = await pool.query (`UPDATE Protocolo_Capitulo SET Descripcion = REPLACE(Descripcion, UNHEX('C2A0'), '');`);
        
        res.json({message: 'Se ha creado el Protocolo '+newId+'.- '+nombreProt+', correctamente.'});

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el protocolo' });
    }
});

module.exports = router;