const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn} = require('../lib/auth');
const { authRole} = require('../lib/rol');
const helpers = require('../lib/helpers');
const nodemailer = require('nodemailer');
const hbs = require("handlebars");
const fs = require("fs");
const moment = require('moment');
const path = require("path"); 
const pool = require('../database');

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

router.get('/', isNotLoggedIn, (req, res) => {
    res.render('index');
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local.signin', {
    successRedirect: '/home',
    failureRedirect: '/',
    failureFlash: true
    })(req, res, next)
    ;
});

router.get('/reset_pass', (req, res, next) => {
  res.render('recupe');
});

router.post('/correo', async (req, res) => {
  const { email } = req.body;

  try {
      const consulta = await pool.query('SELECT Id, Descripcion, Login FROM Usuarios WHERE Email = ?', [email]);
      const datemail = moment().format('DD-MM-YYYY');
      if (consulta.length > 0) {

          const {Id, Login, Descripcion} = consulta[0];

          const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let randomCode = '';
          for (let i = 0; i < 8; i++) {
              randomCode += characters.charAt(Math.floor(Math.random() * characters.length));
          }

          const newpassword = await helpers.encryptPassword(randomCode);

          const update = await pool.query('UPDATE Usuarios SET Clave = ? WHERE Id = ?', [newpassword, Id]);

          const filePathName1 = path.resolve(__dirname, "../views/email/emailrecuperar.hbs");
          const mensaje = fs.readFileSync(filePathName1, "utf8");
          const template = hbs.compile(mensaje);
          const context = {
              datemail,
              Descripcion,
              email,
              Login,
              randomCode
          };
          const html = template(context);
  
          await transporter.sendMail({
              from: "SAPMA DRT <notificaciones@sercoing.cl>",
              to:  email,
              bcc: "notificaciones.sapma@sercoing.cl",
              subject: "Recuperación de contraseña",
              html,
              attachments: [
                  {
                      filename: "imagen1.png",
                      path: "./src/public/img/imagen1.png",
                      cid: "imagen1",
  
                  }
              ]
          });
        
          res.json({ exists: true }); 
      } else {
          res.json({ exists: false });
      }

  } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});;

router.get('/users/add', isLoggedIn,  async (req, res) => {
  await pool.query('SELECT Id, Descripcion FROM Clientes', (err, result) => {
  res.render('users/nuevo', { clientes: result });
  });
});

router.post('/users/add', (req, res, next) => {
passport.authenticate('local.signup', (err, user, info) => {
    if (err) {
        return next(err);
    }
    if (!user) {
        return res.json({ error: info.message });
    }
    
    const userId = user.userId;
    const userPerfil = user.userPerfil;
    const userPass1 = user.userPass1;
    res.json({ userId, userPerfil, userPass1});
})(req, res, next);
});

router.get('/logout', isLoggedIn, (req, res, next) => {
    req.logout(function(err) {
        if (err) { 
          return next(err); 
          }
        res.redirect('/');
      });
});

module.exports = router;