const iconv = require('iconv-lite');

// 🔧 Mantener formato de mayúsculas/minúsculas
function matchCase(original, replacement) {
  if (!original) return replacement;

  // TODO MAYÚSCULA
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }

  // Capitalizado (Primera letra mayúscula)
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  // minúscula
  return replacement.toLowerCase();
}

// 🔧 Función principal de limpieza mejorada
function fixEncoding(text) {
  if (!text || typeof text !== 'string') return text;

  let fixed = text;

  // 1. Corregir Doble Codificación (UTF-8 interpretado como Latin1)
  try {
    const doubleEncodedPattern = /[\u00C0-\u00DF][\u0080-\u00BF]/g;
    if (doubleEncodedPattern.test(fixed)) {
      const recoded = Buffer.from(fixed, 'binary').toString('utf8');
      if (!recoded.includes('\ufffd')) {
        fixed = recoded;
      }
    }
  } catch (e) { /* fallback */ }

  // 2. Reemplazos directos para "Mojibake"
  const replacements = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã±': 'ñ', 'Ã ': 'Á', 'Ã‰': 'É', 'Ã ': 'Í', 'Ã“': 'Ó', 'Ãš': 'Ú',
    'Ã‘': 'Ñ', 'Ã¼': 'ü', 'Ãœ': 'Ü', 'Â¿': '¿', 'Â¡': '¡', 'Â°': '°'
  };

  for (const [bad, good] of Object.entries(replacements)) {
    const regex = new RegExp(bad, 'gi');
    fixed = fixed.replace(regex, (match) => matchCase(match, good));
  }

  // 3. Resolución de caracteres perdidos (\ufffd o ?)
  const badChar = /[\ufffd?]/g;

  if (badChar.test(fixed)) {
    fixed = fixed
      // Casos específicos
      .replace(/se[?\ufffd]+al[?\ufffd]+tica/gi, (m) => matchCase(m, 'señalética'))
      .replace(/se[?\ufffd]+al/gi, (m) => matchCase(m, 'señal'))
      .replace(/acci[?\ufffd]+n/gi, (m) => matchCase(m, 'acción'))
      .replace(/descripci[?\ufffd]+n/gi, (m) => matchCase(m, 'descripción'))
      .replace(/aplicaci[?\ufffd]+n/gi, (m) => matchCase(m, 'aplicación'))
      .replace(/observaci[?\ufffd]+n/gi, (m) => matchCase(m, 'observación'))

      // Terminaciones
      .replace(/c[?\ufffd]+i[?\ufffd]+n\b/gi, (m) => matchCase(m, 'ción'))
      .replace(/c[?\ufffd]+n\b/gi, (m) => matchCase(m, 'ción'))
      .replace(/s[?\ufffd]+n\b/gi, (m) => matchCase(m, 'sión'))
      .replace(/[?\ufffd]+n\b/gi, (m) => matchCase(m, 'ón'))

      // Sufijos técnicos
      .replace(/[?\ufffd]+tica\b/gi, (m) => matchCase(m, 'ética'))
      .replace(/[?\ufffd]+tico\b/gi, (m) => matchCase(m, 'ético'))
      .replace(/[?\ufffd]+stica\b/gi, (m) => matchCase(m, 'ística'))
      .replace(/[?\ufffd]+stico\b/gi, (m) => matchCase(m, 'ístico'))
      .replace(/[?\ufffd]+gica\b/gi, (m) => matchCase(m, 'ógica'))
      .replace(/[?\ufffd]+gico\b/gi, (m) => matchCase(m, 'ógico'))

      // Palabras comunes
      .replace(/s[?\ufffd]+bado/gi, (m) => matchCase(m, 'sábado'))
      .replace(/mi[?\ufffd]+rcoles/gi, (m) => matchCase(m, 'miércoles'))
      .replace(/p[?\ufffd]+gin/gi, (m) => matchCase(m, 'págin'))
      .replace(/c[?\ufffd]+dig/gi, (m) => matchCase(m, 'códig'))
      .replace(/área/gi, (m) => matchCase(m, 'área'))

      // Ñ contexto
      .replace(/a[?\ufffd]+o/gi, (m) => matchCase(m, 'año'))
      .replace(/a[?\ufffd]+a/gi, (m) => matchCase(m, 'aña'))
      .replace(/e[?\ufffd]+o/gi, (m) => matchCase(m, 'eño'))
      .replace(/e[?\ufffd]+a/gi, (m) => matchCase(m, 'eña'))
      .replace(/u[?\ufffd]+a/gi, (m) => matchCase(m, 'uña'))

      // Fallback inteligente
      .replace(/([a-zA-Z])[?\ufffd]+([a-zA-Z])/g, (match, p1, p2) => {
        let base;

        if (p1.toLowerCase() === 'a' && p2.toLowerCase() === 'o') {
          base = 'año';
        } else {
          base = p1 + 'ñ' + p2;
        }

        return matchCase(match, base);
      });
  }

  return fixed;
}

// 🔁 Función recursiva
function deepFix(data) {
  if (typeof data === 'string') return fixEncoding(data);
  if (Array.isArray(data)) return data.map(deepFix);
  if (data && typeof data === 'object') {
    const newObj = {};
    for (const key in data) {
      newObj[key] = deepFix(data[key]);
    }
    return newObj;
  }
  return data;
}

// 🚀 Middleware Express
function encodingMiddleware(req, res, next) {
  const originalJson = res.json;
  res.json = function (data) {
    return originalJson.call(this, deepFix(data));
  };

  const originalRender = res.render;
  res.render = function (view, options, callback) {
    const fixedOptions = deepFix(options);
    return originalRender.call(this, view, fixedOptions, callback);
  };

  next();
}

module.exports = {
  encodingMiddleware,
  fixEncoding
};