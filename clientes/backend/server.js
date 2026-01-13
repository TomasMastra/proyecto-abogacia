const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const argon2 = require("argon2");
const { actualizarIpFirewallAzure } = require("./azureFirewallUpdater");
const Archiver = require("archiver");
const router = express.Router();

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// =======================================================
//              FUNCIÓN PRINCIPAL DEL SERVIDOR
// =======================================================

async function iniciarServidor() {
  console.log("=====================================");
  console.log("   Iniciando backend de ABOGACIA...");
  console.log("=====================================");

  // 1) Actualizamos IP en Azure SQL Firewall


  // 2) Configuración de conexión a Azure SQL
  /*const dbConfig = {
    user: 'sqladmin',
    password: 'Lam@ceta2025!',
    server: 'servidormastrapasqua.database.windows.net',
    database: 'abogacia',
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };*/
/*
  const dbConfig = {
  user: 'userMastrapasquaABOGACIA',
  password: '1503',
  server: 'DESKTOP-Q9JTH4D', // o DESKTOP-Q9JTH4D\\SQLEXPRESS
  database: 'ABOGACIA',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};
*/

  const dbConfig = {
  user: 'importuser',
  password: 'Import@1503',
  server: 'DESKTOP-Q9JTH4D', // o DESKTOP-Q9JTH4D\\SQLEXPRESS
  database: 'abogaciadb',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};
  // 3) Conectar a SQL Server
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

poolConnect
  .then(() => {
    console.log("✔ Conectado a Azure SQL correctamente.");

    app.get("/", (req, res) => {
      res.send("API funcionando correctamente.");
    });


    // Ruta para obtener todos los usuarios
    app.get("/usuario", (req, res) => {
        pool.request()
            .query("SELECT * FROM usuario")  // Consulta SQL
            .then(result => {
                res.json(result.recordset);  // Devuelve los resultados
            })
            .catch(err => {
                res.status(500).send(err);  // En caso de error, devuelve 500
            });
    });

            app.get("/uma", (req, res) => {
        pool.request()
            .query("SELECT * FROM uma ORDER BY fecha_resolucion DESC")  // Consulta SQL
            .then(result => {
                res.json(result.recordset);  // Devuelve los resultados
            })
            .catch(err => {
                res.status(500).send(err);  // En caso de error, devuelve 500
            });
    });



app.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;

  try {
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT TOP 1 
          id,
          nombre,
          email,
          rol,
          estado,
          fecha_creacion,
          password_hash
        FROM usuario 
        WHERE email = @email 
          AND estado = 'activo'
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const usuario = result.recordset[0];

    if (!usuario.password_hash || !usuario.password_hash.startsWith('$argon2')) {
      console.error('Usuario sin hash Argon2 configurado. ID:', usuario.id);
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    let esValida = false;

    try {
      esValida = await argon2.verify(usuario.password_hash, contraseña);
    } catch (err) {
      console.error('Error verificando hash Argon2:', err);
      return res.status(500).json({ error: 'Error al verificar la contraseña' });
    }

    if (!esValida) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Nunca mandamos el hash al frontend
    delete usuario.password_hash;

    res.status(200).json({
      message: 'Login exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        estado: usuario.estado,
        fecha_creacion: usuario.fecha_creacion
      }
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

async function hashPassword(plainPassword) {
  return await argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 19456, // m=19456
    timeCost: 3,       // t=3
    parallelism: 1,    // p=1
  });
}

async function verifyPassword(storedHash, plainPassword) {
  try {
    // Node puede verificar directamente el hash estilo:
    // $argon2id$v=19$m=19456,t=3,p=1$...
    return await argon2.verify(storedHash, plainPassword);
  } catch (e) {
    console.error("Error verificando password Argon2:", e);
    return false;
  }
}
// Ruta para obtener clientes
app.get("/clientes", (req, res) => {
  const usuario_id = parseInt(req.query.usuario_id);
  const rol = req.query.rol;

  let query = "SELECT * FROM clientes WHERE estado != 'eliminado'";
  
  if (rol !== 'admin') {
    query += " AND usuario_id = @usuario_id";
  }

  const request = pool.request();

  if (rol !== 'admin') {
    request.input('usuario_id', sql.Int, usuario_id);
  }
  request
    .query(query)
    .then(result => {
      res.json(result.recordset);
    })
    .catch(err => {
      console.error('Error al obtener clientes:', err);
      res.status(500).send(err);
    });
});

// Ruta para obtener expedientes
/*app.get("/expedientes", async (req, res) => {
  const usuario_id = parseInt(req.query.usuario_id);
  const rol = req.query.rol;

  try {
    const request = pool.request();
    let query = "SELECT * FROM expedientes WHERE estado != 'eliminado'";

    if (rol !== 'admin') {
      query += " AND usuario_id = @usuario_id";
      request.input('usuario_id', sql.Int, usuario_id);
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener expedientes:", err);
    res.status(500).send(err);
  }
});*/

app.get("/expedientes", async (req, res) => {
  const usuario_id = parseInt(req.query.usuario_id);
  const rol = req.query.rol;

  try {
    await poolConnect;

    const request = pool.request();

    if (rol !== 'admin') {
      request.input('usuario_id', sql.Int, usuario_id);
    }

    const query = `
      SELECT 
        e.id,
        e.numero,
        e.anio,
        e.caratula,
        e.estado,
        e.juzgado_id,
        e.usuario_id,
        e.procurador_id,
        e.juicio,
        e.ultimo_movimiento,
        e.fecha_atencion,
        e.capitalCobrado,
        e.estadoHonorariosSeleccionado,
        ISNULL((
          SELECT STRING_AGG(LTRIM(RTRIM(p.nombre_completo)), ' | ')
          FROM (
            SELECT LTRIM(RTRIM(c.nombre + ' ' + c.apellido)) AS nombre_completo
            FROM clientes_expedientes ce
            JOIN clientes c ON c.id = ce.id_cliente
            WHERE ce.id_expediente = e.id

            UNION ALL
            SELECT LTRIM(RTRIM(d.nombre)) AS nombre_completo
            FROM expedientes_demandados ed
            JOIN demandados d ON d.id = ed.id_demandado
            WHERE ed.id_expediente = e.id

            UNION ALL
            SELECT LTRIM(RTRIM(c2.nombre + ' ' + c2.apellido)) AS nombre_completo
            FROM expedientes_demandados ed2
            JOIN clientes c2 ON c2.id = ed2.id_cliente
            WHERE ed2.id_expediente = e.id
          ) p
        ), '') AS busqueda
      FROM expedientes e
      WHERE e.estado != 'eliminado'
        ${rol !== 'admin' ? ' AND e.usuario_id = @usuario_id' : ''}
      ORDER BY e.id DESC;
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener expedientes:", err);
    res.status(500).send(err);
  }
});




        // Ruta para buscar clientes
app.get('/clientes/buscar', async (req, res) => {
  const texto = req.query.texto;
  const usuario_id = parseInt(req.query.usuario_id);
  const rol = req.query.rol;

  try {
    const request = pool.request()
      .input('texto', sql.NVarChar, `%${texto}%`);

    let query = `
      SELECT * FROM clientes 
      WHERE estado = 'en gestión' 
      AND (nombre LIKE @texto OR apellido LIKE @texto)
    `;

    if (rol !== 'admin') {
      query += ' AND usuario_id = @usuario_id';
      request.input('usuario_id', sql.Int, usuario_id);
    }

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error('Error al ejecutar la consulta:', err);
    return res.status(500).send('Error al obtener clientes');
  }
});



  app.post('/clientes/agregar', async (req, res) => {
    try {
      const { nombre, apellido, dni, telefono, direccion, fecha_nacimiento, email, estado, usuario_id, fecha_mediacion  } = req.body;
  
      if (!nombre || !apellido || !dni || !email) {
        return res.status(400).json({
          error: 'Faltan campos obligatorios',
          camposRequeridos: ['nombre', 'apellido', 'dni', 'email']
        });
      }
      const nuevoId = await generarNuevoId(pool, 'clientes', 'id');
      const result = await pool.request()
        .input('id', sql.Int, nuevoId)
        .input('nombre', sql.NVarChar, nombre)
        .input('apellido', sql.NVarChar, apellido)
        .input('dni', sql.Int, dni)
        .input('telefono', sql.NVarChar, telefono)
        .input('direccion', sql.NVarChar, direccion)
        .input('fecha_nacimiento', sql.DateTime, fecha_nacimiento)
        .input('email', sql.NVarChar, email)
        .input('estado', sql.NVarChar, estado)
        .input('usuario_id', sql.Int, usuario_id)
        .input('fecha_mediacion', sql.DateTime, fecha_mediacion)

        .query(`
          INSERT INTO clientes (id, nombre, apellido, dni, telefono, direccion, fecha_nacimiento, email, estado, usuario_id, fecha_mediacion)
          OUTPUT INSERTED.id  -- Esto devuelve el id del nuevo cliente insertado
          VALUES (@id, @nombre, @apellido, @dni, @telefono, @direccion, @fecha_nacimiento, @email, @estado, @usuario_id, @fecha_mediacion)
        `);
  
      // El id del cliente insertado estará en result.recordset[0].id
      res.status(201).json({
        message: 'Cliente agregado exitosamente',
        id: result.recordset[0].id
      });
  
    } catch (err) {
      console.error('Error al agregar cliente:', err.message);
      console.error('Error details:', err);
      res.status(500).json({
        error: 'Error al agregar cliente',
        message: err.message
      });
    }
  });

  /* Ruta para modificar cliente*/
  app.put('/clientes/modificar/:id', async (req, res) => {
    const { id } = req.params;
    const nuevosDatos = req.body;
    
    //console.log('ID del cliente a modificar:', id);
    //console.log('Nuevos datos recibidos:', nuevosDatos);

    try {
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.NVarChar, nuevosDatos.nombre)
            .input('apellido', sql.NVarChar, nuevosDatos.apellido)
            .input('email', sql.NVarChar, nuevosDatos.email)
            .input('telefono', sql.NVarChar, nuevosDatos.telefono)
            .input('fecha_nacimiento', sql.DateTime, nuevosDatos.fecha_nacimiento)
            .input('dni', sql.Int, nuevosDatos.dni)
            .input('estado', sql.NVarChar, nuevosDatos.estado)
            .input('direccion', sql.NVarChar, nuevosDatos.direccion)
            .input('fecha_mediacion', sql.NVarChar, nuevosDatos.fecha_mediacion)

            .query(`
                UPDATE Clientes
                SET nombre = @nombre,
                    apellido = @apellido,
                    email = @email,
                    telefono = @telefono,
                    fecha_nacimiento = @fecha_nacimiento,
                    dni = @dni,
                    estado = @estado,
                    direccion = @direccion,
                    fecha_mediacion = @fecha_mediacion
                WHERE id = @id
            `);

        if (resultado.rowsAffected[0] > 0) {
            res.status(200).json({ mensaje: 'Cliente actualizado correctamente' });
        } else {
            res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ mensaje: 'Error al actualizar cliente' });
    }
});

/*   */
app.get('/expedientes/clientesPorExpediente/:id_expediente', async (req, res) => {
const { id_expediente } = req.params;
try {
    const result = await pool.request()
        .input('id_expediente', sql.Int, id_expediente)
        .query(`
            SELECT c.*
            FROM clientes c
            JOIN clientes_expedientes ce ON c.id = ce.id_cliente
            WHERE ce.id_expediente = @id_expediente
        `);

    res.json(result.recordset);
} catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes del expediente' });
}
});

app.get("/expedientes/obtener/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query("SELECT * FROM expedientes WHERE id = @id AND estado != 'eliminado'");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Expediente no encontrado" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error al obtener expediente:", err);
    res.status(500).send("Error al obtener expediente");
  }
});


/*
app.get('/expedientes/demandadosPorExpediente/:id_expediente', async (req, res) => {
  const { id_expediente } = req.params;
  try {
    const result = await pool.request()
      .input('id_expediente', sql.Int, id_expediente)
      .query(`
        SELECT d.*
        FROM demandados d
        JOIN expedientes_demandados ed ON d.id = ed.id_demandado
        WHERE ed.id_expediente = @id_expediente
      `);


    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener demandados del expediente' });
  }
});*/

app.get('/expedientes/demandadosPorExpediente/:id_expediente', async (req, res) => {
  const { id_expediente } = req.params;
  try {
    const result = await pool.request()
      .input('id_expediente', sql.Int, id_expediente)
      .query(`
        SELECT DISTINCT d.*
        FROM demandados d
        JOIN expedientes_demandados ed ON d.id = ed.id_demandado
        WHERE ed.id_expediente = @id_expediente
      `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener demandados del expediente' });
  }
});

/*
async function recalcularCaratula(pool, expedienteId) {
  // === ACTORAS (clientes_expedientes) ===
  const rsAct = await pool.request()
    .input('id', sql.Int, expedienteId)
    .query(`
      SELECT ce.id, ce.tipo,
             cli.nombre  AS c_nombre, cli.apellido AS c_apellido,
             emp.nombre  AS e_nombre
      FROM clientes_expedientes ce
      LEFT JOIN clientes   cli ON cli.id = ce.id_cliente
      LEFT JOIN demandados emp ON emp.id = ce.id_empresa
      WHERE ce.id_expediente = @id
      ORDER BY ce.id ASC
    `);

  const actoras = rsAct.recordset.map(r => {
    const tipo = (r.tipo || '').toLowerCase();
    if (tipo === 'cliente') {
      const nombre = (r.c_nombre || '').trim();
      const apellido = (r.c_apellido || '').trim();
      return (nombre || apellido) ? `${nombre} ${apellido}`.trim() : 'Cliente';
    } else if (tipo === 'empresa') {
      return (r.e_nombre || '').trim() || 'Empresa';
    }
    return '(sin actora)';
  }).filter(Boolean);

  let actoraStr = '(sin actora)';
  if (actoras.length === 1) actoraStr = actoras[0];
  else if (actoras.length > 1) actoraStr = `${actoras[0]} y otros`;

  // === DEMANDADOS (expedientes_demandados) ===
  const rsDem = await pool.request()
    .input('id', sql.Int, expedienteId)
    .query(`
      SELECT ed.id, ed.tipo,
             cli.nombre  AS c_nombre, cli.apellido AS c_apellido,
             emp.nombre  AS e_nombre
      FROM expedientes_demandados ed
      LEFT JOIN clientes   cli ON cli.id = ed.id_cliente
      LEFT JOIN demandados emp ON emp.id = ed.id_demandado
      WHERE ed.id_expediente = @id
      ORDER BY ed.id ASC
    `);

  const demandados = rsDem.recordset.map(r => {
    const tipo = (r.tipo || '').toLowerCase();
    if (tipo === 'cliente') {
      const nombre = (r.c_nombre || '').trim();
      const apellido = (r.c_apellido || '').trim();
      return (nombre || apellido) ? `${nombre} ${apellido}`.trim() : 'Cliente';
    } else if (tipo === 'empresa') {
      return (r.e_nombre || '').trim() || 'Empresa';
    }
    return '(sin demandado)';
  }).filter(Boolean);

  let demandadoStr = '(sin demandado)';
  if (demandados.length === 1) demandadoStr = demandados[0];
  else if (demandados.length > 1) demandadoStr = `${demandados[0]} y otros`;

  // === Materia: prioridad descripción de codigo > juicio ===
  const rsExp = await pool.request()
    .input('id', sql.Int, expedienteId)
    .query(`
      SELECT 
        e.juicio,
        e.titulo,
        j.descripcion AS codigo_descripcion,
        COALESCE(NULLIF(LTRIM(RTRIM(j.descripcion)), ''), NULLIF(LTRIM(RTRIM(e.juicio)), '')) AS materia
      FROM expedientes e
      LEFT JOIN dbo.codigos j
             ON j.id = e.codigo_id
      WHERE e.id = @id
    `);

  const row = rsExp.recordset[0] || {};
  const materia = (row.materia || '').toString().trim();
  const tituloActual = row.titulo ? row.titulo.toString().trim() : null;

  // Carátula final: "Actora c/ Demandado s/ Materia"
  const caratula = materia
    ? `${actoraStr} c/ ${demandadoStr} s/ ${materia}`
    : `${actoraStr} c/ ${demandadoStr}`;

  const tituloNuevo = tituloActual ?? caratula;

  // === Actualización ===
  await pool.request()
    .input('id', sql.Int, expedienteId)
    .input('caratula', sql.NVarChar, caratula)
    .input('titulo', sql.NVarChar, tituloNuevo)
    .query(`
      UPDATE expedientes
         SET caratula = @caratula,
             titulo   = @titulo
       WHERE id = @id
    `);

  console.log(`Carátula recalculada: ${caratula}`);
  return caratula;
}*/

async function recalcularCaratula(pool, expedienteId) {
  // === ACTORAS (clientes_expedientes) ===
  const rsAct = await pool.request()
    .input('id', sql.Int, expedienteId)
    .query(`
      SELECT ce.id, ce.tipo,
             cli.nombre  AS c_nombre, cli.apellido AS c_apellido,
             emp.nombre  AS e_nombre
      FROM clientes_expedientes ce
      LEFT JOIN clientes   cli ON cli.id = ce.id_cliente
      LEFT JOIN demandados emp ON emp.id = ce.id_empresa
      WHERE ce.id_expediente = @id
      ORDER BY ce.id ASC
    `);

  const actoras = rsAct.recordset.map(r => {
    const tipo = (r.tipo || '').toLowerCase();
    if (tipo === 'cliente') {
      const nombre = (r.c_nombre || '').trim();
      const apellido = (r.c_apellido || '').trim();
      return (nombre || apellido) ? `${nombre} ${apellido}`.trim() : 'Cliente';
    } else if (tipo === 'empresa') {
      return (r.e_nombre || '').trim() || 'Empresa';
    }
    return '(sin actora)';
  }).filter(Boolean);

  let actoraStr = '(sin actora)';
  if (actoras.length === 1) actoraStr = actoras[0];
  else if (actoras.length > 1) actoraStr = `${actoras[0]} y otros`;

  // === DEMANDADOS (expedientes_demandados) ===
  const rsDem = await pool.request()
    .input('id', sql.Int, expedienteId)
    .query(`
      SELECT ed.id, ed.tipo,
             cli.nombre  AS c_nombre, cli.apellido AS c_apellido,
             emp.nombre  AS e_nombre
      FROM expedientes_demandados ed
      LEFT JOIN clientes   cli ON cli.id = ed.id_cliente
      LEFT JOIN demandados emp ON emp.id = ed.id_demandado
      WHERE ed.id_expediente = @id
      ORDER BY ed.id ASC
    `);

  const demandados = rsDem.recordset.map(r => {
    const tipo = (r.tipo || '').toLowerCase();
    if (tipo === 'cliente') {
      const nombre = (r.c_nombre || '').trim();
      const apellido = (r.c_apellido || '').trim();
      return (nombre || apellido) ? `${nombre} ${apellido}`.trim() : 'Cliente';
    } else if (tipo === 'empresa') {
      return (r.e_nombre || '').trim() || 'Empresa';
    }
    return '(sin demandado)';
  }).filter(Boolean);

  let demandadoStr = '(sin demandado)';
  if (demandados.length === 1) demandadoStr = demandados[0];
  else if (demandados.length > 1) demandadoStr = `${demandados[0]} y otros`;

  // === Materia: prioridad descripción de codigo > juicio ===
  const rsExp = await pool.request()
    .input('id', sql.Int, expedienteId)
    .query(`
      SELECT 
        e.juicio,
        e.titulo,
        j.descripcion AS codigo_descripcion,
        COALESCE(NULLIF(LTRIM(RTRIM(j.descripcion)), ''), NULLIF(LTRIM(RTRIM(e.juicio)), '')) AS materia
      FROM expedientes e
      LEFT JOIN dbo.codigos j
             ON j.id = e.codigo_id
      WHERE e.id = @id
    `);

  const row = rsExp.recordset[0] || {};
  const materia = (row.materia || '').toString().trim();
  const tituloActual = row.titulo ? row.titulo.toString().trim() : null;

  // Carátula final: "Actora c/ Demandado s/ Materia"
  const caratula = materia
    ? `${actoraStr} c/ ${demandadoStr} s/ ${materia}`
    : `${actoraStr} c/ ${demandadoStr}`;

  const tituloNuevo = tituloActual ?? caratula;

  // === Actualización ===
  await pool.request()
    .input('id', sql.Int, expedienteId)
    .input('caratula', sql.NVarChar, caratula)
    .input('titulo', sql.NVarChar, tituloNuevo)
    .query(`
      UPDATE expedientes
         SET caratula = @caratula,
             titulo   = @titulo
       WHERE id = @id
    `);

  console.log(`Carátula recalculada: ${caratula}`);
  return caratula;
}

app.post('/expedientes/agregar', async (req, res) => {
  await poolConnect;

  const {
    titulo, descripcion, demandado_id, juzgado_id, numero, anio,
    usuario_id, estado, honorario, monto,
    fecha_inicio, juez_id, juicio, requiere_atencion, fecha_sentencia,
    numeroCliente, minutosSinLuz, periodoCorte,
    actoras, demandados, porcentaje, procurador_id
  } = req.body;

  if (!numero || !anio || !juzgado_id) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios',
      camposRequeridos: ['numero', 'anio', 'juzgado']
    });
  }

  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    // Helper: Request asociado a la transacción + timeout más alto
    const R = () => {
      const r = new sql.Request(tx);
      r.timeout = 60000; // 60s (ajustá si querés)
      return r;
    };

    // Helper: pedir un ID a una SEQUENCE (SIEMPRE dentro de tx)
    const nextId = async (seqName) => {
      const q = `SELECT NEXT VALUE FOR ${seqName} AS id;`;
      const rs = await R().query(q);
      return rs.recordset[0].id;
    };

    // 1) Tipo de juzgado
    const tipoJuzgadoResult = await R()
      .input('juzgado_id', sql.Int, juzgado_id)
      .query(`SELECT tipo FROM juzgados WHERE id = @juzgado_id;`);

    if (!tipoJuzgadoResult.recordset.length) {
      throw new Error('No se encontró el tipo del juzgado especificado.');
    }
    const tipoJ = tipoJuzgadoResult.recordset[0].tipo;

    // 2) Unicidad (numero + anio + tipo juzgado)
    const existeResult = await R()
      .input('numero', sql.Int, numero)
      .input('anio', sql.Int, anio)
      .input('tipo', sql.NVarChar, tipoJ)
      .query(`
        SELECT TOP 1 1 AS existe
        FROM expedientes e
        JOIN juzgados j ON e.juzgado_id = j.id
        WHERE e.numero = @numero
          AND e.anio = @anio
          AND j.tipo = @tipo
          AND e.estado <> 'eliminado';
      `);

    if (existeResult.recordset.length) {
      await tx.rollback();
      return res.status(400).json({
        error: 'Ya existe un expediente con el mismo número, año y juzgado.'
      });
    }

    // 3) ID del expediente por SEQUENCE
    const expedienteId = await nextId('seq_expedientes');

    // 4) Insert expediente
    const insertExp = await R()
      .input('id', sql.Int, expedienteId)
      .input('titulo', sql.NVarChar, (titulo ?? '').toString())
      .input('descripcion', sql.NVarChar, (descripcion ?? '').toString())
      .input('numero', sql.Int, numero)
      .input('anio', sql.Int, anio)
      .input('demandado_id', sql.Int, demandado_id ?? null)
      .input('juzgado_id', sql.Int, juzgado_id)
      .input('estado', sql.NVarChar, estado ?? null)
      .input('fecha_inicio', sql.DateTime, fecha_inicio ?? null)
      .input('fecha_sentencia', sql.DateTime, fecha_sentencia ?? null)
      .input('honorario', sql.NVarChar, honorario ?? null)
      .input('juez_id', sql.Int, juez_id ?? null)
      .input('juicio', sql.NVarChar, juicio ?? null)
      .input('monto', sql.NVarChar, monto ?? null)
      .input('usuario_id', sql.Int, usuario_id ?? null)
      .input('numeroCliente', sql.NVarChar, numeroCliente ?? null)
      .input('minutosSinLuz', sql.Int, minutosSinLuz ?? null)
      .input('periodoCorte', sql.NVarChar, periodoCorte ?? null)
      .input('porcentaje', sql.Float, porcentaje ?? null)
      .input('procurador_id', sql.Int, procurador_id ?? null)
      .input('requiere_atencion', sql.Bit, !!requiere_atencion)
      .query(`
        INSERT INTO expedientes (
          id, titulo, descripcion, numero, anio, demandado_id, juzgado_id,
          fecha_creacion, estado, fecha_inicio, honorario,
          juez_id, juicio, fecha_sentencia, ultimo_movimiento,
          monto, usuario_id, numeroCliente, minutosSinLuz, periodoCorte,
          porcentaje, procurador_id, requiere_atencion
        )
        VALUES (
          @id, @titulo, @descripcion, @numero, @anio, @demandado_id, @juzgado_id,
          GETDATE(), @estado, @fecha_inicio, @honorario,
          @juez_id, @juicio, @fecha_sentencia, @fecha_inicio,
          @monto, @usuario_id, @numeroCliente, @minutosSinLuz, @periodoCorte,
          @porcentaje, @procurador_id, @requiere_atencion
        );
      `);

    // 5) ACTORAS (secuencial, pero ya sin MAX+1 y sin pool fuera de tx)
    if (Array.isArray(actoras)) {
      for (const a of actoras) {
        const tipoA = (a?.tipo || '').toLowerCase();
        const idA = Number(a?.id) || null;

        if (!idA || (tipoA !== 'cliente' && tipoA !== 'empresa')) {
          throw new Error(`Actora inválida: ${JSON.stringify(a)}`);
        }

        const idRel = await nextId('seq_clientes_expedientes');

        await R()
          .input('id_rel', sql.Int, idRel)
          .input('id_expediente', sql.Int, expedienteId)
          .input('tipo', sql.NVarChar, tipoA)
          .input('id_ref', sql.Int, idA)
          .query(`
            INSERT INTO clientes_expedientes (id, id_expediente, id_cliente, id_empresa, tipo)
            VALUES (
              @id_rel,
              @id_expediente,
              CASE WHEN @tipo = 'cliente' THEN @id_ref ELSE NULL END,
              CASE WHEN @tipo = 'empresa' THEN @id_ref ELSE NULL END,
              @tipo
            );
          `);
      }
    }

    // 6) DEMANDADOS
    if (Array.isArray(demandados)) {
      for (const d of demandados) {
        const tipoD = (d?.tipo || '').toLowerCase();
        const idD = Number(d?.id) || null;

        if (!idD || (tipoD !== 'cliente' && tipoD !== 'empresa')) {
          throw new Error(`Demandado inválido: ${JSON.stringify(d)}`);
        }

        const idRel = await nextId('seq_expedientes_demandados');

        await R()
          .input('id_rel', sql.Int, idRel)
          .input('id_expediente', sql.Int, expedienteId)
          .input('tipo', sql.NVarChar, tipoD)
          .input('id_ref', sql.Int, idD)
          .query(`
            INSERT INTO expedientes_demandados (id, id_expediente, id_cliente, id_demandado, tipo)
            VALUES (
              @id_rel,
              @id_expediente,
              CASE WHEN @tipo = 'cliente' THEN @id_ref ELSE NULL END,
              CASE WHEN @tipo = 'empresa' THEN @id_ref ELSE NULL END,
              @tipo
            );
          `);
      }
    }

    // 7) Commit
    await tx.commit();

    // 8) Recalcular carátula fuera de tx
    await recalcularCaratula(pool, expedienteId);

    res.status(201).json({
      message: 'Expediente agregado correctamente',
      expedienteId
    });

  } catch (err) {
    try { await tx.rollback(); } catch {}
    console.error('POST /expedientes/agregar ERROR =>', err);
    res.status(500).json({
      error: 'Error al agregar expediente',
      message: err?.message || String(err)
    });
  }
});


/*
app.post('/expedientes/agregar', async (req, res) => {
  await poolConnect; // <-- asegura que el pool ya está logueado

  const {
    titulo, descripcion, demandado_id, juzgado_id, numero, anio,
    usuario_id, estado, honorario, monto, ultimo_movimiento,
    fecha_inicio, juez_id, juicio, requiere_atencion, fecha_sentencia,
    numeroCliente, minutosSinLuz, periodoCorte,
    actoras, demandados, porcentaje, procurador_id
  } = req.body;

  if (!numero || !anio || !juzgado_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios', camposRequeridos: ['numero','anio','juzgado'] });
  }

  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const R = () => new sql.Request(tx); // helper corto para crear requests con la transacción

    // 1) Tipo de juzgado
    const tipoJuzgadoResult = await R()
      .input('juzgado_id', sql.Int, juzgado_id)
      .query(`SELECT tipo FROM juzgados WHERE id = @juzgado_id`);

    if (!tipoJuzgadoResult.recordset.length) {
      throw new Error('No se encontró el tipo del juzgado especificado.');
    }
    const tipoJ = tipoJuzgadoResult.recordset[0].tipo;

    // 2) Unicidad (numero + anio + tipo juzgado)
    const resultExiste = await R()
      .input('numero', sql.Int, numero)
      .input('anio', sql.Int, anio)
      .input('tipo', sql.NVarChar, tipoJ)
      .query(`
        SELECT COUNT(*) AS count
        FROM expedientes e
        JOIN juzgados j ON e.juzgado_id = j.id
        WHERE e.numero=@numero AND e.anio=@anio AND j.tipo=@tipo AND e.estado!='eliminado'
      `);

    if (resultExiste.recordset[0].count > 0) {
      await tx.rollback();
      return res.status(400).json({ error: 'Ya existe un expediente con el mismo número, año y juzgado.' });
    }
    const idExpediente = await generarNuevoId(pool, 'expedientes', 'id');

    // 3) Insert expediente
    const insertExp = await R()
      .input('id', sql.Int, idExpediente)
      .input('titulo', sql.NVarChar, (titulo ?? '').toString())
      .input('descripcion', sql.NVarChar, (descripcion ?? '').toString())
      .input('numero', sql.Int, numero)
      .input('anio', sql.Int, anio)
      .input('demandado_id', sql.Int, demandado_id ?? null)
      .input('juzgado_id', sql.Int, juzgado_id)
      .input('estado', sql.NVarChar, estado ?? null)
      .input('fecha_inicio', sql.DateTime, fecha_inicio ?? null)
      .input('fecha_sentencia', sql.DateTime, fecha_sentencia ?? null)
      .input('honorario', sql.NVarChar, honorario ?? null)
      .input('juez_id', sql.Int, juez_id ?? null)
      .input('juicio', sql.NVarChar, juicio ?? null)
      .input('monto', sql.NVarChar, monto ?? null)
      .input('usuario_id', sql.Int, usuario_id ?? null)
      .input('numeroCliente', sql.NVarChar, numeroCliente ?? null)
      .input('minutosSinLuz', sql.Int, minutosSinLuz ?? null)
      .input('periodoCorte', sql.NVarChar, periodoCorte ?? null)
      .input('porcentaje', sql.Float, porcentaje ?? null)
      .input('procurador_id', sql.Int, procurador_id ?? null)
      .input('requiere_atencion', sql.Bit, !!requiere_atencion)

      .query(`
        INSERT INTO expedientes (
          id, titulo, descripcion, numero, anio, demandado_id, juzgado_id,
          fecha_creacion, estado, fecha_inicio, honorario,
          juez_id, juicio, fecha_sentencia, ultimo_movimiento,
          monto, usuario_id, numeroCliente, minutosSinLuz, periodoCorte,
          porcentaje, procurador_id, requiere_atencion
        )
        OUTPUT INSERTED.id
        VALUES (
          @id, @titulo, @descripcion, @numero, @anio, @demandado_id, @juzgado_id,
          GETDATE(), @estado, @fecha_inicio, @honorario,
          @juez_id, @juicio, @fecha_sentencia, @fecha_inicio,
          @monto, @usuario_id, @numeroCliente, @minutosSinLuz, @periodoCorte,
          @porcentaje, @procurador_id, @requiere_atencion
        )
      `);

    if (!insertExp.recordset?.length) {
      throw new Error('No se pudo generar el expediente');
    }
    const expedienteId = insertExp.recordset[0].id;


    
    // 4) ACTORAS (secuencial)
    if (Array.isArray(actoras)) {
      for (const a of actoras) {
        const tipoA = (a?.tipo || '').toLowerCase();
        const idA   = Number(a?.id) || null;
        const id = await generarNuevoId(pool, 'clientes_expedientes', 'id');

        if (!idA || (tipoA !== 'cliente' && tipoA !== 'empresa')) {
          throw new Error(`Actora inválida: ${JSON.stringify(a)}`);
        }
        await R()
          .input('id_expediente', sql.Int, expedienteId)
          .input('tipo', sql.NVarChar, tipoA)
          //.input('id', sql.Int, idA)
          .input('id', sql.Int, id)

          .query(`
            INSERT INTO clientes_expedientes (id, id_expediente, id_cliente, id_empresa, tipo)
            VALUES (
              @id,
              @id_expediente,
              CASE WHEN @tipo = 'cliente' THEN @id ELSE NULL END,
              CASE WHEN @tipo = 'empresa' THEN @id ELSE NULL END,
              @tipo
            )
          `);
      }
    }

    // 5) DEMANDADOS (secuencial)
    if (Array.isArray(demandados)) {
      for (const d of demandados) {
        const tipoD = (d?.tipo || '').toLowerCase();
        const idD   = Number(d?.id) || null;
        const id = await generarNuevoId(pool, 'expedientes_demandados', 'id');

        if (!idD || (tipoD !== 'cliente' && tipoD !== 'empresa')) {
          throw new Error(`Demandado inválido: ${JSON.stringify(d)}`);
        }
        await R()
          .input('id_expediente', sql.Int, expedienteId)
          .input('tipo', sql.NVarChar, tipoD)
          //.input('id', sql.Int, idD)
          .input('id', sql.Int, id)

          .query(`
            INSERT INTO expedientes_demandados (id, id_expediente, id_cliente, id_demandado, tipo)
            VALUES (
              @id,
              @id_expediente,
              CASE WHEN @tipo = 'cliente' THEN @id ELSE NULL END,
              CASE WHEN @tipo = 'empresa' THEN @id ELSE NULL END,
              @tipo
            )
          `);
      }
    }

    // 6) Confirmo primero
    await tx.commit();

    // 7) Ahora sí recalculo carátula FUERA de la transacción (evita usar la misma conexión ocupada)
    await recalcularCaratula(tx, expedienteId);
  

    res.status(201).json({ message: 'Expediente agregado correctamente', expedienteId });
  } catch (err) {
    try { await tx.rollback(); } catch {}
    console.error('POST /expedientes/agregar ERROR =>', err);
    res.status(500).json({ error: 'Error al agregar expediente', message: err?.message || String(err) });
  }
});*/


/*
app.post('/expedientes/agregar', async (req, res) => {
  const body = req.body;
  const poolConn = await pool.connect();
  const tx = new sql.Transaction(poolConn);

  try {
    await tx.begin();

    // 1) Insert expediente
    const insertExp = new sql.Request(tx)
      .input('numero', sql.Int, body.numero)
      .input('anio', sql.Int, body.anio)
      .input('estado', sql.VarChar, body.estado)
      .input('juicio', sql.VarChar, body.juicio)
      .input('porcentaje', sql.Decimal(10,2), body.porcentaje ?? null)
      .input('fecha_inicio', sql.Date, body.fecha_inicio || null)
      .input('juzgado_id', sql.Int, body.juzgado_id || null)
      .input('usuario_id', sql.Int, body.usuario_id || null)
      .input('procurador_id', sql.Int, body.procurador_id || null)
      .query(`
        INSERT INTO expedientes (numero, anio, estado, juicio, porcentaje, fecha_inicio, juzgado_id, usuario_id, procurador_id)
        OUTPUT INSERTED.id
        VALUES (@numero, @anio, @estado, @juicio, @porcentaje, @fecha_inicio, @juzgado_id, @usuario_id, @procurador_id)
      `);

    const expedienteId = insertExp.recordset[0].id;

    // 2) Insert ACTORAS
    const actoras = Array.isArray(body.actoras) ? body.actoras : [];
    for (const a of actoras) {
      if (a.tipo === 'cliente') {
        await new sql.Request(tx)
          .input('expediente_id', sql.Int, expedienteId)
          .input('cliente_id', sql.Int, a.id)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM expedientes_clientes WHERE expediente_id=@expediente_id AND cliente_id=@cliente_id)
              INSERT INTO expedientes_clientes (expediente_id, cliente_id, rol) VALUES (@expediente_id, @cliente_id, 'actora')
          `);
      } else if (a.tipo === 'empresa') {
        // si querés guardar actoras empresas en otra tabla, hacelo acá; si no, podés usar la misma de demandados con 'tipo'
        await new sql.Request(tx)
          .input('expediente_id', sql.Int, expedienteId)
          .input('empresa_id', sql.Int, a.id)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM expedientes_demandados WHERE expediente_id=@expediente_id AND empresa_id=@empresa_id AND tipo='actora')
              INSERT INTO expedientes_demandados (expediente_id, tipo, empresa_id, cliente_id)
              VALUES (@expediente_id, 'actora', @empresa_id, NULL)
          `);
      }
    }

    // 3) Insert DEMANDADOS (varios)
    const demandados = Array.isArray(body.demandados) ? body.demandados : [];
    for (const d of demandados) {
      const reqDem = new sql.Request(tx)
        .input('expediente_id', sql.Int, expedienteId);

      if (d.tipo === 'empresa') {
        reqDem.input('empresa_id', sql.Int, d.id);
        await reqDem.query(`
          IF NOT EXISTS (SELECT 1 FROM expedientes_demandados WHERE expediente_id=@expediente_id AND empresa_id=@empresa_id AND tipo='demandado')
            INSERT INTO expedientes_demandados (expediente_id, tipo, empresa_id, cliente_id)
            VALUES (@expediente_id, 'demandado', @empresa_id, NULL)
        `);
      } else if (d.tipo === 'cliente') {
        reqDem.input('cliente_id', sql.Int, d.id);
        await reqDem.query(`
          IF NOT EXISTS (SELECT 1 FROM expedientes_demandados WHERE expediente_id=@expediente_id AND cliente_id=@cliente_id AND tipo='demandado')
            INSERT INTO expedientes_demandados (expediente_id, tipo, empresa_id, cliente_id)
            VALUES (@expediente_id, 'demandado', NULL, @cliente_id)
        `);
      }
    }

    await tx.commit();
    res.json({ ok: true, id: expedienteId });
  } catch (err) {
    if (tx._aborted !== true) await tx.rollback();
    console.error('Error al agregar expediente:', err);
    res.status(500).send('Error al agregar expediente');
  } finally {
    poolConn.release();
  }
});
*/




/*** ============================================================
 *  MODIFICAR EXPEDIENTE (PUT /expedientes/modificar/:id)
 *  - Actualiza expediente
 *  - Reemplaza vínculos con demandados/clientes si vienen
 *  - Recalcula y persiste carátula
 *  ============================================================ */
/*
app.put('/expedientes/modificar/:id', async (req, res) => {
  const { id } = req.params;
  const nuevosDatos = req.body;

  console.log('Datos recibidos para actualizar:', nuevosDatos);

  // Unicidad nro/año/juzgado (excluyendo el propio)
  const resultExiste = await pool.request()
    .input('id', sql.Int, id)
    .input('numero', sql.Int, nuevosDatos.numero)
    .input('anio', sql.Int, nuevosDatos.anio)
    .input('juzgado_id', sql.Int, nuevosDatos.juzgado_id)
    .query(`
      SELECT COUNT(*) AS count
      FROM expedientes
      WHERE numero = @numero
        AND anio = @anio
        AND juzgado_id = @juzgado_id
        AND id <> @id
        AND estado != 'eliminado'
    `);

  if (resultExiste.recordset[0].count > 0) {
    return res.status(400).json({
      error: 'Ya existe un expediente con el mismo número, año y juzgado.'
    });
  }

  try {
    // =========================
    // Update del expediente (SE MANTIENEN TODOS TUS INPUTS)
    // =========================
    const resultado = await pool.request()
      .input('id', sql.Int, id)
      .input('titulo', sql.NVarChar, nuevosDatos.titulo)
      .input('descripcion', sql.NVarChar, nuevosDatos.descripcion)
      .input('numero', sql.Int, nuevosDatos.numero)
      .input('anio', sql.Int, nuevosDatos.anio)
      .input('juzgado_id', sql.Int, nuevosDatos.juzgado_id)
      .input('estado', sql.NVarChar, nuevosDatos.estado)
      .input('juez_id', sql.Int, nuevosDatos.juez_id)
      .input('honorario', sql.NVarChar, nuevosDatos.honorario)
      .input('fecha_inicio', sql.DateTime, nuevosDatos.fecha_inicio)
      .input('juicio', sql.NVarChar, nuevosDatos.juicio)
      .input('fecha_sentencia', sql.DateTime, nuevosDatos.fecha_sentencia)
      .input('monto', sql.Int, nuevosDatos.monto)
      .input('apela', sql.Bit, nuevosDatos.apela)
      .input('ultimo_movimiento', sql.DateTime, nuevosDatos.ultimo_movimiento)
      .input('porcentaje', sql.Float, nuevosDatos.porcentaje)
      .input('usuario_id', sql.Int, nuevosDatos.usuario_id)
      .input('fecha_cobro', sql.DateTime, nuevosDatos.fecha_cobro)
      .input('fecha_cobro_capital', sql.DateTime, nuevosDatos.fecha_cobro_capital)
      .input('valorUMA', sql.Int, nuevosDatos.valorUMA)
      .input('procurador_id', sql.Int, nuevosDatos.procurador_id)
      .input('sala', sql.NVarChar, nuevosDatos.sala)
      .input('requiere_atencion', sql.Bit, nuevosDatos.requiere_atencion)
      .input('fecha_atencion', sql.Date, (nuevosDatos.fecha_atencion && nuevosDatos.fecha_atencion !== '') ? new Date(nuevosDatos.fecha_atencion) : null)

      // Capital
      .input('estadoCapitalSeleccionado', sql.NVarChar, nuevosDatos.estadoCapitalSeleccionado)
      .input('subEstadoCapitalSeleccionado', sql.NVarChar, nuevosDatos.subEstadoCapitalSeleccionado)
      .input('fechaCapitalSubestado', sql.DateTime, nuevosDatos.fechaCapitalSubestado)
      .input('estadoLiquidacionCapitalSeleccionado', sql.NVarChar, nuevosDatos.estadoLiquidacionCapitalSeleccionado)
      .input('fechaLiquidacionCapital', sql.DateTime, nuevosDatos.fechaLiquidacionCapital)
      .input('montoLiquidacionCapital', sql.Float, nuevosDatos.montoLiquidacionCapital)
      .input('capitalCobrado', sql.Bit, nuevosDatos.capitalCobrado)

      // Honorarios
      .input('estadoHonorariosSeleccionado', sql.NVarChar, nuevosDatos.estadoHonorariosSeleccionado)
      .input('subEstadoHonorariosSeleccionado', sql.NVarChar, nuevosDatos.subEstadoHonorariosSeleccionado)
      .input('fechaHonorariosSubestado', sql.DateTime, nuevosDatos.fechaHonorariosSubestado)
      .input('estadoLiquidacionHonorariosSeleccionado', sql.NVarChar, nuevosDatos.estadoLiquidacionHonorariosSeleccionado)
      .input('fechaLiquidacionHonorarios', sql.DateTime, nuevosDatos.fechaLiquidacionHonorarios)
      .input('montoLiquidacionHonorarios', sql.Float, nuevosDatos.montoLiquidacionHonorarios)
      .input('honorarioCobrado', sql.Bit, nuevosDatos.honorarioCobrado)
      .input('cantidadUMA', sql.Float, nuevosDatos.cantidadUMA)

      // Alzada
      .input('estadoHonorariosAlzadaSeleccionado', sql.NVarChar, nuevosDatos.estadoHonorariosAlzadaSeleccionado)
      .input('subEstadoHonorariosAlzadaSeleccionado', sql.NVarChar, nuevosDatos.subEstadoHonorariosAlzadaSeleccionado)
      .input('fechaHonorariosAlzada', sql.DateTime, nuevosDatos.fechaHonorariosAlzada)
      .input('umaSeleccionado_alzada', sql.Int, nuevosDatos.umaSeleccionado_alzada ?? null)
      .input('cantidadUMA_alzada', sql.Float, nuevosDatos.cantidadUMA_alzada)
      .input('montoAcuerdo_alzada', sql.Float, nuevosDatos.montoAcuerdo_alzada)
      .input('honorarioAlzadaCobrado', sql.Bit, nuevosDatos.honorarioAlzadaCobrado ?? false)
      .input('fechaCobroAlzada', sql.DateTime, nuevosDatos.fechaCobroAlzada ?? null)

      // Ejecución
      .input('estadoHonorariosEjecucionSeleccionado', sql.NVarChar, nuevosDatos.estadoHonorariosEjecucionSeleccionado)
      .input('subEstadoHonorariosEjecucionSeleccionado', sql.NVarChar, nuevosDatos.subEstadoHonorariosEjecucionSeleccionado)
      .input('fechaHonorariosEjecucion', sql.DateTime, nuevosDatos.fechaHonorariosEjecucion)
      .input('montoHonorariosEjecucion', sql.Float, nuevosDatos.montoHonorariosEjecucion)
      .input('honorarioEjecucionCobrado', sql.Bit, nuevosDatos.honorarioEjecucionCobrado ?? false)
      .input('fechaCobroEjecucion', sql.DateTime, nuevosDatos.fechaCobroEjecucion ?? null)
      .input('cantidadUMA_ejecucion', sql.Float, nuevosDatos.cantidadUMA_ejecucion)
      .input('umaSeleccionado_ejecucion', sql.Int, nuevosDatos.umaSeleccionado_ejecucion ?? null)

      // Diferencia
      .input('estadoHonorariosDiferenciaSeleccionado', sql.NVarChar, nuevosDatos.estadoHonorariosDiferenciaSeleccionado)
      .input('subEstadoHonorariosDiferenciaSeleccionado', sql.NVarChar, nuevosDatos.subEstadoHonorariosDiferenciaSeleccionado)
      .input('fechaHonorariosDiferencia', sql.DateTime, nuevosDatos.fechaHonorariosDiferencia)
      .input('montoHonorariosDiferencia', sql.Float, nuevosDatos.montoHonorariosDiferencia)
      .input('honorarioDiferenciaCobrado', sql.Bit, nuevosDatos.honorarioDiferenciaCobrado ?? false)
      .input('fechaCobroDiferencia', sql.DateTime, nuevosDatos.fechaCobroDiferencia ?? null)
      .input('capitalPagoParcial', sql.Float, nuevosDatos.capitalPagoParcial ?? null)
      .input('esPagoParcial', sql.Bit, nuevosDatos.esPagoParcial ?? false)
      .input('codigo_id', sql.Int, nuevosDatos.codigo_id)

      .query(`
        UPDATE expedientes
        SET 
          titulo = @titulo,
          descripcion = @descripcion,
          numero = @numero,
          anio = @anio,
          juzgado_id = @juzgado_id,
          estado = @estado,
          juez_id = @juez_id,
          honorario = @honorario,
          fecha_inicio = @fecha_inicio,
          juicio = @juicio,
          fecha_sentencia = @fecha_sentencia,
          monto = @monto,
          apela = @apela,
          ultimo_movimiento = @ultimo_movimiento,
          porcentaje = @porcentaje,
          usuario_id = @usuario_id,
          fecha_cobro = @fecha_cobro,
          fecha_cobro_capital = @fecha_cobro_capital,
          procurador_id = @procurador_id,
          valorUMA = @valorUMA,
          sala = @sala,
          requiere_atencion = @requiere_atencion,
          fecha_atencion = @fecha_atencion,

          -- Capital
          estadoCapitalSeleccionado = @estadoCapitalSeleccionado,
          subEstadoCapitalSeleccionado = @subEstadoCapitalSeleccionado,
          fechaCapitalSubestado = @fechaCapitalSubestado,
          estadoLiquidacionCapitalSeleccionado = @estadoLiquidacionCapitalSeleccionado,
          fechaLiquidacionCapital = @fechaLiquidacionCapital,
          montoLiquidacionCapital = @montoLiquidacionCapital,
          capitalCobrado = @capitalCobrado,

          -- Honorarios
          estadoHonorariosSeleccionado = @estadoHonorariosSeleccionado,
          subEstadoHonorariosSeleccionado = @subEstadoHonorariosSeleccionado,
          fechaHonorariosSubestado = @fechaHonorariosSubestado,
          estadoLiquidacionHonorariosSeleccionado = @estadoLiquidacionHonorariosSeleccionado,
          fechaLiquidacionHonorarios = @fechaLiquidacionHonorarios,
          montoLiquidacionHonorarios = @montoLiquidacionHonorarios,
          honorarioCobrado = @honorarioCobrado,
          cantidadUMA = @cantidadUMA,

          -- Alzada
          estadoHonorariosAlzadaSeleccionado = @estadoHonorariosAlzadaSeleccionado,
          subEstadoHonorariosAlzadaSeleccionado = @subEstadoHonorariosAlzadaSeleccionado,
          fechaHonorariosAlzada = @fechaHonorariosAlzada,
          umaSeleccionado_alzada = @umaSeleccionado_alzada,
          cantidadUMA_alzada = @cantidadUMA_alzada,
          montoAcuerdo_alzada = @montoAcuerdo_alzada,
          honorarioAlzadaCobrado = @honorarioAlzadaCobrado,
          fechaCobroAlzada = @fechaCobroAlzada,

          -- Ejecución
          estadoHonorariosEjecucionSeleccionado = @estadoHonorariosEjecucionSeleccionado,
          subEstadoHonorariosEjecucionSeleccionado = @subEstadoHonorariosEjecucionSeleccionado,
          fechaHonorariosEjecucion = @fechaHonorariosEjecucion,
          montoHonorariosEjecucion = @montoHonorariosEjecucion,
          honorarioEjecucionCobrado = @honorarioEjecucionCobrado,
          fechaCobroEjecucion = @fechaCobroEjecucion,
          cantidadUMA_ejecucion = @cantidadUMA_ejecucion,
          umaSeleccionado_ejecucion = @umaSeleccionado_ejecucion,

          -- Diferencia
          estadoHonorariosDiferenciaSeleccionado = @estadoHonorariosDiferenciaSeleccionado,
          subEstadoHonorariosDiferenciaSeleccionado = @subEstadoHonorariosDiferenciaSeleccionado,
          fechaHonorariosDiferencia = @fechaHonorariosDiferencia,
          montoHonorariosDiferencia = @montoHonorariosDiferencia,
          honorarioDiferenciaCobrado = @honorarioDiferenciaCobrado,
          fechaCobroDiferencia = @fechaCobroDiferencia,

          capitalPagoParcial = @capitalPagoParcial,
          esPagoParcial = @esPagoParcial,
          codigo_id = @codigo_id

        WHERE id = @id
      `);

    // =========================
    // Reemplazo de relaciones (MIXTO)
    // =========================

    // DEMANDADOS MIXTOS: expedientes_demandados (empresa/cliente) – 1 o más, vos decidís
    if (nuevosDatos.recalcular_caratula == true) {

    if (Array.isArray(nuevosDatos.demandados)) {
      await pool.request()
        .input('id_expediente', sql.Int, id)
        .query(`DELETE FROM expedientes_demandados WHERE id_expediente = @id_expediente`);

      for (const d of nuevosDatos.demandados) {
        const tipoD = (d?.tipo || '').toLowerCase();
        const idD = Number(d?.id) || null;
        if (!idD || (tipoD !== 'cliente' && tipoD !== 'empresa')) continue;
        const id = await generarNuevoId(pool, 'expedientes_demandados', 'id');

        await pool.request()
          .input('id_expediente', sql.Int, id)
          .input('tipo', sql.NVarChar, tipoD)
          .input('id', sql.Int, id)
          .query(`
            INSERT INTO expedientes_demandados (id, id_expediente, id_cliente, id_demandado, tipo)
            VALUES (
              @id,
              @id_expediente,
              CASE WHEN @tipo='cliente' THEN @id ELSE NULL END,
              CASE WHEN @tipo='empresa' THEN @id ELSE NULL END,
              @tipo
            )
          `);
      }
    }

    // ACTORAS MIXTAS: clientes_expedientes (empresa/cliente)
    if (Array.isArray(nuevosDatos.actoras)) {
      await pool.request()
        .input('id_expediente', sql.Int, id)
        .query(`DELETE FROM clientes_expedientes WHERE id_expediente = @id_expediente`);

      for (const a of nuevosDatos.actoras) {
        const tipoA = (a?.tipo || '').toLowerCase();
        const idA = Number(a?.id) || null;
        const id = await generarNuevoId(pool, 'clientes_expedientes', 'id');

        if (!idA || (tipoA !== 'cliente' && tipoA !== 'empresa')) continue;

        await pool.request()
          .input('id_expediente', sql.Int, id)
          .input('tipo', sql.NVarChar, tipoA)
          .input('id', sql.Int, id)
          .query(`
            INSERT INTO clientes_expedientes (id, id_expediente, id_cliente, id_empresa, tipo)
            VALUES (
              @id,
              @id_expediente,
              CASE WHEN @tipo='cliente' THEN @id ELSE NULL END,
              CASE WHEN @tipo='empresa' THEN @id ELSE NULL END,
              @tipo
            )
          `);
      }
    }

    // =========================
    // Recalcular y guardar carátula
    // =========================
    await recalcularCaratula(pool, Number(id));
    }

    if (resultado.rowsAffected[0] > 0) {
      res.status(200).json({ mensaje: 'Expediente actualizado correctamente' });
    } else {
      res.status(404).json({ mensaje: 'Expediente no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar expediente:', error);
    res.status(500).json({ mensaje: 'Error al actualizar expediente' });
  }
});*/

app.put('/expedientes/modificar/:id', async (req, res) => {
  const { id } = req.params;
  const expedienteIdNum = Number(id);
  const nuevosDatos = req.body;

  //console.log('Datos recibidos para actualizar:', nuevosDatos);

  // Unicidad nro/año/juzgado (excluyendo el propio)
  const resultExiste = await pool.request()
    .input('id', sql.Int, expedienteIdNum)
    .input('numero', sql.Int, nuevosDatos.numero)
    .input('anio', sql.Int, nuevosDatos.anio)
    .input('juzgado_id', sql.Int, nuevosDatos.juzgado_id)
    .query(`
      SELECT COUNT(*) AS count
      FROM expedientes
      WHERE numero = @numero
        AND anio = @anio
        AND juzgado_id = @juzgado_id
        AND id <> @id
        AND estado != 'eliminado'
    `);

  if (resultExiste.recordset[0].count > 0) {
    return res.status(400).json({
      error: 'Ya existe un expediente con el mismo número, año y juzgado.'
    });
  }

  try {


    const resultado = await pool.request()
      .input('id', sql.Int, expedienteIdNum)
      .input('titulo', sql.NVarChar, nuevosDatos.titulo)
      .input('descripcion', sql.NVarChar, nuevosDatos.descripcion)
      .input('numero', sql.Int, nuevosDatos.numero)
      .input('anio', sql.Int, nuevosDatos.anio)
      .input('juzgado_id', sql.Int, nuevosDatos.juzgado_id)
      .input('estado', sql.NVarChar, nuevosDatos.estado)
      .input('juez_id', sql.Int, nuevosDatos.juez_id)
      .input('honorario', sql.NVarChar, nuevosDatos.honorario)
      .input('fecha_inicio', sql.DateTime, nuevosDatos.fecha_inicio)
      .input('juicio', sql.NVarChar, nuevosDatos.juicio)
      .input('fecha_sentencia', sql.DateTime, nuevosDatos.fecha_sentencia)
      .input('monto', sql.Int, nuevosDatos.monto)
      .input('apela', sql.Bit, nuevosDatos.apela)
      .input('ultimo_movimiento', sql.DateTime, nuevosDatos.ultimo_movimiento)
      .input('porcentaje', sql.Float, nuevosDatos.porcentaje)
      .input('usuario_id', sql.Int, nuevosDatos.usuario_id)
      .input('fecha_cobro', sql.DateTime, nuevosDatos.fecha_cobro)
      .input('fecha_cobro_capital', sql.DateTime, nuevosDatos.fecha_cobro_capital)
      .input('valorUMA', sql.Int, nuevosDatos.valorUMA)
      .input('procurador_id', sql.Int, nuevosDatos.procurador_id)
      .input('sala', sql.NVarChar, nuevosDatos.sala)
      .input('requiere_atencion', sql.Bit, nuevosDatos.requiere_atencion)
      .input(
        'fecha_atencion',
        sql.Date,
        (nuevosDatos.fecha_atencion && nuevosDatos.fecha_atencion !== '')
          ? new Date(nuevosDatos.fecha_atencion)
          : null
      )

      // Capital
      .input('estadoCapitalSeleccionado', sql.NVarChar, nuevosDatos.estadoCapitalSeleccionado)
      .input('subEstadoCapitalSeleccionado', sql.NVarChar, nuevosDatos.subEstadoCapitalSeleccionado)
      .input('fechaCapitalSubestado', sql.DateTime, nuevosDatos.fechaCapitalSubestado)
      .input('estadoLiquidacionCapitalSeleccionado', sql.NVarChar, nuevosDatos.estadoLiquidacionCapitalSeleccionado)
      .input('fechaLiquidacionCapital', sql.DateTime, nuevosDatos.fechaLiquidacionCapital)
      .input('montoLiquidacionCapital', sql.Float, nuevosDatos.montoLiquidacionCapital)
      .input('capitalCobrado', sql.Bit, nuevosDatos.capitalCobrado)

      // Honorarios
      .input('estadoHonorariosSeleccionado', sql.NVarChar, nuevosDatos.estadoHonorariosSeleccionado)
      .input('subEstadoHonorariosSeleccionado', sql.NVarChar, nuevosDatos.subEstadoHonorariosSeleccionado)
      .input('fechaHonorariosSubestado', sql.DateTime, nuevosDatos.fechaHonorariosSubestado)
      .input('estadoLiquidacionHonorariosSeleccionado', sql.NVarChar, nuevosDatos.estadoLiquidacionHonorariosSeleccionado)
      .input('fechaLiquidacionHonorarios', sql.DateTime, nuevosDatos.fechaLiquidacionHonorarios)
      .input('montoLiquidacionHonorarios', sql.Float, nuevosDatos.montoLiquidacionHonorarios)
      .input('honorarioCobrado', sql.Bit, nuevosDatos.honorarioCobrado)
      .input('cantidadUMA', sql.Float, nuevosDatos.cantidadUMA)

      // Alzada
      .input('estadoHonorariosAlzadaSeleccionado', sql.NVarChar, nuevosDatos.estadoHonorariosAlzadaSeleccionado)
      .input('subEstadoHonorariosAlzadaSeleccionado', sql.NVarChar, nuevosDatos.subEstadoHonorariosAlzadaSeleccionado)
      .input('fechaHonorariosAlzada', sql.DateTime, nuevosDatos.fechaHonorariosAlzada)
      .input('umaSeleccionado_alzada', sql.Int, nuevosDatos.umaSeleccionado_alzada ?? null)
      .input('cantidadUMA_alzada', sql.Float, nuevosDatos.cantidadUMA_alzada)
      .input('montoAcuerdo_alzada', sql.Float, nuevosDatos.montoAcuerdo_alzada)
      .input('honorarioAlzadaCobrado', sql.Bit, nuevosDatos.honorarioAlzadaCobrado ?? false)
      .input('fechaCobroAlzada', sql.DateTime, nuevosDatos.fechaCobroAlzada ?? null)

      // Ejecución
      .input('estadoHonorariosEjecucionSeleccionado', sql.NVarChar, nuevosDatos.estadoHonorariosEjecucionSeleccionado)
      .input('subEstadoHonorariosEjecucionSeleccionado', sql.NVarChar, nuevosDatos.subEstadoHonorariosEjecucionSeleccionado)
      .input('fechaHonorariosEjecucion', sql.DateTime, nuevosDatos.fechaHonorariosEjecucion)
      .input('montoHonorariosEjecucion', sql.Float, nuevosDatos.montoHonorariosEjecucion)
      .input('honorarioEjecucionCobrado', sql.Bit, nuevosDatos.honorarioEjecucionCobrado ?? false)
      .input('fechaCobroEjecucion', sql.DateTime, nuevosDatos.fechaCobroEjecucion ?? null)
      .input('cantidadUMA_ejecucion', sql.Float, nuevosDatos.cantidadUMA_ejecucion)
      .input('umaSeleccionado_ejecucion', sql.Int, nuevosDatos.umaSeleccionado_ejecucion ?? null)

      // Diferencia
      .input('estadoHonorariosDiferenciaSeleccionado', sql.NVarChar, nuevosDatos.estadoHonorariosDiferenciaSeleccionado)
      .input('subEstadoHonorariosDiferenciaSeleccionado', sql.NVarChar, nuevosDatos.subEstadoHonorariosDiferenciaSeleccionado)
      .input('fechaHonorariosDiferencia', sql.DateTime, nuevosDatos.fechaHonorariosDiferencia)
      .input('montoHonorariosDiferencia', sql.Float, nuevosDatos.montoHonorariosDiferencia)
      .input('honorarioDiferenciaCobrado', sql.Bit, nuevosDatos.honorarioDiferenciaCobrado ?? false)
      .input('fechaCobroDiferencia', sql.DateTime, nuevosDatos.fechaCobroDiferencia ?? null)
      .input('capitalPagoParcial', sql.Float, nuevosDatos.capitalPagoParcial ?? null)
      .input('esPagoParcial', sql.Bit, nuevosDatos.esPagoParcial ?? false)
      .input('codigo_id', sql.Int, nuevosDatos.codigo_id)

      .query(`
        UPDATE expedientes
        SET 
          titulo = @titulo,
          descripcion = @descripcion,
          numero = @numero,
          anio = @anio,
          juzgado_id = @juzgado_id,
          estado = @estado,
          juez_id = @juez_id,
          honorario = @honorario,
          fecha_inicio = @fecha_inicio,
          juicio = @juicio,
          fecha_sentencia = @fecha_sentencia,
          monto = @monto,
          apela = @apela,
          ultimo_movimiento = @ultimo_movimiento,
          porcentaje = @porcentaje,
          usuario_id = @usuario_id,
          fecha_cobro = @fecha_cobro,
          fecha_cobro_capital = @fecha_cobro_capital,
          procurador_id = @procurador_id,
          valorUMA = @valorUMA,
          sala = @sala,
          requiere_atencion = @requiere_atencion,
          fecha_atencion = @fecha_atencion,

          -- Capital
          estadoCapitalSeleccionado = @estadoCapitalSeleccionado,
          subEstadoCapitalSeleccionado = @subEstadoCapitalSeleccionado,
          fechaCapitalSubestado = @fechaCapitalSubestado,
          estadoLiquidacionCapitalSeleccionado = @estadoLiquidacionCapitalSeleccionado,
          fechaLiquidacionCapital = @fechaLiquidacionCapital,
          montoLiquidacionCapital = @montoLiquidacionCapital,
          capitalCobrado = @capitalCobrado,

          -- Honorarios
          estadoHonorariosSeleccionado = @estadoHonorariosSeleccionado,
          subEstadoHonorariosSeleccionado = @subEstadoHonorariosSeleccionado,
          fechaHonorariosSubestado = @fechaHonorariosSubestado,
          estadoLiquidacionHonorariosSeleccionado = @estadoLiquidacionHonorariosSeleccionado,
          fechaLiquidacionHonorarios = @fechaLiquidacionHonorarios,
          montoLiquidacionHonorarios = @montoLiquidacionHonorarios,
          honorarioCobrado = @honorarioCobrado,
          cantidadUMA = @cantidadUMA,

          -- Alzada
          estadoHonorariosAlzadaSeleccionado = @estadoHonorariosAlzadaSeleccionado,
          subEstadoHonorariosAlzadaSeleccionado = @subEstadoHonorariosAlzadaSeleccionado,
          fechaHonorariosAlzada = @fechaHonorariosAlzada,
          umaSeleccionado_alzada = @umaSeleccionado_alzada,
          cantidadUMA_alzada = @cantidadUMA_alzada,
          montoAcuerdo_alzada = @montoAcuerdo_alzada,
          honorarioAlzadaCobrado = @honorarioAlzadaCobrado,
          fechaCobroAlzada = @fechaCobroAlzada,

          -- Ejecución
          estadoHonorariosEjecucionSeleccionado = @estadoHonorariosEjecucionSeleccionado,
          subEstadoHonorariosEjecucionSeleccionado = @subEstadoHonorariosEjecucionSeleccionado,
          fechaHonorariosEjecucion = @fechaHonorariosEjecucion,
          montoHonorariosEjecucion = @montoHonorariosEjecucion,
          honorarioEjecucionCobrado = @honorarioEjecucionCobrado,
          fechaCobroEjecucion = @fechaCobroEjecucion,
          cantidadUMA_ejecucion = @cantidadUMA_ejecucion,
          umaSeleccionado_ejecucion = @umaSeleccionado_ejecucion,

          -- Diferencia
          estadoHonorariosDiferenciaSeleccionado = @estadoHonorariosDiferenciaSeleccionado,
          subEstadoHonorariosDiferenciaSeleccionado = @subEstadoHonorariosDiferenciaSeleccionado,
          fechaHonorariosDiferencia = @fechaHonorariosDiferencia,
          montoHonorariosDiferencia = @montoHonorariosDiferencia,
          honorarioDiferenciaCobrado = @honorarioDiferenciaCobrado,
          fechaCobroDiferencia = @fechaCobroDiferencia,

          capitalPagoParcial = @capitalPagoParcial,
          esPagoParcial = @esPagoParcial,
          codigo_id = @codigo_id

        WHERE id = @id
      `);

    // =========================
    // Reemplazo de relaciones (MIXTO)
    // =========================
    if (nuevosDatos.recalcular_caratula == true) {

      // DEMANDADOS MIXTOS
      if (Array.isArray(nuevosDatos.demandados)) {
        await pool.request()
          .input('id_expediente', sql.Int, expedienteIdNum)
          .query(`DELETE FROM expedientes_demandados WHERE id_expediente = @id_expediente`);

        for (const d of nuevosDatos.demandados) {
          const tipoD = (d?.tipo || '').toLowerCase();
          const entidadId = Number(d?.id) || null; // id del cliente o demandado real

          if (!entidadId || (tipoD !== 'cliente' && tipoD !== 'empresa')) continue;

          const relacionId = await generarNuevoId(pool, 'expedientes_demandados', 'id');

          await pool.request()
            .input('relacion_id', sql.Int, relacionId)
            .input('expediente_id', sql.Int, expedienteIdNum)
            .input('tipo', sql.NVarChar, tipoD)
            .input('entidad_id', sql.Int, entidadId)
            .query(`
              INSERT INTO expedientes_demandados (id, id_expediente, id_cliente, id_demandado, tipo)
              VALUES (
                @relacion_id,
                @expediente_id,
                CASE WHEN @tipo='cliente' THEN @entidad_id ELSE NULL END,
                CASE WHEN @tipo='empresa' THEN @entidad_id ELSE NULL END,
                @tipo
              )
            `);
        }
      }

      // ACTORAS MIXTAS
      if (Array.isArray(nuevosDatos.actoras)) {
        await pool.request()
          .input('id_expediente', sql.Int, expedienteIdNum)
          .query(`DELETE FROM clientes_expedientes WHERE id_expediente = @id_expediente`);

        for (const a of nuevosDatos.actoras) {
          const tipoA = (a?.tipo || '').toLowerCase();
          const entidadId = Number(a?.id) || null;

          if (!entidadId || (tipoA !== 'cliente' && tipoA !== 'empresa')) continue;

          const relacionId = await generarNuevoId(pool, 'clientes_expedientes', 'id');

          await pool.request()
            .input('relacion_id', sql.Int, relacionId)
            .input('expediente_id', sql.Int, expedienteIdNum)
            .input('tipo', sql.NVarChar, tipoA)
            .input('entidad_id', sql.Int, entidadId)
            .query(`
              INSERT INTO clientes_expedientes (id, id_expediente, id_cliente, id_empresa, tipo)
              VALUES (
                @relacion_id,
                @expediente_id,
                CASE WHEN @tipo='cliente' THEN @entidad_id ELSE NULL END,
                CASE WHEN @tipo='empresa' THEN @entidad_id ELSE NULL END,
                @tipo
              )
            `);
        }
      }

      // Recalcular y guardar carátula
      await recalcularCaratula(pool, expedienteIdNum);
    }

    if (resultado.rowsAffected[0] > 0) {
      res.status(200).json({ mensaje: 'Expediente actualizado correctamente' });
    } else {
      res.status(404).json({ mensaje: 'Expediente no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar expediente:', error);
    res.status(500).json({ mensaje: 'Error al actualizar expediente' });
  }
});


app.put('/expedientes/eliminar/:id_expediente', async (req, res) => {
  const { id_expediente } = req.params;

  try {
    if (!id_expediente || isNaN(id_expediente)) {
      return res.status(400).json({ error: 'El ID del expediente es obligatorio y debe ser un número válido' });
    }

    // Cambiar solo el estado del expediente
    const result = await pool.request()
      .input('id_expediente', sql.Int, id_expediente)
      .query(`
        UPDATE expedientes
        SET estado = 'eliminado'
        WHERE id = @id_expediente
      `);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Expediente eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Expediente no encontrado' });
    }
  } catch (err) {
    console.error('Error al eliminar expediente:', err.message);
    res.status(500).json({
      error: 'Error al eliminar expediente',
      message: err.message
    });
  }
});

app.get('/expedientes/buscar', async (req, res) => {
  try {
    const { texto, usuario_id, rol } = req.query;
    if (!texto || `${texto}`.trim() === '') {
      return res.status(400).json({ error: "Se requiere texto para buscar." });
    }

    const reqSql = pool.request()
      .input('texto', sql.NVarChar(200), `%${texto}%`);

    // filtro por usuario si no es admin
    const filtroUsuario = (rol !== 'admin')
      ? 'AND e.usuario_id = @usuario_id'
      : '';

    if (rol !== 'admin') {
      reqSql.input('usuario_id', sql.Int, parseInt(usuario_id, 10));
    }

    const sqlText = `
      SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

      SELECT TOP (10) e.*
      FROM expedientes e WITH (NOLOCK)
      WHERE e.estado <> 'eliminado'
        ${filtroUsuario}
        AND (
             -- carátula / número / año (rápidos)
             e.caratula LIKE @texto
          OR CAST(e.numero AS NVARCHAR(50)) LIKE @texto
          OR CAST(e.anio   AS NVARCHAR(50)) LIKE @texto

          -- actora (cliente)
          OR EXISTS (
               SELECT 1
               FROM clientes_expedientes ce WITH (NOLOCK)
               JOIN clientes c WITH (NOLOCK) ON c.id = ce.id_cliente
               WHERE ce.id_expediente = e.id
                 AND (
                      c.nombre LIKE @texto
                   OR c.apellido LIKE @texto
                   OR CONCAT(c.nombre,' ',c.apellido) LIKE @texto
                 )
          )

          -- demandada (empresa)
          OR EXISTS (
               SELECT 1
               FROM expedientes_demandados ed WITH (NOLOCK)
               JOIN demandados d WITH (NOLOCK) ON d.id = ed.id_demandado
               WHERE ed.id_expediente = e.id
                 AND d.nombre LIKE @texto
          )

          -- demandada (cliente)
          OR EXISTS (
               SELECT 1
               FROM expedientes_demandados ed WITH (NOLOCK)
               JOIN clientes c2 WITH (NOLOCK) ON c2.id = ed.id_cliente
               WHERE ed.id_expediente = e.id
                 AND (
                      c2.nombre LIKE @texto
                   OR c2.apellido LIKE @texto
                   OR CONCAT(c2.nombre,' ',c2.apellido) LIKE @texto
                 )
          )
        )
      ORDER BY e.id DESC
      OPTION (RECOMPILE);
    `;

    const result = await reqSql.query(sqlText);
    res.json(result.recordset);

  } catch (err) {
    console.error('Error al buscar expedientes:', err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


    /*  BUSCAR DEMANDADOS */
    app.get('/demandados/buscar', async (req, res) => {
      const texto = req.query.texto;  // Obtener el parámetro 'texto' de la URL
      
      try {
        const result = await pool.request()
          .input('texto', sql.NVarChar, `%${texto}%`)
          .query("SELECT * FROM demandados WHERE CAST(nombre AS NVARCHAR) LIKE @texto AND estado != 'eliminado'");
    
        res.json(result.recordset);  // Retornar los clientes encontrados
      } catch (err) {
        console.error('Error al ejecutar la consulta:', err);
        return res.status(500).send('Error al obtener demandados');
      }
    });

    /*  BUSCAR JUZGADOS */
    app.get('/juzgados/buscar', async (req, res) => {
      const texto = req.query.texto;
      
      try {
        const result = await pool.request()
          .input('texto', sql.NVarChar, `%${texto}%`)
          .query("SELECT * FROM juzgados WHERE CAST(nombre AS NVARCHAR) LIKE @texto AND estado != 'eliminado'");
    
        res.json(result.recordset); 
      } catch (err) {
        console.error('Error al ejecutar la consulta:', err);
        return res.status(500).send('Error al obtener juzgados');
      }
    });


/* agrega cliente-expediente */
app.post('/clientes-expedientes/agregar', async (req, res) => {
  try {
    const { cliente, expediente } = req.body;

    if (!cliente || !expediente) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        camposRequeridos: ['cliente', 'expediente']
      });
    }

    const nuevoId = await generarNuevoId(pool, 'clientes_expedientes', 'id');

    const result = await pool.request()
      //.input('id', sql.Int, nuevoId)
      .input('id_cliente', sql.Int, cliente)
      .input('id_expediente', sql.Int, expediente)
      .query(`
        INSERT INTO clientes_expedientes (id_cliente, id_expediente)
        VALUES (@id_cliente, @id_expediente)
      `);

    res.status(201).json({
      message: 'Relación cliente-expediente agregada exitosamente'
    });

  } catch (err) {
    console.error('Error al agregar relación cliente-expediente:', err.message);
    res.status(500).json({
      error: 'Error al agregar relación clientes-expedientes',
      message: err.message
    });
  }
});

/* agregar loclaidades */
app.post('/localidades/agregar', async (req, res) => {
  try {
    const { localidad, partido, provincia} = req.body;

    if (!localidad || !partido || !provincia) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        camposRequeridos: ['localidad', 'partido', 'provincia']
      });
    }
    const nuevoId = await generarNuevoId(pool, 'localidades', 'id');

    const result = await pool.request()
      .input('id', sql.Int, nuevoId)
      .input('localidad', sql.NVarChar, localidad)
      .input('partido', sql.NVarChar, partido)
      .input('provincia', sql.NVarChar, provincia)
      .input('estado', sql.NVarChar, 'activo')

      .query(`
        INSERT INTO localidades (id, localidad, partido, provincia, estado)
        OUTPUT INSERTED.id  
        VALUES (@id, @localidad, @partido, @provincia, @estado)
      `);

    // El id del cliente insertado estará en result.recordset[0].id
    res.status(201).json({
      message: 'Localidad agregada exitosamente',
      id: result.recordset[0].id
    });

  } catch (err) {
    console.error('Error al agregar localidad:', err.message);
    console.error('Error details:', err);
    res.status(500).json({
      error: 'Error al agregar localidad',
      message: err.message
    });
  }
});


app.get("/localidades", (req, res) => {
  pool.request()
      .query("SELECT * FROM localidades  WHERE estado = 'activo' ORDER BY localidad ")  
      .then(result => {
          res.json(result.recordset);  
      })
      .catch(err => {
          res.status(500).send(err);  
      });
});

app.post('/juzgados/agregar', async (req, res) => {
  try {
    const { localidad_id, direccion, nombre, tipo} = req.body;

    if (!localidad_id) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        camposRequeridos: ['localidad']
      });
    }
    const id = await generarNuevoId(pool, 'juzgados', 'id');

    const result = await pool.request()
    .input('id', sql.Int, id)
    .input('localidad_id', sql.Int, Number(localidad_id))
    .input('nombre', sql.NVarChar, nombre)
    .input('estado', sql.NVarChar, 'activo')
    .input('direccion', sql.NVarChar, direccion)
    .input('tipo', sql.NVarChar, tipo) // Se declara la variable @nombre


    .query(`
        INSERT INTO juzgados (id, nombre, estado, direccion, localidad_id, tipo)
        OUTPUT INSERTED.id  
        VALUES (@id, @nombre, @estado, @direccion, @localidad_id, @tipo)
      `);

    // El id del cliente insertado estará en result.recordset[0].id
    res.status(201).json({
      message: 'Juzgado agregado exitosamente',
      id: result.recordset[0].id
    });

  } catch (err) {
    console.error('Error al agregar juzgado:', err.message);
    console.error('Error details:', err);
    res.status(500).json({
      error: 'Error al agregar juzgado',
      message: err.message
    });
  }
});


app.get("/juzgados", (req, res) => {
  pool.request()
      .query("SELECT * FROM juzgados WHERE estado != 'eliminado'")  
      .then(result => {
          res.json(result.recordset);  
      })
      .catch(err => {
          res.status(500).send(err);  
      });
});

app.get("/partidos", (req, res) => {
  pool.request()
      .query("SELECT * FROM partido ORDER BY nombre")  
      .then(result => {
          res.json(result.recordset);  
      })
      .catch(err => {
          res.status(500).send(err);  
      });
});

app.get("/demandados", (req, res) => {
  pool.request()
      .query("SELECT * FROM demandados WHERE estado != 'eliminado'")  
      .then(result => {
          res.json(result.recordset);  
      })
      .catch(err => {
          res.status(500).send(err);  
      });
});

app.get("/demandados/oficiados", (req, res) => {
  pool.request()
    .query("SELECT * FROM demandados WHERE estado != 'eliminado' AND esOficio = 1")
    .then(result => {
      res.json(result.recordset);
    })
    .catch(err => {
      console.error("Error al obtener oficiados:", err);
      res.status(500).send({ error: "Error al obtener oficiados" });
    });
});


app.get("/expedientes/demandados/:id", async (req, res) => {
  try {
    const expedienteId = req.params.id;

    // Validar que el id sea un número
    if (isNaN(expedienteId)) {
      return res.status(400).json({ error: "El ID proporcionado no es válido" });
    }

    const result = await pool.request()
        .input("id", sql.Int, parseInt(expedienteId)) 
        .query("SELECT * FROM demandados WHERE id = @id");

    if (result.recordset.length === 0) {
        return res.status(404).json({ error: "Demandado no encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error al obtener demandado:", err);
    res.status(500).send(err);
  }
});

app.get("/demandados/:id", async (req, res) => {
  try {
    const expedienteId = req.params.id;

    // Validar que el id sea un número
    if (isNaN(expedienteId)) {
      return res.status(400).json({ error: "El ID proporcionado no es válido" });
    }

    const result = await pool.request()
        .input("id", sql.Int, parseInt(expedienteId)) 
        .query("SELECT * FROM demandados WHERE id = @id");

    if (result.recordset.length === 0) {
        return res.status(404).json({ error: "Demandado no encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error al obtener demandado:", err);
    res.status(500).send(err);
  }
});



app.post('/expedientes/agregarExpedienteClientes', async (req, res) => {
  try {
    console.error('Datos recibidos:', req.body);  

    const { cliente, expediente } = req.body; 

    if (!cliente || !expediente) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        camposRequeridos: ['cliente', 'expediente']
      });
    }

    // Lógica para agregar la relación entre cliente y expediente
    const result = await pool.request()
      .input('id_cliente', sql.Int, cliente)
      .input('id_expediente', sql.Int, expediente)
      .query(`
        INSERT INTO clientes_expedientes (id_cliente, id_expediente)
        VALUES (@id_cliente, @id_expediente)
      `);

    res.status(201).json({
      message: 'Relación cliente-expediente agregada exitosamente'
    });
  } catch (err) {
    console.error('Error al agregar relación cliente-expediente:', err.message);
    res.status(500).json({
      error: 'Error al agregar relación clientes-expedientes',
      message: err.message
    });
  }
});


app.put('/localidades/modificar/:id', async (req, res) => {
  const { id } = req.params;
  const nuevosDatos = req.body;

  try {
      const resultado = await pool.request()
          .input('id', sql.Int, id)
          .input('localidad', sql.NVarChar, nuevosDatos.localidad)
          .input('partido', sql.NVarChar, nuevosDatos.partido)
          .input('provincia', sql.NVarChar, nuevosDatos.provincia)
          .input('estado', sql.NVarChar, nuevosDatos.estado)
          .query(`
              UPDATE localidades
              SET localidad = @localidad,
                  partido = @partido,
                  provincia = @provincia,
                  estado = @estado
              WHERE id = @id
          `);

      if (resultado.rowsAffected[0] > 0) {
          res.status(200).json({ mensaje: 'Localidad actualizado correctamente' });
      } else {
          res.status(404).json({ mensaje: 'Localidad no encontrado' });
      }
  } catch (error) {
      console.error('Error al actualizar localidad:', error);
      res.status(500).json({ mensaje: 'Error al actualizar localidad' });
  }
});



app.put('/juzgados/modificar/:id', async (req, res) => {
  const { id } = req.params;
  const nuevosDatos = req.body;

  try {
      const resultado = await pool.request()
          .input('id', sql.Int, id)
          .input('localidad_id', sql.Int, nuevosDatos.localidad_id)
          .input('nombre', sql.NVarChar, nuevosDatos.nombre)
          .input('direccion', sql.NVarChar, nuevosDatos.direccion)
          .input('estado', sql.NVarChar, nuevosDatos.estado)
          .input('tipo', sql.NVarChar, nuevosDatos.tipo)

          .query(`
              UPDATE juzgados
              SET localidad_id = @localidad_id,
                  nombre = @nombre,
                  direccion = @direccion,
                  estado = @estado,
                  tipo = @tipo
              WHERE id = @id
          `);

      if (resultado.rowsAffected[0] > 0) {
          res.status(200).json({ mensaje: 'Juzgado actualizado correctamente' });
      } else {
          res.status(404).json({ mensaje: 'Juzgado no encontrado' });
      }
  } catch (error) {
      console.error('Error al actualizar juzagdo:', error);
      res.status(500).json({ mensaje: 'Error al actualizar juzgado' });
  }
});


app.put('/demandados/modificar/:id', async (req, res) => {
  const { id } = req.params;
  const nuevosDatos = req.body;

  try {
    const resultado = await pool.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar, nuevosDatos.nombre)
      .input('estado', sql.NVarChar, nuevosDatos.estado)
      .input('localidad_id', sql.Int, nuevosDatos.localidad_id)
      .input('direccion', sql.NVarChar, nuevosDatos.direccion)
      .input('esOficio', sql.Bit, nuevosDatos.esOficio ?? 0)
      .query(`
        UPDATE demandados
        SET nombre = @nombre,
            estado = @estado,
            localidad_id = @localidad_id,
            direccion = @direccion,
            esOficio = @esOficio
        WHERE id = @id
      `);

    if (resultado.rowsAffected[0] > 0) {
      res.status(200).json({ mensaje: 'Demandado actualizado correctamente' });
    } else {
      res.status(404).json({ mensaje: 'Demandado no encontrado' });
    }

  } catch (error) {
    console.error('Error al actualizar demandado:', error);
    res.status(500).json({ mensaje: 'Error al actualizar demandado' });
  }
});


app.post('/demandados/agregar', async (req, res) => {
  try {
    const { nombre, estado, localidad_id, direccion, esOficio } = req.body;

    if (!nombre) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        camposRequeridos: ['nombre']
      });
    }
    const id = await generarNuevoId(pool, 'demandados', 'id');

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar, nombre)
      .input('estado', sql.NVarChar, estado || 'en gestión')
      .input('localidad_id', sql.Int, localidad_id || null)
      .input('direccion', sql.NVarChar, direccion || null)
      .input('esOficio', sql.Bit, esOficio ?? 0)
      .query(`
        INSERT INTO demandados (id, nombre, estado, localidad_id, direccion, esOficio)
        OUTPUT INSERTED.id  
        VALUES (@id, @nombre, @estado, @localidad_id, @direccion, @esOficio)
      `);

    res.status(201).json({
      message: 'Demandado agregado exitosamente',
      id: result.recordset[0].id
    });

  } catch (err) {
    console.error('Error al agregar demandado:', err.message);
    console.error('Error details:', err);
    res.status(500).json({
      error: 'Error al agregar demandado',
      message: err.message
    });
  }
});


////////////////


// funciona
app.get("/expedientes/demandados", async (req, res) => {
  const { id, estado } = req.query;

  try {
    const result = await pool.request()
      .input("demandadoId", id)
      .query("SELECT * FROM expedientes WHERE demandado_id = @demandadoId");

    // Filtrar los expedientes que están en estado 'en gestión' o 'eliminado' si es necesario
    const expedientesFiltrados = result.recordset.filter(expediente => expediente.estado !== 'eliminado');

    // Si no hay expedientes en estado 'en gestión' y hay otros, puedes manejarlos
    if (expedientesFiltrados.length === 0) {
      return res.json([]);  // Si no hay expedientes en gestión, enviar un array vacío
    }

    res.json(expedientesFiltrados);  // Devolver los expedientes filtrados
  } catch (err) {
    console.error("Error al obtener expedientes:", err);
    res.status(500).send("Error al obtener los expedientes.");
  }
});


////////////////

app.get("/expedientes/juzgados", async (req, res) => {
  const { id } = req.query;

  try {
    const result = await pool.request()
      .input("juzgadoId", sql.Int, id) // 🔹 Asegurar que se pasa como Int
      .query("SELECT * FROM expedientes WHERE juzgado_id = @juzgadoId");

    // Filtrar expedientes en gestión
    const expedientesEnGestion = result.recordset.filter(exp => exp.estado !== 'eliminado');

    res.json(expedientesEnGestion);  // Devolver solo los expedientes en gestión
  } catch (err) {
    console.error("Error al obtener expedientes:", err);
    res.status(500).send("Error al obtener los expedientes.");
  }
});


app.get("/juzgados/localidades", async (req, res) => {
  const { id, estado } = req.query;

  try {
    const result = await pool.request()
      .input("localidadId", id)
      .query("SELECT * FROM juzgados WHERE localidad_id = @localidadId");

    // Filtrar los expedientes que están en estado 'en gestión' o 'eliminado' si es necesario
    const juzgadosFiltrados = result.recordset.filter(juzgado => juzgado.estado !== 'eliminado');

    // Si no hay expedientes en estado 'en gestión' y hay otros, puedes manejarlos
    if (juzgadosFiltrados.length === 0) {
      return res.json([]);  // Si no hay expedientes en gestión, enviar un array vacío
    }

    res.json(juzgadosFiltrados);  // Devolver los expedientes filtrados
  } catch (err) {
    console.error("Error al obtener juzgados:", err);
    res.status(500).send("Error al obtener los juzgados.");
  }
});

app.get("/expedientes/clientes", async (req, res) => {
  const { id, estado } = req.query;

  try {
    const result = await pool.request()
      .input("id_cliente", id)
      .query("SELECT * FROM clientes_expedientes WHERE id_cliente = @id_cliente");

    // Filtrar los expedientes que están en estado 'en gestión' o 'eliminado' si es necesario
    const clientesFiltrados = result.recordset.filter(clientes => clientes.estado !== 'eliminado');

    // Si no hay expedientes en estado 'en gestión' y hay otros, puedes manejarlos
    if (clientesFiltrados.length === 0) {
      return res.json([]);  // Si no hay expedientes en gestión, enviar un array vacío
    }

    res.json(clientesFiltrados);  // Devolver los expedientes filtrados
  } catch (err) {
    console.error("Error al obtener clientes:", err);
    res.status(500).send("Error al obtener los clientes.");
  }
});

app.get("/expedientes/jueces", async (req, res) => {
  const { id } = req.query;

  try {
    const result = await pool.request()
      .input("juez_id", sql.Int, id) // 🔹 Asegurar que se pasa como Int
      .query("SELECT * FROM expedientes WHERE juez_id = @juez_id");

    // Filtrar expedientes en gestión
    const expedientesEnGestion = result.recordset.filter(exp => exp.estado != 'eliminado');

    res.json(expedientesEnGestion);  // Devolver solo los expedientes en gestión
  } catch (err) {
    console.error("Error al obtener expedientes:", err);
    res.status(500).send("Error al obtener los expedientes.");
  }
});

//BUSCAR Y TRAER TODOS LOS JUECES
app.get("/juez", async (req, res) => {
  try {
      const result = await pool.request().query("SELECT * FROM juez WHERE estado != 'eliminado'");
      res.json(result.recordset);
  } catch (err) {
      console.error("Error al obtener expedientes:", err);
      res.status(500).send(err);
  }
});

   
// BUSCAR EXPEDIENTES POR NUMERO, AÑO Y TIPO DE JUZGADO (JOIN)/*
app.get("/expedientes/buscarPorNumeroAnioTipo", async (req, res) => {
  try {
    const { numero, anio, tipo, usuario_id, rol } = req.query;

    console.log('Busqueda realizada: ', 'numero: ', numero, 'anio: ', anio, 'tipo: ', tipo);
    if (!numero || !anio || !tipo) {
      return res.status(400).json({ error: "Se requieren 'numero', 'anio' y 'tipo'." });
    }

    const request = pool.request()
      .input("numero", sql.Int, parseInt(numero))
      .input("anio", sql.Int, parseInt(anio))
      .input("tipo", sql.NVarChar, tipo);

    let query = `
      SELECT e.*
      FROM expedientes e
      JOIN juzgados j ON e.juzgado_id = j.id
      WHERE e.estado != 'eliminado'
        AND e.numero = @numero
        AND e.anio = @anio
        AND j.tipo = @tipo
    `;

    if (rol !== 'admin') {
      query += " AND e.usuario_id = @usuario_id";
      request.input('usuario_id', sql.Int, parseInt(usuario_id));
    }

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error("Error al obtener expedientes:", err.message);
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



//TRAE EXPEDIENTES FILTRADOS POR UN ESTADO
/*
app.get("/expedientes/estado", async (req, res) => {
  try {
      const { estado } = req.query; 

      if (!estado ) {
          return res.status(400).json({ error: "Se requiere estado." });
      }

      const result = await pool
          .request()
          .input("estado", sql.NVarChar, estado)

          .query("SELECT * FROM expedientes WHERE estado = @estado");

      res.json(result.recordset);
  } catch (err) {
      console.error("Error al obtener expedientes:", err);
      res.status(500).send(err);
  }
});*/

app.get("/expedientes/estado", async (req, res) => {
  try {
    const estado = (req.query.estado ?? '').toString().trim();
    if (!estado) {
      return res.status(400).json({ error: "Se requiere estado." });
    }

    const result = await pool
      .request()
      .input("estado", sql.NVarChar(100), estado)
      .query(`
        SELECT *
        FROM expedientes
        WHERE estado = @estado
      `);

    return res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener expedientes por estado:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

/* OBTENER JUZGADO POR ID */
app.get('/expedientes/juzgados/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "El ID del juzgado debe ser un número válido." });
  }
  
  try {
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query("SELECT * FROM juzgados WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Juzgado no encontrado' });
    }

    res.json(result.recordset[0]); // Retornamos el primer resultado, que es el juzgado
  } catch (err) {
    console.error('Error al obtener juzgado:', err);
    return res.status(500).send('Error al obtener juzgado');
  }
});

app.get('/juzgados/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "El ID del juzgado debe ser un número válido." });
  }
  
  try {
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query("SELECT * FROM juzgados WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Juzgado no encontrado' });
    }

    res.json(result.recordset[0]); // Retornamos el primer resultado, que es el juzgado
  } catch (err) {
    console.error('Error al obtener juzgado:', err);
    return res.status(500).send('Error al obtener juzgado');
  }
});

//TRAE LOS EVENTOS
app.get("/eventos", async (req, res) => {
  try {
    const eventosResult = await pool.request().query("SELECT * FROM eventos_calendario WHERE estado != 'eliminado'");
    const eventos = eventosResult.recordset;

    const eventosConClientes = await Promise.all(
      eventos.map(async evento => {
        const clientesResult = await pool.request()
          .input("evento_id", sql.Int, evento.id)
          .query(`
            SELECT c.*
            FROM clientes c
            JOIN clientes_eventos ce ON ce.id_cliente = c.id
            WHERE ce.id_evento = @evento_id
          `);
        
        return {
          ...evento,
          clientes: clientesResult.recordset
        };
      })
    );

    res.json(eventosConClientes);
  } catch (err) {
    console.error('Error al obtener eventos:', err);
    res.status(500).send('Error al obtener eventos');
  }
});



//AGREGA UN EVENTO A LA DB
app.post('/eventos/agregar', async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      fecha_evento,
      hora_evento,
      tipo_evento,
      ubicacion,
      mediacion_id,
      clientes = [],
      expediente_id,
      link_virtual,
    } = req.body;

    // Validación de campos obligatorios
    if (!fecha_evento || !tipo_evento) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        camposRequeridos: ['fecha_evento', 'tipo_evento']
      });
    }
    const id = await generarNuevoId(pool, 'eventos_calendario', 'id');
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('titulo', sql.NVarChar, titulo)
      .input('descripcion', sql.NVarChar, descripcion || null)
      .input('fecha_evento', sql.DateTime2, new Date(fecha_evento))
      .input('hora_evento', sql.Time, hora_evento || null)
      .input('tipo_evento', sql.NVarChar, tipo_evento)
      .input('ubicacion', sql.NVarChar, ubicacion || null)
      .input('mediacion_id', sql.Int, mediacion_id || null)
      .input('expediente_id', sql.Int, expediente_id || null)
      .input('link_virtual', sql.NVarChar, link_virtual || null)
      .input('estado', sql.NVarChar, 'En curso')


      .query(`
        INSERT INTO eventos_calendario (
          id,
          titulo,
          descripcion,
          fecha_evento,
          hora_evento,
          tipo_evento,
          ubicacion,
          mediacion_id,
          expediente_id,
          link_virtual,
          estado
        )
        OUTPUT INSERTED.id
        VALUES (
          @id,
          @titulo,
          @descripcion,
          @fecha_evento,
          @hora_evento,
          @tipo_evento,
          @ubicacion,
          @mediacion_id,
          @expediente_id,
          @link_virtual, 
          @estado
        )
      `);

    res.status(201).json({
      message: 'Evento agregado exitosamente',
      id: result.recordset[0].id
    });

    const eventoId = result.recordset[0].id;

// Insertar clientes relacionados
for (const cliente of clientes) {
  const id = await generarNuevoId(pool, 'clientes_eventos', 'id');

  await pool.request()
    .input('id', sql.Int, id)
    .input('id_evento', sql.Int, eventoId)
    .input('id_cliente', sql.Int, cliente.id)
    .query(`
      INSERT INTO clientes_eventos (id, id_evento, id_cliente)
      VALUES (@id, @id_evento, @id_cliente)
    `);
}


  } catch (err) {
    console.error('Error al agregar evento:', err.message);
    res.status(500).json({
      error: 'Error al agregar evento',
      message: err.message
    });
  }
});


//AGREGA UN JUEZ A LA DB
app.post('/juez/agregar', async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      estado,
    } = req.body;

    // Validación de campos obligatorios
    if (!nombre || !apellido || !estado) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        camposRequeridos: ['nombre', 'apellido', 'estado']
      });
    }
  const nuevoId = await generarNuevoId(pool, 'mediaciones', 'id');

  const result = await pool.request()
  .input('id', sql.Int, nuevoId)
  .input('nombre', sql.NVarChar, nombre)
  .input('apellido', sql.NVarChar, apellido)
  .input('estado', sql.NVarChar, estado)
  .query(`
    INSERT INTO juez (
      id,
      nombre,
      apellido,
      estado
    )
    OUTPUT INSERTED.id
    VALUES (
      @id,
      @nombre,
      @apellido,
      @estado
    )
  `);


    res.status(201).json({
      message: 'Juez agregado exitosamente',
      id: result.recordset[0].id
    });

  } catch (err) {
    console.error('Error al agregar juez:', err.message);
    res.status(500).json({
      error: 'Error al agregar juez',
      message: err.message
    });
  }
});

//MODIFICA UN JUEZ
app.put('/juez/modificar/:id', async (req, res) => {
  const { id } = req.params;
  const nuevosDatos = req.body;

  try {
      const resultado = await pool.request()
          .input('id', sql.Int, id)
          .input('nombre', sql.NVarChar, nuevosDatos.nombre)
          .input('apellido', sql.NVarChar, nuevosDatos.apellido)
          .input('estado', sql.NVarChar, nuevosDatos.estado)
          .query(`
              UPDATE juez
              SET nombre = @nombre,
                 apellido = @apellido,
                  estado = @estado
              WHERE id = @id
          `);

      if (resultado.rowsAffected[0] > 0) {
          res.status(200).json({ mensaje: 'Juez actualizado correctamente' });
      } else {
          res.status(404).json({ mensaje: 'Juez no encontrado' });
      }
  } catch (error) {
      console.error('Error al actualizar juez:', error);
      res.status(500).json({ mensaje: 'Error al actualizar juez' });
  }
});

app.get("/juzgados/BuscarPorTipo", async (req, res) => {
  const { tipo } = req.query;

  if (!tipo) {
    return res.status(400).json({ error: "Falta el parámetro 'tipo'" });
  }

  try {
    const result = await pool
      .request()
      .input("tipo", sql.VarChar, tipo)
      .query("SELECT * FROM juzgados WHERE estado != 'eliminado' AND tipo = @tipo");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener juzgados:", err);
    res.status(500).send("Error al obtener juzgados");
  }
});


/*
app.get("/clientes/expedientesPorCliente", async (req, res) => {
  const { id } = req.query;
    console.log('id:', id, 'tipo:', typeof id);

  if (!Number.isInteger(id)) return res.status(400).json({ error: "id inválido" });

  try {
    const result = await pool.request()
      .input("id_cliente", sql.Int, id)
      .query(`
        SELECT 
          e.id, e.numero, e.anio, e.estado, e.fecha_creacion, e.monto,
          e.juzgado_id
        FROM clientes_expedientes ce
        JOIN expedientes e ON ce.id_expediente = e.id
        WHERE ce.id_cliente = @id_cliente AND e.estado != 'eliminado'
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener expedientes del cliente:", err);
    res.status(500).send("Error al obtener los expedientes.");
  }
});*/

app.get("/clientes/expedientesPorCliente", async (req, res) => {
  const raw = req.query.id;

  const id = Number(String(raw ?? "").trim());
  console.log("raw:", raw, "typeof:", typeof raw, "id:", id);

  if (!Number.isFinite(id) || !Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido", raw });
  }

  try {
    const result = await pool.request()
      .input("id_cliente", sql.Int, id)
      .query(`
        SELECT e.id, e.numero, e.anio, e.estado, e.fecha_creacion, e.monto, e.juzgado_id
        FROM clientes_expedientes ce
        JOIN expedientes e ON ce.id_expediente = e.id
        WHERE ce.id_cliente = @id_cliente AND e.estado != 'eliminado'
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener expedientes del cliente:", err);
    res.status(500).send("Error al obtener los expedientes.");
  }
});




app.get("/expedientes/cobrados", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT *
      FROM expedientes
      WHERE estado != 'eliminado'
        AND (
          estado = 'Archivo'
          OR capitalCobrado = 1
          OR esPagoParcial = 1
          OR honorarioCobrado = 1
          OR honorarioAlzadaCobrado = 1
          OR honorarioEjecucionCobrado = 1
          OR honorarioDiferenciaCobrado = 1
        )
    `);

    return res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener expedientes cobrados:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get('/expedientes/vencimiento', async (req, res) => {
  const { juicio } = req.query;

  if (!juicio || (juicio !== 'ordinario' && juicio !== 'sumarismo')) {
    return res.status(400).send("Parámetro 'juicio' inválido. Debe ser 'ordinario' o 'sumarismo'.");
  }

  const diasLimite = juicio === 'ordinario' ? 160 : 70;

  try {
    const result = await pool.request().input('juicio', juicio).query(`
      SELECT *
      FROM expedientes
      WHERE juicio = @juicio
        AND DATEDIFF(DAY, ultimo_movimiento, GETDATE()) <= ${diasLimite}
        AND estado != 'eliminado'
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener expedientes por vencimiento:", err);
    res.status(500).send("Error al obtener expedientes por vencimiento.");
  }
});
app.post('/mediaciones', async (req, res) => {
  try {
    const {
      numero,
      abogado_id,
      cliente_id,
      demandado_id,
      fecha,
      mediadora,
      finalizada
    } = req.body;

    const nuevoId = await generarNuevoId(pool, 'mediaciones', 'id');
    const result = await pool.request()
      //.input('id', sql.NVarChar, nuevoId)
      .input('numero', sql.NVarChar, numero)
      .input('abogado_id', sql.Int, abogado_id)
      .input('cliente_id', sql.Int, cliente_id)
      .input('demandado_id', sql.Int, demandado_id)
      .input('fecha', sql.Date, null)
      .input('mediadora', sql.NVarChar, mediadora || null)
      .input('finalizada', sql.Bit, finalizada)
      .query(`
        INSERT INTO mediaciones (
          numero, abogado_id, cliente_id, demandado_id, fecha, mediadora, finalizada
        )
        OUTPUT INSERTED.id
        VALUES (
          @numero, @abogado_id, @cliente_id, @demandado_id, @fecha, @mediadora, @finalizada
        )
      `);

    res.status(201).json({ id: result.recordset[0].id });
  } catch (error) {
    console.error('Error al crear mediación:', error.message);
    res.status(500).json({ error: 'Error al crear mediación', detalle: error.message });
  }
});

app.get('/mediaciones/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT * FROM mediaciones WHERE id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Mediación no encontrada' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al obtener mediación por ID:', error.message);
    res.status(500).json({ error: 'Error interno al buscar la mediación' });
  }
});
app.put("/eventos/editar/:id", async (req, res) => {
  console.log('[INCOMING] %s %s\nparams:%o\nquery:%o\nbody:%o',
    req.method, req.originalUrl, req.params, req.query, req.body);

  const id = Number(req.params.id);
  const e  = req.body;

  // escapá comillas simples en strings para no romper el SQL
  const esc = (s) => (s == null ? null : String(s).replace(/'/g, "''"));

  try {
    await pool.request().query(`
      UPDATE eventos_calendario SET 
        titulo        = ${e.titulo != null ? `'${esc(e.titulo)}'` : 'NULL'},
        descripcion   = ${e.descripcion != null ? `'${esc(e.descripcion)}'` : 'NULL'},
        fecha_evento  = ${e.fecha_evento != null ? `'${e.fecha_evento}'` : 'NULL'},
        tipo_evento   = ${e.tipo_evento != null ? `'${esc(e.tipo_evento)}'` : 'NULL'},
        ubicacion     = ${e.ubicacion != null ? `'${esc(e.ubicacion)}'` : 'NULL'},
        estado        = ${e.estado != null ? `'${esc(e.estado)}'` : 'NULL'},
        mediacion_id  = ${e.mediacion_id ?? 'NULL'},
        link_virtual  = ${e.link_virtual != null ? `'${esc(e.link_virtual)}'` : 'NULL'},
        expediente_id = ${e.expediente_id ?? 'NULL'}
      WHERE id = ${id}
    `);

    await pool.request().query(`DELETE FROM clientes_eventos WHERE id_evento = ${id}`);

    for (const c of (e.clientes || [])) {
      await pool.request().query(`
        INSERT INTO clientes_eventos (id_evento, id_cliente)
        VALUES (${id}, ${Number(c.id)})
      `);
    }

    res.send({ message: 'Evento actualizado con éxito' });
  } catch (err) {
    console.error('Error actualizando evento:', err);
    res.status(500).send(err);
  }
});






app.put('/eventos/eliminar/:id', async (req, res) => {
  const id = req.params.id;

  try {
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE eventos_calendario
        SET estado = 'eliminado'
        WHERE id = @id
      `);

    res.status(200).json({ message: 'Evento marcado como eliminado' });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ error: 'Error al eliminar evento', message: error.message });
  }
});



app.post('/oficios/agregar', async (req, res) => {
  try {
    const {
      expediente_id,
      demandado_id,
      parte,
      estado,
      fecha_diligenciado,
      tipo,
      nombre_oficiada,
      tipo_pericia,
      supletoria // ← ahora es fecha (YYYY-MM-DD) o null
    } = req.body;

    if (!expediente_id || !parte || !estado || !tipo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios', camposRequeridos: ['expediente_id','parte','estado','tipo'] });
    }

    const tipoNorm = String(tipo).toLowerCase().trim();
    if (!['oficio','testimonial','pericia'].includes(tipoNorm)) {
      return res.status(400).json({ error: 'Tipo inválido. Use: oficio | testimonial | pericia' });
    }

    if (tipoNorm === 'oficio') {
      if (!demandado_id) return res.status(400).json({ error: 'Para tipo "oficio", demandado_id es obligatorio' });
    } else if (tipoNorm === 'testimonial') {
      if (!nombre_oficiada || String(nombre_oficiada).trim() === '') {
        return res.status(400).json({ error: 'Para tipo "testimonial", nombre_oficiada (testigo) es obligatorio' });
      }
      // supletoria es fecha opcional
    } else if (tipoNorm === 'pericia') {
      if (!nombre_oficiada || String(nombre_oficiada).trim() === '') {
        return res.status(400).json({ error: 'Para tipo "pericia", nombre_oficiada (perito) es obligatorio' });
      }
      const tp = String(tipo_pericia || '').toLowerCase().trim();
      if (!['pericial informática','pericial informatica'].includes(tp)) {
        return res.status(400).json({ error: 'tipo_pericia inválido. Solo "Pericial informática".' });
      }
    }
    const nuevoId = await generarNuevoId(pool, 'oficios', 'id');

    const r = await pool.request()
      .input('id', sql.Int, nuevoId)
      .input('expediente_id', sql.Int, expediente_id)
      .input('demandado_id', sql.Int, demandado_id ?? null)
      .input('parte', sql.NVarChar(100), parte)
      .input('estado', sql.NVarChar(50), estado)
      .input('fecha_diligenciado', sql.Date, fecha_diligenciado || null)
      .input('tipo', sql.NVarChar(200), tipoNorm)
      .input('nombre_oficiada', sql.NVarChar(200), nombre_oficiada || null)
      .input('tipo_pericia', sql.NVarChar(100), tipoNorm === 'pericia' ? (tipo_pericia || null) : null)
      .input('supletoria', sql.Date, tipoNorm === 'testimonial' ? (supletoria || null) : null) // ← DATE
      .query(`
        INSERT INTO oficios (
          id, expediente_id, demandado_id, parte, estado, fecha_diligenciado,
          tipo, nombre_oficiada, tipo_pericia, supletoria
        )
        VALUES (
          @id, @expediente_id, @demandado_id, @parte, @estado, @fecha_diligenciado,
          @tipo, @nombre_oficiada, @tipo_pericia, @supletoria
        );
        SELECT SCOPE_IDENTITY() AS id;
      `);

    return res.status(201).json({ ok: true, id: r.recordset?.[0]?.id });
  } catch (err) {
    console.error('Error al agregar prueba:', err);
    return res.status(500).json({ error: 'Error al agregar prueba', message: err.message });
  }
});




app.get('/oficios', async (req, res) => {
  try {
    const result = await pool.request()
      .query("SELECT * FROM oficios WHERE estado != 'eliminado'");

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error al obtener oficios:', err.message);
    res.status(500).json({ error: 'Error al obtener oficios' });
  }
});

app.put('/oficios/modificar/:id', async (req, res) => {
  const { id } = req.params;
  const { expediente_id, demandado_id, parte, estado, fecha_diligenciado } = req.body;

  //console.log('Oficio: ', req.body)
  try {
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('expediente_id', sql.Int, expediente_id)
      .input('demandado_id', sql.Int, demandado_id)
      .input('parte', sql.NVarChar, parte)
      .input('estado', sql.NVarChar, estado)
      .input('fecha_diligenciado', sql.Date, fecha_diligenciado || null)
      .query(`
        UPDATE oficios
        SET expediente_id = @expediente_id,
            demandado_id = @demandado_id,
            parte = @parte,
            estado = @estado,
            fecha_diligenciado = @fecha_diligenciado
        WHERE id = @id
      `);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ mensaje: 'Oficio actualizado correctamente' });
    } else {
      res.status(404).json({ mensaje: 'Oficio no encontrado' });
    }

  } catch (error) {
    console.error('Error al actualizar oficio:', error);
    res.status(500).json({ mensaje: 'Error al actualizar oficio' });
  }
});

// Tu endpoint ya armado para obtener cobros por mes
/*app.get("/expedientes/total-cobranzas-por-mes", async (req, res) => {
  const { anio, mes } = req.query;

  try {
    const result = await pool.request()
      .input("anio", sql.Int, parseInt(anio))
      .input("mes", sql.Int, parseInt(mes))
      .query(`
        SELECT 
          -- Capital (sin descuento)
          SUM(CASE WHEN MONTH(e.fecha_cobro_capital) = @mes AND YEAR(e.fecha_cobro_capital) = @anio
                   THEN ISNULL(e.capitalPagoParcial, e.montoLiquidacionCapital) ELSE 0 END) AS totalCapital,

          -- Honorarios
          SUM(CASE WHEN MONTH(e.fecha_cobro) = @mes AND YEAR(e.fecha_cobro) = @anio
                   THEN ROUND(ISNULL(e.montoLiquidacionHonorarios, 0) * (100 - ISNULL(u.porcentajeHonorarios, 0)) / 100, 2)
                   ELSE 0 END) AS totalHonorarios,

          -- Alzada
          SUM(CASE WHEN MONTH(e.fechaCobroAlzada) = @mes AND YEAR(e.fechaCobroAlzada) = @anio
                   THEN ROUND(ISNULL(e.montoAcuerdo_alzada, 0) * (100 - ISNULL(u.porcentajeHonorarios, 0)) / 100, 2)
                   ELSE 0 END) AS totalAlzada,

          -- Ejecución
          SUM(CASE WHEN MONTH(e.fechaCobroEjecucion) = @mes AND YEAR(e.fechaCobroEjecucion) = @anio
                   THEN ROUND(ISNULL(e.montoHonorariosEjecucion, 0) * (100 - ISNULL(u.porcentajeHonorarios, 0)) / 100, 2)
                   ELSE 0 END) AS totalEjecucion,

          -- Diferencia
          SUM(CASE WHEN MONTH(e.fechaCobroDiferencia) = @mes AND YEAR(e.fechaCobroDiferencia) = @anio
                   THEN ROUND(ISNULL(e.montoHonorariosDiferencia, 0) * (100 - ISNULL(u.porcentajeHonorarios, 0)) / 100, 2)
                   ELSE 0 END) AS totalDiferencia,

          -- Total general
          SUM(
            CASE WHEN MONTH(e.fecha_cobro_capital) = @mes AND YEAR(e.fecha_cobro_capital) = @anio
                 THEN ISNULL(e.capitalPagoParcial, e.montoLiquidacionCapital) ELSE 0 END
            +
            CASE WHEN MONTH(e.fecha_cobro) = @mes AND YEAR(e.fecha_cobro) = @anio
                 THEN ROUND(ISNULL(e.montoLiquidacionHonorarios, 0) * (100 - ISNULL(u.porcentajeHonorarios, 0)) / 100, 2) ELSE 0 END
            +
            CASE WHEN MONTH(e.fechaCobroAlzada) = @mes AND YEAR(e.fechaCobroAlzada) = @anio
                 THEN ROUND(ISNULL(e.montoAcuerdo_alzada, 0) * (100 - ISNULL(u.porcentajeHonorarios, 0)) / 100, 2) ELSE 0 END
            +
            CASE WHEN MONTH(e.fechaCobroEjecucion) = @mes AND YEAR(e.fechaCobroEjecucion) = @anio
                 THEN ROUND(ISNULL(e.montoHonorariosEjecucion, 0) * (100 - ISNULL(u.porcentajeHonorarios, 0)) / 100, 2) ELSE 0 END
            +
            CASE WHEN MONTH(e.fechaCobroDiferencia) = @mes AND YEAR(e.fechaCobroDiferencia) = @anio
                 THEN ROUND(ISNULL(e.montoHonorariosDiferencia, 0) * (100 - ISNULL(u.porcentajeHonorarios, 0)) / 100, 2) ELSE 0 END
          ) AS totalGeneral
        FROM expedientes e
        LEFT JOIN usuario u ON e.usuario_id = u.id
        WHERE e.estado IN ('sentencia', 'cobrado');
      `);

    res.json(result.recordset[0]);

  } catch (error) {
    console.error("Error al obtener total de cobranzas por mes:", error);
    res.status(500).send("Error en el servidor");
  }
});*/
// ==========================================================
//  COBRANZAS - TOTALES POR MES (FINAL)
//  GET /expedientes/total-cobranzas-por-mes?anio=YYYY&mes=MM
// ==========================================================
/*app.get("/expedientes/total-cobranzas-por-mes", async (req, res) => {
  const { anio, mes } = req.query;
  if (!anio || !mes) return res.status(400).send("Debe enviar 'anio' y 'mes'");

  const y = parseInt(anio, 10);
  const m = parseInt(mes, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12)
    return res.status(400).send("Parámetros inválidos. 'mes' debe ser 1..12.");

  const inicio = new Date(Date.UTC(y, m - 1, 1));
  const fin    = new Date(Date.UTC(y, m, 1));

  try {
    const result = await pool.request()
      .input("inicio", sql.Date, new Date(inicio.toISOString().slice(0,10)))
      .input("fin",    sql.Date, new Date(fin.toISOString().slice(0,10)))
      .query(`
        WITH movimientos AS (
          -- CAPITAL: usa capitalPagoParcial (ya saneado con %)
          SELECT 'capital' AS concepto, ISNULL(e.capitalPagoParcial, 0) AS monto
          FROM expedientes e
          WHERE CAST(e.fecha_cobro_capital AS DATE) >= @inicio
            AND CAST(e.fecha_cobro_capital AS DATE) < @fin

          UNION ALL
          -- HONORARIOS: aplica % del abogado
          SELECT 'honorarios',
                 ISNULL(e.montoLiquidacionHonorarios, 0) * (100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0
          FROM expedientes e
          LEFT JOIN usuario u ON u.id = e.usuario_id
          WHERE CAST(e.fecha_cobro AS DATE) >= @inicio
            AND CAST(e.fecha_cobro AS DATE) < @fin

          UNION ALL
          -- ALZADA (sin %)
          SELECT 'alzada', ISNULL(e.montoAcuerdo_alzada, 0)
          FROM expedientes e
          WHERE CAST(e.fechaCobroAlzada AS DATE) >= @inicio
            AND CAST(e.fechaCobroAlzada AS DATE) < @fin

          UNION ALL
          -- EJECUCIÓN (sin %)
          SELECT 'ejecucion', ISNULL(e.montoHonorariosEjecucion, 0)
          FROM expedientes e
          WHERE CAST(e.fechaCobroEjecucion AS DATE) >= @inicio
            AND CAST(e.fechaCobroEjecucion AS DATE) < @fin

          UNION ALL
          -- DIFERENCIA (sin %)
          SELECT 'diferencia', ISNULL(e.montoHonorariosDiferencia, 0)
          FROM expedientes e
          WHERE CAST(e.fechaCobroDiferencia AS DATE) >= @inicio
            AND CAST(e.fechaCobroDiferencia AS DATE) < @fin
        )
        SELECT
          SUM(CASE WHEN concepto='capital'    THEN monto ELSE 0 END) AS totalCapital,
          SUM(CASE WHEN concepto='honorarios' THEN monto ELSE 0 END) AS totalHonorarios,
          SUM(CASE WHEN concepto='alzada'     THEN monto ELSE 0 END) AS totalAlzada,
          SUM(CASE WHEN concepto='ejecucion'  THEN monto ELSE 0 END) AS totalEjecucion,
          SUM(CASE WHEN concepto='diferencia' THEN monto ELSE 0 END) AS totalDiferencia,
          SUM(monto) AS totalGeneral
        FROM movimientos;
      `);

    res.json(result.recordset[0] ?? {
      totalCapital: 0, totalHonorarios: 0, totalAlzada: 0,
      totalEjecucion: 0, totalDiferencia: 0, totalGeneral: 0
    });
  } catch (error) {
    console.error("Error al obtener total de cobranzas por mes:", error);
    res.status(500).send("Error en el servidor");
  }
});*/

// ==========================================================
// GET /expedientes/total-cobranzas-por-mes?anio=YYYY&mes=MM
// ==========================================================
/*app.get("/expedientes/total-cobranzas-por-mes", async (req, res) => {
  const { anio, mes } = req.query;
  if (!anio || !mes) return res.status(400).send("Debe enviar 'anio' y 'mes'");

  const y = parseInt(anio, 10);
  const m = parseInt(mes, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12)
    return res.status(400).send("Parámetros inválidos. 'mes' debe ser 1..12.");

  const inicio = new Date(Date.UTC(y, m - 1, 1));
  const fin    = new Date(Date.UTC(y, m, 1));

  try {
    const result = await pool.request()
      .input("inicio", sql.Date, new Date(inicio.toISOString().slice(0,10)))
      .input("fin",    sql.Date, new Date(fin.toISOString().slice(0,10)))
      .query(`
        WITH movimientos AS (
          SELECT 'capital' AS concepto, ISNULL(e.capitalPagoParcial, 0) AS monto
          FROM expedientes e
          WHERE e.estado != 'eliminado'
            AND CAST(e.fecha_cobro_capital AS DATE) >= @inicio
            AND CAST(e.fecha_cobro_capital AS DATE) < @fin

          UNION ALL
          SELECT 'honorarios',
                 ISNULL(e.montoLiquidacionHonorarios, 0) *
                 (100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0
          FROM expedientes e
          LEFT JOIN usuario u ON u.id = e.usuario_id
          WHERE e.estado != 'eliminado'
            AND CAST(e.fecha_cobro AS DATE) >= @inicio
            AND CAST(e.fecha_cobro AS DATE) < @fin

          UNION ALL
          SELECT 'alzada', ISNULL(e.montoAcuerdo_alzada, 0)
          FROM expedientes e
          WHERE e.estado != 'eliminado'
            AND CAST(e.fechaCobroAlzada AS DATE) >= @inicio
            AND CAST(e.fechaCobroAlzada AS DATE) < @fin

          UNION ALL
          SELECT 'ejecucion', ISNULL(e.montoHonorariosEjecucion, 0)
          FROM expedientes e
          WHERE e.estado != 'eliminado'
            AND CAST(e.fechaCobroEjecucion AS DATE) >= @inicio
            AND CAST(e.fechaCobroEjecucion AS DATE) < @fin

          UNION ALL
          SELECT 'diferencia', ISNULL(e.montoHonorariosDiferencia, 0)
          FROM expedientes e
          WHERE e.estado != 'eliminado'
            AND CAST(e.fechaCobroDiferencia AS DATE) >= @inicio
            AND CAST(e.fechaCobroDiferencia AS DATE) < @fin
        )
        SELECT
          SUM(CASE WHEN concepto='capital'    THEN monto ELSE 0 END) AS totalCapital,
          SUM(CASE WHEN concepto='honorarios' THEN monto ELSE 0 END) AS totalHonorarios,
          SUM(CASE WHEN concepto='alzada'     THEN monto ELSE 0 END) AS totalAlzada,
          SUM(CASE WHEN concepto='ejecucion'  THEN monto ELSE 0 END) AS totalEjecucion,
          SUM(CASE WHEN concepto='diferencia' THEN monto ELSE 0 END) AS totalDiferencia,
          SUM(monto) AS totalGeneral
        FROM movimientos;
      `);

    res.json(result.recordset[0] ?? {
      totalCapital: 0, totalHonorarios: 0, totalAlzada: 0,
      totalEjecucion: 0, totalDiferencia: 0, totalGeneral: 0
    });
  } catch (error) {
    console.error("Error al obtener total de cobranzas por mes:", error);
    res.status(500).send("Error en el servidor");
  }
});*/app.get("/expedientes/total-cobranzas-por-mes", async (req, res) => {
  const { anio, mes } = req.query;
  if (!anio || !mes) return res.status(400).send("Debe enviar 'anio' y 'mes'");

  const y = parseInt(anio, 10);
  const m = parseInt(mes, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12)
    return res.status(400).send("Parámetros inválidos. 'mes' debe ser 1..12.");

  const inicio = new Date(Date.UTC(y, m - 1, 1));
  const fin    = new Date(Date.UTC(y, m, 1));

  try {
    const result = await pool.request()
      .input("inicio", sql.Date, new Date(inicio.toISOString().slice(0,10)))
      .input("fin",    sql.Date, new Date(fin.toISOString().slice(0,10)))
      .query(`
  WITH U AS (
    SELECT id,
           COALESCE(porcentajeHonorarios, porcentaje, 0) AS porc
    FROM (
      SELECT id, porcentajeHonorarios, porcentaje,
             ROW_NUMBER() OVER (PARTITION BY id ORDER BY id) AS rn
      FROM usuario
    ) x
    WHERE rn = 1
  ),
  movimientos AS (

    -- CAPITAL (NO PARCIAL) + (viejos con flag=1 pero sin movimientos)
    SELECT 'capital' AS concepto, ISNULL(e.capitalPagoParcial, 0) AS monto
    FROM expedientes e
    WHERE e.estado <> 'eliminado'
      AND (
        ISNULL(e.esPagoParcial, 0) = 0
        OR NOT EXISTS (SELECT 1 FROM dbo.pagos pc WHERE pc.expediente_id = e.id)
      )
      AND CAST(e.fecha_cobro_capital AS DATE) >= @inicio
      AND CAST(e.fecha_cobro_capital AS DATE) <  @fin

    UNION ALL

    -- CAPITAL (PARCIAL REAL): suma pagos del mes desde dbo.pagos_capital
    SELECT 'capital' AS concepto, SUM(ISNULL(pc.monto, 0)) AS monto
    FROM expedientes e
    JOIN dbo.pagos pc ON pc.expediente_id = e.id
    WHERE e.estado <> 'eliminado'
      AND ISNULL(e.esPagoParcial, 0) = 1
      AND pc.fecha >= @inicio
      AND pc.fecha <  @fin

    UNION ALL

    -- HONORARIOS: prorrateado por % del abogado
    SELECT 'honorarios' AS concepto,
           ISNULL(e.montoLiquidacionHonorarios, 0) * (100 - ISNULL(u.porc, 0)) / 100.0 AS monto
    FROM expedientes e
    LEFT JOIN U u ON u.id = e.usuario_id
    WHERE e.estado <> 'eliminado'
      AND CAST(e.fecha_cobro AS DATE) >= @inicio
      AND CAST(e.fecha_cobro AS DATE) <  @fin

    UNION ALL

    -- ALZADA
    SELECT 'alzada' AS concepto,
           ISNULL(e.montoAcuerdo_alzada, 0) * (100 - ISNULL(u.porc, 0)) / 100.0 AS monto
    FROM expedientes e
    LEFT JOIN U u ON u.id = e.usuario_id
    WHERE e.estado <> 'eliminado'
      AND CAST(e.fechaCobroAlzada AS DATE) >= @inicio
      AND CAST(e.fechaCobroAlzada AS DATE) <  @fin

    UNION ALL

    -- EJECUCIÓN
    SELECT 'ejecucion' AS concepto,
           ISNULL(e.montoHonorariosEjecucion, 0) * (100 - ISNULL(u.porc, 0)) / 100.0 AS monto
    FROM expedientes e
    LEFT JOIN U u ON u.id = e.usuario_id
    WHERE e.estado <> 'eliminado'
      AND CAST(e.fechaCobroEjecucion AS DATE) >= @inicio
      AND CAST(e.fechaCobroEjecucion AS DATE) <  @fin

    UNION ALL

    -- DIFERENCIA
    SELECT 'diferencia' AS concepto,
           ISNULL(e.montoHonorariosDiferencia, 0) * (100 - ISNULL(u.porc, 0)) / 100.0 AS monto
    FROM expedientes e
    LEFT JOIN U u ON u.id = e.usuario_id
    WHERE e.estado <> 'eliminado'
      AND CAST(e.fechaCobroDiferencia AS DATE) >= @inicio
      AND CAST(e.fechaCobroDiferencia AS DATE) <  @fin
  )
  SELECT
    SUM(CASE WHEN concepto = 'capital'    THEN monto ELSE 0 END) AS totalCapital,
    SUM(CASE WHEN concepto = 'honorarios' THEN monto ELSE 0 END) AS totalHonorarios,
    SUM(CASE WHEN concepto = 'alzada'     THEN monto ELSE 0 END) AS totalAlzada,
    SUM(CASE WHEN concepto = 'ejecucion'  THEN monto ELSE 0 END) AS totalEjecucion,
    SUM(CASE WHEN concepto = 'diferencia' THEN monto ELSE 0 END) AS totalDiferencia,
    SUM(monto) AS totalGeneral
  FROM movimientos;
`)

    res.json(result.recordset?.[0] ?? {
      totalCapital: 0,
      totalHonorarios: 0,
      totalAlzada: 0,
      totalEjecucion: 0,
      totalDiferencia: 0,
      totalGeneral: 0
    });
  } catch (error) {
    console.error("Error al obtener total de cobranzas por mes:", error);
    res.status(500).send("Error en el servidor");
  }
});
// ==========================================================
// GET /expedientes/cobranzas-detalle-por-mes?anio=YYYY&mes=MM
// ==========================================================
app.get("/expedientes/cobranzas-detalle-por-mes", async (req, res) => {
  const { anio, mes } = req.query;
  if (!anio || !mes) return res.status(400).send("Debe enviar 'anio' y 'mes'");

  const y = parseInt(anio, 10), m = parseInt(mes, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12)
    return res.status(400).send("Parámetros inválidos.");

  const inicio = new Date(Date.UTC(y, m - 1, 1));
  const fin    = new Date(Date.UTC(y, m, 1));

  try {
    const result = await pool.request()
      .input("inicio", sql.Date, new Date(inicio.toISOString().slice(0,10)))
      .input("fin",    sql.Date, new Date(fin.toISOString().slice(0,10)))
      .query(`
WITH movimientos AS (
  -- CAPITAL (NO PARCIAL): incluye también los "viejos" con flag=1 pero sin movimientos
  SELECT e.id AS expediente_id, e.numero, e.anio AS anio_expediente, e.caratula,
         'capital' AS concepto, ISNULL(e.capitalPagoParcial, 0) AS monto
  FROM expedientes e
  WHERE e.estado != 'eliminado'
    AND (
      ISNULL(e.esPagoParcial, 0) = 0
      OR NOT EXISTS (SELECT 1 FROM dbo.pagos pc WHERE pc.expediente_id = e.id)
    )
    AND CAST(e.fecha_cobro_capital AS DATE) >= @inicio
    AND CAST(e.fecha_cobro_capital AS DATE) <  @fin

  UNION ALL

  -- CAPITAL (PARCIAL REAL): flag=1 y con movimientos
  SELECT e.id AS expediente_id, e.numero, e.anio AS anio_expediente, e.caratula,
         'capital' AS concepto, SUM(ISNULL(pc.monto, 0)) AS monto
  FROM expedientes e
  JOIN dbo.pagos pc ON pc.expediente_id = e.id
  WHERE e.estado != 'eliminado'
    AND ISNULL(e.esPagoParcial, 0) = 1
    AND pc.fecha >= @inicio
    AND pc.fecha <  @fin
  GROUP BY e.id, e.numero, e.anio, e.caratula

  UNION ALL

  -- HONORARIOS
  SELECT e.id, e.numero, e.anio, e.caratula,
         'honorarios' AS concepto,
         ISNULL(e.montoLiquidacionHonorarios, 0) *
         (100 - COALESCE(u.porcentajeHonorarios, u.porcentaje, 0)) / 100.0 AS monto
  FROM expedientes e
  LEFT JOIN usuario u ON u.id = e.usuario_id
  WHERE e.estado != 'eliminado'
    AND CAST(e.fecha_cobro AS DATE) >= @inicio
    AND CAST(e.fecha_cobro AS DATE) < @fin

  UNION ALL

  -- ALZADA
  SELECT e.id, e.numero, e.anio, e.caratula,
         'alzada' AS concepto,
         ISNULL(e.montoAcuerdo_alzada, 0) *
         (100 - COALESCE(u.porcentajeHonorarios, u.porcentaje, 0)) / 100.0 AS monto
  FROM expedientes e
  LEFT JOIN usuario u ON u.id = e.usuario_id
  WHERE e.estado != 'eliminado'
    AND CAST(e.fechaCobroAlzada AS DATE) >= @inicio
    AND CAST(e.fechaCobroAlzada AS DATE) < @fin

  UNION ALL

  -- EJECUCION
  SELECT e.id, e.numero, e.anio, e.caratula,
         'ejecucion' AS concepto,
         ISNULL(e.montoHonorariosEjecucion, 0) *
         (100 - COALESCE(u.porcentajeHonorarios, u.porcentaje, 0)) / 100.0 AS monto
  FROM expedientes e
  LEFT JOIN usuario u ON u.id = e.usuario_id
  WHERE e.estado != 'eliminado'
    AND CAST(e.fechaCobroEjecucion AS DATE) >= @inicio
    AND CAST(e.fechaCobroEjecucion AS DATE) < @fin

  UNION ALL

  -- DIFERENCIA
  SELECT e.id, e.numero, e.anio, e.caratula,
         'diferencia' AS concepto,
         ISNULL(e.montoHonorariosDiferencia, 0) *
         (100 - COALESCE(u.porcentajeHonorarios, u.porcentaje, 0)) / 100.0 AS monto
  FROM expedientes e
  LEFT JOIN usuario u ON u.id = e.usuario_id
  WHERE e.estado != 'eliminado'
    AND CAST(e.fechaCobroDiferencia AS DATE) >= @inicio
    AND CAST(e.fechaCobroDiferencia AS DATE) < @fin
),
detalle AS (
  SELECT
    m.expediente_id,
    m.numero,
    m.anio_expediente,
    m.caratula,
    SUM(CASE WHEN m.concepto = 'capital'    THEN m.monto ELSE 0 END) AS Capital,
    SUM(CASE WHEN m.concepto = 'honorarios' THEN m.monto ELSE 0 END) AS Honorarios,
    SUM(CASE WHEN m.concepto = 'alzada'     THEN m.monto ELSE 0 END) AS Alzada,
    SUM(CASE WHEN m.concepto = 'ejecucion'  THEN m.monto ELSE 0 END) AS Ejecucion,
    SUM(CASE WHEN m.concepto = 'diferencia' THEN m.monto ELSE 0 END) AS Diferencia,
    SUM(m.monto) AS TotalExpediente
  FROM movimientos m
  GROUP BY m.expediente_id, m.numero, m.anio_expediente, m.caratula
)
SELECT * FROM (
  SELECT 
    expediente_id,
    CAST(numero AS NVARCHAR(100)) AS numero,
    anio_expediente,
    caratula,
    Capital, Honorarios, Alzada, Ejecucion, Diferencia, TotalExpediente,
    0 AS orden
  FROM detalle

  UNION ALL

  SELECT 
    NULL,
    CAST('TOTAL GENERAL' AS NVARCHAR(100)),
    NULL,
    NULL,
    SUM(Capital), SUM(Honorarios), SUM(Alzada), SUM(Ejecucion), SUM(Diferencia), SUM(TotalExpediente),
    1
  FROM detalle
) X
ORDER BY X.orden, X.numero;

      `);

    res.json(result.recordset ?? []);
  } catch (error) {
    console.error("Error en /expedientes/cobranzas-detalle-por-mes:", error);
    res.status(500).send("Error en el servidor");
  }
});






// ==========================================================
//  COBRANZAS - RESUMEN MENSUAL (lista por mes/año)
//  GET /expedientes/cobranzas-mensuales            -> todos los años
//  GET /expedientes/cobranzas-mensuales?anio=YYYY  -> solo ese año
//  Respuesta: [{ anio, mes, totalCapital, totalHonorarios, totalAlzada, totalEjecucion, totalDiferencia, totalGeneral }]
// ==========================================================
/*app.get("/expedientes/cobranzas-mensuales", async (req, res) => {
  const { anio } = req.query;
  const y = anio ? parseInt(anio, 10) : null;
  if (anio && (isNaN(y) || y < 1900)) {
    return res.status(400).send("Parámetro 'anio' inválido.");
  }

  try {
    const result = await pool.request()
      .input("anio", sql.Int, y)
      .query(`
        WITH movs AS (
          -- CAPITAL: ya viene neto en capitalPagoParcial
          SELECT CAST(e.fecha_cobro_capital AS DATE) AS fecha,
                 'capital' AS concepto,
                 ISNULL(e.capitalPagoParcial, 0) AS monto
          FROM expedientes e
          WHERE e.fecha_cobro_capital IS NOT NULL

          UNION ALL
          -- HONORARIOS: (100 - % honorarios)
          SELECT CAST(e.fecha_cobro AS DATE),
                 'honorarios',
                 ISNULL(e.montoLiquidacionHonorarios, 0) *
                 (100 - COALESCE(u.porcentajeHonorarios, u.porcentaje, 0)) / 100.0
          FROM expedientes e
          LEFT JOIN usuario u ON u.id = e.usuario_id
          WHERE e.fecha_cobro IS NOT NULL

          UNION ALL
          -- ALZADA
          SELECT CAST(e.fechaCobroAlzada AS DATE),
                 'alzada',
                 ISNULL(e.montoAcuerdo_alzada, 0) *
                 (100 - COALESCE(u.porcentajeHonorarios, u.porcentaje, 0)) / 100.0
          FROM expedientes e
          LEFT JOIN usuario u ON u.id = e.usuario_id
          WHERE e.fechaCobroAlzada IS NOT NULL

          UNION ALL
          -- EJECUCIÓN
          SELECT CAST(e.fechaCobroEjecucion AS DATE),
                 'ejecucion',
                 ISNULL(e.montoHonorariosEjecucion, 0) *
                 (100 - COALESCE(u.porcentajeHonorarios, u.porcentaje, 0)) / 100.0
          FROM expedientes e
          LEFT JOIN usuario u ON u.id = e.usuario_id
          WHERE e.fechaCobroEjecucion IS NOT NULL

          UNION ALL
          -- DIFERENCIA
          SELECT CAST(e.fechaCobroDiferencia AS DATE),
                 'diferencia',
                 ISNULL(e.montoHonorariosDiferencia, 0) *
                 (100 - COALESCE(u.porcentajeHonorarios, u.porcentaje, 0)) / 100.0
          FROM expedientes e
          LEFT JOIN usuario u ON u.id = e.usuario_id
          WHERE e.fechaCobroDiferencia IS NOT NULL
        )
        SELECT
          YEAR(fecha)  AS anio,
          MONTH(fecha) AS mes,
          SUM(CASE WHEN concepto='capital'    THEN monto ELSE 0 END) AS totalCapital,
          SUM(CASE WHEN concepto='honorarios' THEN monto ELSE 0 END) AS totalHonorarios,
          SUM(CASE WHEN concepto='alzada'     THEN monto ELSE 0 END) AS totalAlzada,
          SUM(CASE WHEN concepto='ejecucion'  THEN monto ELSE 0 END) AS totalEjecucion,
          SUM(CASE WHEN concepto='diferencia' THEN monto ELSE 0 END) AS totalDiferencia,
          SUM(monto) AS totalGeneral
        FROM movs
        WHERE (@anio IS NULL OR YEAR(fecha) = @anio)
        GROUP BY YEAR(fecha), MONTH(fecha)
        ORDER BY anio DESC, mes DESC;
      `);

    res.json(result.recordset ?? []);
  } catch (error) {
    console.error("Error en /expedientes/cobranzas-mensuales:", error);
    res.status(500).send("Error en el servidor");
  }
});*/
/*
app.get('/expedientes/honorarios-pendientes', async (req, res) => {
  try {
    const result = await pool.request().query(`

      DECLARE @valorUMA FLOAT;
      SELECT TOP 1 @valorUMA = valor FROM uma ORDER BY valor DESC;
      SET @valorUMA = ISNULL(@valorUMA, 0);

      SELECT 
        ROUND(SUM(pendienteCapital + pendienteHonorarios + pendienteAlzada + pendienteEjecucion + pendienteDiferencia), 2) AS totalPendiente
      FROM (
        SELECT
          -- CAPITAL (se mantiene tu lógica con e.porcentaje y u.porcentaje)
          CASE 
            WHEN e.fecha_cobro_capital IS NULL AND e.montoLiquidacionCapital > 0
              THEN ROUND(
                e.montoLiquidacionCapital * 
                ISNULL(e.porcentaje, 100) / 100.0 * 
                (100.0 - ISNULL(u.porcentaje, 0)) / 100.0,
              2)
            ELSE 0
          END AS pendienteCapital,

          -- HONORARIOS (corregido: usar montoLiquidacionHonorarios; fallback a UMA*@valorUMA)
          CASE 
            WHEN e.fecha_cobro IS NULL THEN
              CASE 
                WHEN LOWER(ISNULL(e.subEstadoHonorariosSeleccionado, '')) IN ('giro', 'da en pago parcial', 'da en pago total')
                  THEN ROUND(
                    ISNULL(e.montoLiquidacionHonorarios, 0) * 
                    ((100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0),
                  2)
                ELSE ROUND(
                  (
                    CASE 
                      WHEN ISNULL(e.montoLiquidacionHonorarios, 0) > 0
                        THEN ISNULL(e.montoLiquidacionHonorarios, 0)
                      ELSE ISNULL(e.cantidadUMA, 0) * @valorUMA
                    END
                  ) * ((100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0),
                2)
              END
            ELSE 0
          END AS pendienteHonorarios,

          -- ALZADA
          CASE 
            WHEN e.fechaCobroAlzada IS NULL THEN
              ROUND(ISNULL(e.montoAcuerdo_alzada, 0) * ((100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0), 2)
            ELSE 0
          END AS pendienteAlzada,

          -- EJECUCIÓN
          CASE 
            WHEN e.fechaCobroEjecucion IS NULL THEN
              ROUND(ISNULL(e.montoHonorariosEjecucion, 0) * ((100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0), 2)
            ELSE 0
          END AS pendienteEjecucion,

          -- DIFERENCIA
          CASE 
            WHEN e.fechaCobroDiferencia IS NULL THEN
              ROUND(ISNULL(e.montoHonorariosDiferencia, 0) * ((100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0), 2)
            ELSE 0
          END AS pendienteDiferencia

        FROM expedientes e
        LEFT JOIN usuario u ON e.usuario_id = u.id
        WHERE e.estado <> 'eliminado'
      ) AS MontosPendientes
      WHERE (pendienteCapital + pendienteHonorarios + pendienteAlzada + pendienteEjecucion + pendienteDiferencia) > 0;

    `);

    const total = result.recordset[0]?.totalPendiente ?? 0;
    res.status(200).json(total);

  } catch (err) {
    console.error('Error al calcular honorarios pendientes:', err);
    res.status(500).json({ error: 'Error al calcular honorarios pendientes' });
  }
});
*/

app.get('/expedientes/honorarios-pendientes', async (req, res) => {
  try {
    const result = await pool.request().query(`

      DECLARE @valorUMA FLOAT;
      SELECT TOP 1 @valorUMA = valor FROM uma ORDER BY valor DESC;
      SET @valorUMA = ISNULL(@valorUMA, 0);

      IF OBJECT_ID('tempdb..#Pendientes') IS NOT NULL DROP TABLE #Pendientes;

      -- ======================================================
      -- Carga de pendientes por expediente
      -- ======================================================
      SELECT
        e.id,
        e.numero,
        e.anio,
        e.caratula,

        -- CAPITAL (tal cual: con e.porcentaje y u.porcentaje)
        CASE 
          WHEN e.fecha_cobro_capital IS NULL AND e.montoLiquidacionCapital > 0
            THEN ROUND(
              e.montoLiquidacionCapital *
              ISNULL(e.porcentaje, 100) / 100.0 *
              (100.0 - ISNULL(u.porcentaje, 0)) / 100.0,
            2)
          ELSE 0
        END AS pendienteCapital,

        -- HONORARIOS
        CASE 
          WHEN e.fecha_cobro IS NULL THEN
            CASE 
              WHEN LOWER(ISNULL(e.subEstadoHonorariosSeleccionado, '')) IN ('giro', 'da en pago parcial', 'da en pago total')
                THEN ROUND(
                  ISNULL(e.montoLiquidacionHonorarios, 0) *
                  ((100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0),
                2)
              ELSE ROUND(
                (
                  CASE 
                    WHEN ISNULL(e.montoLiquidacionHonorarios, 0) > 0
                      THEN ISNULL(e.montoLiquidacionHonorarios, 0)
                    ELSE ISNULL(e.cantidadUMA, 0) * @valorUMA
                  END
                ) * ((100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0),
              2)
            END
          ELSE 0
        END AS pendienteHonorarios,

        -- ALZADA
        CASE 
          WHEN e.fechaCobroAlzada IS NULL THEN
            ROUND(ISNULL(e.montoAcuerdo_alzada, 0) * ((100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0), 2)
          ELSE 0
        END AS pendienteAlzada,

        -- EJECUCIÓN
        CASE 
          WHEN e.fechaCobroEjecucion IS NULL THEN
            ROUND(ISNULL(e.montoHonorariosEjecucion, 0) * ((100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0), 2)
          ELSE 0
        END AS pendienteEjecucion,

        -- DIFERENCIA
        CASE 
          WHEN e.fechaCobroDiferencia IS NULL THEN
            ROUND(ISNULL(e.montoHonorariosDiferencia, 0) * ((100 - ISNULL(u.porcentajeHonorarios, 0)) / 100.0), 2)
          ELSE 0
        END AS pendienteDiferencia
      INTO #Pendientes
      FROM expedientes e
      LEFT JOIN usuario u ON e.usuario_id = u.id
      WHERE e.estado != 'eliminado';

      -- ======================================================
      -- SOLO TOTALES (lo que nos interesa es totalGeneral)
      -- ======================================================
      SELECT 
        ROUND(SUM(
          pendienteCapital 
          + pendienteHonorarios 
          + pendienteAlzada 
          + pendienteEjecucion 
          + pendienteDiferencia
        ), 2) AS totalGeneral
      FROM #Pendientes
      WHERE (pendienteCapital + pendienteHonorarios + pendienteAlzada + pendienteEjecucion + pendienteDiferencia) > 0;

    `);

    const total = result.recordset[0]?.totalGeneral ?? 0;
    res.status(200).json(total);

  } catch (err) {
    console.error('Error al calcular honorarios pendientes:', err);
    res.status(500).json({ error: 'Error al calcular honorarios pendientes' });
  }
});



  app.get("/expedientes/expedientes-activos", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT COUNT(*) AS cantidad
      FROM expedientes
      WHERE estado != 'eliminado'
    `);
    res.json(result.recordset[0].cantidad);
  } catch (err) {
    console.error("Error al contar expedientes activos:", err);
    res.status(500).send("Error en expedientes-activos");
  }
});


app.get("/expedientes/clientes-registrados", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT COUNT(*) AS cantidad
      FROM clientes
      WHERE estado != 'eliminado' AND estado != 'cobrado'
    `);
    res.json(result.recordset[0].cantidad);
  } catch (err) {
    console.error("Error al contar clientes:", err);
    res.status(500).send("Error en clientes-registrados");
  }
});


app.get("/expedientes/sentencias-emitidas", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT COUNT(*) AS cantidad
      FROM expedientes
      WHERE estado = 'sentencia'
    `);
    res.json(result.recordset[0].cantidad);
  } catch (err) {
    console.error("Error al contar sentencias emitidas:", err);
    res.status(500).send("Error en sentencias-emitidas");
  }
});






app.get("/expedientes/demandados-por-mes", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        FORMAT(e.fecha_inicio, 'yyyy-MM') AS mes,
        COUNT(d.id) AS cantidad
      FROM expedientes e
      JOIN expedientes_demandados ed ON e.id = ed.expediente_id
      JOIN demandados d ON d.id = ed.demandado_id
      WHERE e.fecha_inicio IS NOT NULL
      GROUP BY FORMAT(e.fecha_inicio, 'yyyy-MM')
      ORDER BY mes DESC
    `);
    const datos = result.recordset.reduce((acc, row) => {
      acc[row.mes] = row.cantidad;
      return acc;
    }, {});
    res.json(datos);
  } catch (err) {
    console.error("Error al obtener demandados por mes:", err);
    res.status(500).send("Error servidor");
  }
});

/*
app.put('/oficios/modificar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { expediente_id, demandado_id, parte, estado, fecha_diligenciado } = req.body;

    const poolConn = await pool.connect();
    const r = await poolConn.request()
      .input('id', sql.Int, Number(id))
      .input('expediente_id', sql.Int, expediente_id || null) // si no querés permitir cambios, quitá esta línea
      .input('demandado_id', sql.Int, demandado_id)
      .input('parte', sql.VarChar(20), parte)
      .input('estado', sql.VarChar(30), estado)
      .input('fecha_diligenciado', sql.Date, fecha_diligenciado || null)
      .query(`
        UPDATE oficios
        SET 
          expediente_id = COALESCE(@expediente_id, expediente_id),
          demandado_id = @demandado_id,
          parte = @parte,
          estado = @estado,
          fecha_diligenciado = @fecha_diligenciado
        WHERE id = @id;

        SELECT @@ROWCOUNT AS rows;
      `);

    if (r.recordset[0].rows === 0) {
      return res.status(404).json({ error: 'Oficio no encontrado' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error al modificar oficio:', err);
    res.status(500).json({ error: 'Error al modificar oficio' });
  }
});*/

app.put('/oficios/modificar/:id', async (req, res) => {

  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Falta id' });

    // Body (lo que *podría* venir)
    let {
      expediente_id,
      demandado_id,
      parte,
      estado,
      fecha_diligenciado,
      tipo,
      nombre_oficiada,
      tipo_pericia,   // ← pericia
      supletoria      // ← testimonial (DATE)
    } = req.body;

    // Traigo registro actual para hacer merge/validar coherencia
    const prevR = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT TOP 1 * FROM oficios WHERE id = @id`);
    if (!prevR.recordset.length) {
      return res.status(404).json({ error: 'Oficio/Prueba no encontrado' });
    }
    const prev = prevR.recordset[0];

    // Normalizaciones simples
    const has = (k) => Object.prototype.hasOwnProperty.call(req.body, k);
    const normStr = (v) => (v === undefined || v === null ? null : String(v).trim());
    const normDate = (v) => (v ? v : null); // acepto string YYYY-MM-DD o null

    // Tipo final (usa el recibido o el que ya estaba)
    const tipoNorm = normStr(has('tipo') ? tipo : prev.tipo)?.toLowerCase();
    if (!['oficio', 'testimonial', 'pericia'].includes(tipoNorm || '')) {
      return res.status(400).json({ error: 'Tipo inválido. Use: oficio | testimonial | pericia' });
    }

    // Armo el "final" para validar (merge body + prev)
    const final = {
      expediente_id: has('expediente_id') ? Number(expediente_id) : prev.expediente_id,
      demandado_id: has('demandado_id')
        ? (demandado_id === '' || demandado_id === null ? null : Number(demandado_id))
        : prev.demandado_id,
      parte: has('parte') ? normStr(parte) : prev.parte,
      estado: has('estado') ? normStr(estado) : prev.estado,
      fecha_diligenciado: has('fecha_diligenciado') ? normDate(fecha_diligenciado) : prev.fecha_diligenciado,
      nombre_oficiada: has('nombre_oficiada') ? normStr(nombre_oficiada) : prev.nombre_oficiada,
      tipo_pericia: has('tipo_pericia') ? normStr(tipo_pericia) : prev.tipo_pericia,
      supletoria: has('supletoria') ? normDate(supletoria) : prev.supletoria
    };

    // Validaciones por tipo
    if (tipoNorm === 'oficio') {
      // demandado_id requerido
      if (final.demandado_id == null) {
        return res.status(400).json({ error: 'Para tipo "oficio", demandado_id es obligatorio' });
      }
      // limpiar campos que no aplican
      final.nombre_oficiada = null;
      final.tipo_pericia = null;
      final.supletoria = null;
    }

    if (tipoNorm === 'testimonial') {
      // nombre del testigo requerido
      if (!final.nombre_oficiada) {
        return res.status(400).json({ error: 'Para tipo "testimonial", nombre_oficiada (testigo) es obligatorio' });
      }
      // no aplica demandado ni tipo_pericia; supletoria es DATE opcional
      final.demandado_id = null;
      final.tipo_pericia = null;
      // final.supletoria queda como viene (fecha o null)
    }

    if (tipoNorm === 'pericia') {
      // perito requerido
      if (!final.nombre_oficiada) {
        return res.status(400).json({ error: 'Para tipo "pericia", nombre_oficiada (perito) es obligatorio' });
      }
      // tipo_pericia requerido (por ahora solo "Pericial informática")
      const tp = (final.tipo_pericia || '').toLowerCase();
      if (!['pericial informática', 'pericial informatica'].includes(tp)) {
        return res.status(400).json({ error: 'tipo_pericia inválido. Solo "Pericial informática".' });
      }
      // no aplica demandado ni supletoria
      final.demandado_id = null;
      final.supletoria = null;
    }

    // Preparar UPDATE (SET fijo con valores ya fusionados/normalizados)
    const reqSql = pool.request()
      .input('id', sql.Int, id)
      .input('expediente_id', sql.Int, final.expediente_id)
      .input('demandado_id', sql.Int, final.demandado_id) // puede ser null
      .input('parte', sql.NVarChar(20), final.parte)
      .input('estado', sql.NVarChar(30), final.estado)
      .input('fecha_diligenciado', sql.Date, final.fecha_diligenciado || null)
      .input('tipo', sql.NVarChar(20), tipoNorm)
      .input('nombre_oficiada', sql.NVarChar(200), final.nombre_oficiada)
      .input('tipo_pericia', sql.NVarChar(100), final.tipo_pericia || null)
      .input('supletoria', sql.Date, final.supletoria || null);

    const updateSql = `
      UPDATE oficios
      SET
        expediente_id       = @expediente_id,
        demandado_id        = @demandado_id,
        parte               = @parte,
        estado              = @estado,
        fecha_diligenciado  = @fecha_diligenciado,
        tipo                = @tipo,
        nombre_oficiada     = @nombre_oficiada,
        tipo_pericia        = @tipo_pericia,
        supletoria          = @supletoria
      WHERE id = @id;

      SELECT @@ROWCOUNT AS rows;
    `;

    const r = await reqSql.query(updateSql);
    if (!r.recordset?.[0]?.rows) {
      return res.status(404).json({ error: 'Oficio/Prueba no encontrado' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error al modificar prueba:', err);
    res.status(500).json({ error: 'Error al modificar prueba' });
  }
});


// GET /expedientes/caratula/:id
app.get('/expedientes/caratula/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const rs = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          e.numero,
          e.anio,
          e.juicio,
          -- actor (primer cliente)
          (SELECT TOP 1 CONCAT(c.apellido, ' ', c.nombre)
           FROM clientes_expedientes ce
           JOIN clientes c ON c.id = ce.cliente_id
           WHERE ce.expediente_id = e.id
           ORDER BY ce.orden, c.apellido, c.nombre) AS actor,
          -- demandado (primero)
          (SELECT TOP 1 d.nombre
           FROM demandados_expedientes de
           JOIN demandados d ON d.id = de.demandado_id
           WHERE de.expediente_id = e.id
           ORDER BY de.orden, d.nombre) AS demandado
        FROM expedientes e
        WHERE e.id = @id
      `);

    const row = rs.recordset?.[0];
    if (!row) return res.status(404).send({ message: 'No encontrado' });
    res.send({
      numero: row.numero ?? null,
      anio: row.anio ?? null,
      juicio: row.juicio ?? null,
      actor: row.actor ?? null,
      demandado: row.demandado ?? null,
    });
  } catch (err) {
    console.error('caratula error', err);
    res.status(500).send({ message: 'Error consultando carátula' });
  }
});


app.get('/pagos', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request().query(`
      SELECT *
      FROM pagos
      WHERE tipo_pago NOT IN (
        'capital',
        'honorario',
        'alzada',
        'ejecucion',
        'diferencia'
      )
      ORDER BY fecha DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error en GET /pagos:', err);
    res.status(500).json({ error: 'Error al obtener los pagos' });
  }
});

app.post('/pagos', async (req, res) => {
  const { fecha, monto, tipo_pago, expediente_id } = req.body;

  const tiposPermitidos = ['carta documento', 'consulta', 'otro', 'capital', 'honorario', 'alzada', 'diferencia', 'ejecucion'];
  if (!fecha || !monto) {
    return res.status(400).json({ error: 'La fecha y el monto son obligatorios' });
  }
  if (!tipo_pago || !tiposPermitidos.includes(tipo_pago)) {
    return res.status(400).json({ error: 'tipo_pago inválido. Use "carta documento" o "consulta".' });
  }
    const nuevoId = await generarNuevoId(pool, 'pagos', 'id');

  try {
    let pool = await sql.connect(dbConfig);

    let result = await pool.request()
      .input('id', sql.Int, nuevoId)
      .input('fecha', sql.Date, fecha)
      .input('monto', sql.Decimal(12,2), monto)
      .input('tipo_pago', sql.VarChar(30), tipo_pago)
      .input('expediente_id', sql.Int, expediente_id)
      .query(`
        INSERT INTO pagos (id, fecha, monto, tipo_pago, expediente_id)
        VALUES (@id, @fecha, @monto, @tipo_pago, @expediente_id);
        SELECT SCOPE_IDENTITY() as id;
      `);

    res.status(201).json({
      message: 'Pago registrado con éxito',
      pago: { id: result.recordset[0].id, fecha, monto, tipo_pago }
    });
  } catch (err) {
    console.error('Error en POST /pagos:', err);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
});

app.delete('/pagos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let pool = await sql.connect(dbConfig);
    await pool.request().input('id', sql.Int, id)
      .query('DELETE FROM pagos WHERE id = @id');
    res.json({ message: 'Pago eliminado con éxito' });
  } catch (err) {
    console.error('Error en DELETE /pagos:', err);
    res.status(500).json({ error: 'Error al eliminar el pago' });
  }
});



// GET /expedientes/partes/:id  -> actoras + demandados normalizados
app.get('/expedientes/partes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    // ACTORAS: pueden ser cliente o empresa (tabla clientes_expedientes)
    const rsAct = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 'cliente' AS tipo, c.id, c.nombre, c.apellido
        FROM clientes_expedientes ce
        JOIN clientes c ON c.id = ce.id_cliente
        WHERE ce.id_expediente = @id AND ce.id_cliente IS NOT NULL

        UNION ALL

        SELECT 'empresa' AS tipo, d.id, d.nombre, NULL AS apellido
        FROM clientes_expedientes ce
        JOIN demandados d ON d.id = ce.id_empresa
        WHERE ce.id_expediente = @id AND ce.id_empresa IS NOT NULL
        ORDER BY tipo, nombre
      `);

    // DEMANDADOS: pueden ser empresa o cliente (tabla expedientes_demandados)
    const rsDem = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 'empresa' AS tipo, d.id, d.nombre, NULL AS apellido
        FROM expedientes_demandados ed
        JOIN demandados d ON d.id = ed.id_demandado
        WHERE ed.id_expediente = @id AND ed.id_demandado IS NOT NULL

        UNION ALL

        SELECT 'cliente' AS tipo, c.id, c.nombre, c.apellido
        FROM expedientes_demandados ed
        JOIN clientes c ON c.id = ed.id_cliente
        WHERE ed.id_expediente = @id AND ed.id_cliente IS NOT NULL
        ORDER BY tipo, nombre
      `);

    res.json({
      actoras: rsAct.recordset || [],
      demandados: rsDem.recordset || []
    });
  } catch (err) {
    console.error('GET /expedientes/partes/:id', err);
    res.status(500).json({ error: 'Error obteniendo partes' });
  }
});


app.put('/expedientes/restaurar-cobro/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const r = await new sql.Request(tx)
      .input('id', sql.Int, id)
      .query(`
        UPDATE expedientes
        SET
          -- flags
          honorarioCobrado           = 0,
          capitalCobrado             = 0,
          honorarioAlzadaCobrado     = 0,
          honorarioEjecucionCobrado  = 0,
          honorarioDiferenciaCobrado = 0,

          -- fechas de cobro
          fecha_cobro            = NULL,
          fecha_cobro_capital    = NULL,
          fechaCobroAlzada       = NULL,
          fechaCobroEjecucion    = NULL,
          fechaCobroDiferencia   = NULL,

          -- montos ligados al cobro
          montoAcuerdo_alzada       = NULL,
          montoHonorariosEjecucion  = NULL,
          montoHonorariosDiferencia = NULL,

          -- parciales
          capitalPagoParcial = NULL
        WHERE id = @id AND estado <> 'eliminado'
      `);

    await tx.commit();

    if ((r.rowsAffected?.[0] || 0) > 0) {
      return res.json({ ok: true, mensaje: 'Cobro restaurado' });
    }
    return res.status(404).json({ ok:false, mensaje:'Expediente no encontrado' });
  } catch (e) {
    try { await tx.rollback(); } catch {}
    console.error('REST/expedientes/restaurar-cobro', e);
    res.status(500).json({ ok:false, message:'Error al restaurar cobro' });
  }
});
// ------- CODIGO -------
// Campos: id, tipo ('familia' | 'patrimoniales' | 'comercial'), codigo, descripcion

const TIPOS_JURIS = ['familia', 'patrimoniales', 'comercial'];

/**
 * GET /codigos
 * Query params opcionales:
 *   - q: busca en tipo, codigo o descripcion
 *   - tipo: filtra por tipo exacto
 *   - page, pageSize: paginación
 */
app.get('/codigos', async (req, res) => {
  try {
    const request = pool.request();
    let query = "SELECT * FROM codigos";   // ← tabla nueva

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener codigos:", err);
    res.status(500).send(err);
  }
});


/**
 * POST /codigos
 * Body JSON: { tipo, codigo, descripcion }
 */
app.post('/codigos', async (req, res) => {
  try {
    const { tipo, codigo, descripcion } = req.body || {};

    if (!tipo || !codigo || !descripcion) {
      return res.status(400).json({ error: 'Faltan campos: tipo, codigo y descripcion son obligatorios.' });
    }
    if (!TIPOS_JURIS.includes(String(tipo).toLowerCase())) {
      return res.status(400).json({ error: 'Tipo inválido. Use: familia, patrimoniales o comercial.' });
    }

    const exists = await pool.request()
      .input('codigo', sql.VarChar, codigo)
      .query(`SELECT TOP 1 id FROM codigos WHERE codigo = @codigo;`);

    if (exists.recordset.length > 0) {
      return res.status(409).json({ error: 'El código ya existe.' });
    }
    const nuevoId = await generarNuevoId(pool, 'codigos', 'id');

    const rs = await pool.request()
      .input('id', sql.Int, nuevoId)
      .input('tipo', sql.VarChar, tipo.toLowerCase())
      .input('codigo', sql.VarChar, codigo)
      .input('descripcion', sql.NVarChar(sql.MAX), descripcion)
      .query(`
        INSERT INTO codigos (id, tipo, codigo, descripcion)
        VALUES (@id, @tipo, @codigo, @descripcion);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const id = rs.recordset[0] ? rs.recordset[0].id : null;
    res.status(201).json({ id, tipo: tipo.toLowerCase(), codigo, descripcion });
  } catch (err) {
    console.error('POST /codigos error:', err);
    res.status(500).json({ error: 'Error al crear codigo' });
  }
});

/**
 * PUT /codigos/:id
 * Body JSON: { tipo?, codigo?, descripcion? }
 */
app.put('/codigos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { tipo, codigo, descripcion } = req.body || {};
    if (tipo !== undefined && !TIPOS_JURIS.includes(String(tipo).toLowerCase())) {
      return res.status(400).json({ error: 'Tipo inválido. Use: familia, patrimoniales o comercial.' });
    }
    if (tipo === undefined && codigo === undefined && descripcion === undefined) {
      return res.status(400).json({ error: 'No hay datos para actualizar.' });
    }

    const current = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT TOP 1 * FROM codigos WHERE id = @id;`);

    if (current.recordset.length === 0) {
      return res.status(404).json({ error: 'codigos no encontrada' });
    }

    if (codigo !== undefined) {
      const dup = await pool.request()
        .input('id', sql.Int, id)
        .input('codigo', sql.VarChar, codigo)
        .query(`SELECT TOP 1 id FROM codigos WHERE codigo = @codigo AND id <> @id;`);
      if (dup.recordset.length > 0) {
        return res.status(409).json({ error: 'El código ya existe en otro registro.' });
      }
    }

    // Construcción del UPDATE dinámico
    const sets = [];
    const reqUpd = pool.request().input('id', sql.Int, id);

    if (tipo !== undefined) {
      sets.push('tipo = @tipo');
      reqUpd.input('tipo', sql.VarChar, String(tipo).toLowerCase());
    }
    if (codigo !== undefined) {
      sets.push('codigo = @codigo');
      reqUpd.input('codigo', sql.VarChar, codigo);
    }
    if (descripcion !== undefined) {
      sets.push('descripcion = @descripcion');
      reqUpd.input('descripcion', sql.NVarChar(sql.MAX), descripcion);
    }

    const sqlUpdate = `
      UPDATE codigos
      SET ${sets.join(', ')}
      WHERE id = @id;
      SELECT id, tipo, codigo, descripcion, fecha_creacion
      FROM codigos WHERE id = @id;
    `;

    const rs = await reqUpd.query(sqlUpdate);
    const updated = rs.recordset[0];

    res.json(updated);
  } catch (err) {
    console.error('PUT /codigos/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar el codigo' });
  }
});


app.delete('/codigos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  try {

    // 1) Eliminar codigo
    const del = await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM codigos WHERE id = @id; SELECT @@ROWCOUNT AS deleted;`);

    const deleted = del.recordset?.[0]?.deleted || 0;
    if (deleted === 0) return res.status(404).json({ error: 'No encontrada' });

    return res.json({ ok: true, del });
  } catch (e) {
    console.error('DELETE /codigos error:', e);
    return res.status(500).json({ error: 'Error al eliminar' });
  }
});

const FUEROS = ['CCF', 'COM', 'CIV', 'CC'];

app.get('/jurisprudencias', async (req, res) => {
  try {
    const request = pool.request();
    let query = `
      SELECT 
        j.id,
        j.expediente_id,
        j.fuero,
        j.demandado_id,
        d.nombre       AS demandado_nombre,
        j.juzgado_id,
        juz.nombre     AS juzgado_nombre,
        j.sentencia,
        j.juez_id,
        jue.nombre     AS juez_nombre,
        j.camara,
        j.codigo_id,
        c.codigo       AS codigo,
        c.descripcion  AS codigo_descripcion
      FROM jurisprudencias j
      LEFT JOIN demandados d ON d.id = j.demandado_id
      LEFT JOIN juzgados   juz ON juz.id = j.juzgado_id
      LEFT JOIN juez       jue ON jue.id = j.juez_id
      LEFT JOIN codigos    c   ON c.id = j.codigo_id
      WHERE 1 = 1
    `;

    const { expedienteId } = req.query;
    if (expedienteId) {
    request.input('expedienteId', sql.Int, parseInt(expedienteId, 10));
      query += ' AND j.expediente_id = @expedienteId';
    }

    query += ' ORDER BY j.id DESC';

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('GET /jurisprudencias error:', err);
    res.status(500).json({ error: 'Error al obtener jurisprudencias' });
  }
});

app.post('/jurisprudencias', async (req, res) => {
  try {
    const {
      expediente_id,
      fuero,
      demandado_id,
      juzgado_id,
      sentencia,    // puede venir null o string fecha
      juez_id,
      camara,
      codigo_id
    } = req.body || {};

    // Validaciones básicas
    if (!expediente_id || !fuero || !demandado_id || !juzgado_id || !juez_id || !camara || !codigo_id) {
      return res.status(400).json({
        error: 'Faltan datos obligatorios: expediente_id, fuero, demandado_id, juzgado_id, juez_id, camara, codigo_id'
      });
    }

    if (!FUEROS.includes(String(fuero).toUpperCase())) {
      return res.status(400).json({ error: 'Fuero inválido. Use: CCF, COM, CIV o CC.' });
    }
        const id = await generarNuevoId(pool, 'jurisprudencias', 'id');

    const reqIns = pool.request()
      .input('id', sql.Int, Number(id))
      .input('expediente_id', sql.Int, Number(expediente_id))
      .input('fuero',        sql.NVarChar, String(fuero).toUpperCase())
      .input('demandado_id', sql.Int, Number(demandado_id))
      .input('juzgado_id',   sql.Int, Number(juzgado_id))
      .input('juez_id',      sql.Int, Number(juez_id))
      .input('camara',       sql.NVarChar, String(camara))
      .input('codigo_id',    sql.Int, Number(codigo_id))
      .input('sentencia',    sql.DateTime, sentencia ? new Date(sentencia) : null);

    const rs = await reqIns.query(`
      INSERT INTO jurisprudencias (
        id, 
        expediente_id,
        fuero,
        demandado_id,
        juzgado_id,
        sentencia,
        juez_id,
        camara,
        codigo_id
      )
      VALUES (
        @id, 
        @expediente_id,
        @fuero,
        @demandado_id,
        @juzgado_id,
        @sentencia,
        @juez_id,
        @camara,
        @codigo_id
      );

      SELECT 
        j.id,
        j.expediente_id,
        j.fuero,
        j.demandado_id,
        d.nombre       AS demandado_nombre,
        j.juzgado_id,
        juz.nombre     AS juzgado_nombre,
        j.sentencia,
        j.juez_id,
        jue.nombre     AS juez_nombre,
        j.camara,
        j.codigo_id,
        c.codigo       AS codigo,
        c.descripcion  AS codigo_descripcion
      FROM jurisprudencias j
      LEFT JOIN demandados d ON d.id = j.demandado_id
      LEFT JOIN juzgados   juz ON juz.id = j.juzgado_id
      LEFT JOIN juez       jue ON jue.id = j.juez_id
      LEFT JOIN codigos    c   ON c.id = j.codigo_id
      WHERE j.id = SCOPE_IDENTITY();
    `);

    const creado = rs.recordset[0];
    res.status(201).json(creado);
  } catch (err) {
    console.error('POST /jurisprudencias error:', err);
    res.status(500).json({ error: 'Error al crear jurisprudencia' });
  }
});

// 🔢 Método genérico para generar un nuevo ID para cualquier tabla
async function generarNuevoId(pool, tabla, columna = 'id') {
  // Por seguridad, solo permito tablas conocidas
  const tablasValidas = [
    'clientes',
    'expedientes',
    'localidades',
    'juzgados',
    'demandados',
    'juez',
    'eventos_calendario',
    'partido',
    'pagos',
    'pagos_expediente',
    'clientes_expedientes',
    'jurisprudencias',
    'codigos',
    'uma',
    'usuario',
    'oficios',
    'mediaciones',
    'clientes_eventos',
    'expedientes_demandados'
  ];

  if (!tablasValidas.includes(tabla)) {
    throw new Error(`Tabla no permitida para generar nuevo id: ${tabla}`);
  }

  const consulta = `
    SELECT ISNULL(MAX(${columna}), 0) + 1 AS nuevoId
    FROM dbo.${tabla}
  `;

  const result = await pool.request().query(consulta);
  const nuevoId = result.recordset[0]?.nuevoId;

  if (!nuevoId) {
    throw new Error(`No se pudo calcular nuevo id para tabla ${tabla}`);
  }

  return nuevoId;
}


async function getAllTables(pool) {
  const result = await pool.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
  `);
  return result.recordset.map(row => row.TABLE_NAME);
}

// GET /backup - genera ZIP con JSON de TODAS las tablas
app.get('/backup', async (req, res) => {
  try {
    // Conexión (igual que en /pagos)
    let pool = await sql.connect(dbConfig);

    // 1) Traer nombres de todas las tablas base
    const tablasResult = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);

    const tablas = tablasResult.recordset.map(r => r.TABLE_NAME);

    // 2) Armar objeto con datos de cada tabla
    let backupData = {};

    for (const nombreTabla of tablas) {
      const result = await pool.request().query(`SELECT * FROM [${nombreTabla}]`);
      backupData[nombreTabla] = result.recordset;
    }

    // 3) Preparar headers para ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${Date.now()}.zip`);

    // 4) Crear ZIP y agregar el JSON adentro
    const archive = Archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    archive.append(JSON.stringify(backupData, null, 2), { name: 'backup.json' });

    await archive.finalize();
  } catch (err) {
    console.error('Error en GET /backup:', err);
    res.status(500).json({ error: 'Error generando backup' });
  }
});

  app.post("/pagos-capital/agregar", async (req, res) => {
    try {
      const { expediente_id, monto, fecha_pago } = req.body;

      if (expediente_id == null || monto == null || !fecha_pago) {
        return res.status(400).send("Faltan campos: expediente_id, monto, fecha_pago");
      }

      const expedienteIdNum = Number(expediente_id);
      const montoNum = Number(monto);

      if (!Number.isFinite(expedienteIdNum) || expedienteIdNum <= 0) {
        return res.status(400).send("expediente_id inválido");
      }
      if (!Number.isFinite(montoNum) || montoNum <= 0) {
        return res.status(400).send("monto inválido (debe ser > 0)");
      }

      // fecha_pago esperado: 'YYYY-MM-DD'
      const fechaStr = String(fecha_pago).slice(0, 10);
      const fechaDate = new Date(fechaStr + "T00:00:00.000Z");
      if (Number.isNaN(fechaDate.getTime())) {
        return res.status(400).send("fecha_pago inválida (usar YYYY-MM-DD)");
      }

      const request = pool.request()
        .input("expediente_id", sql.Int, expedienteIdNum)
        .input("monto", sql.Decimal(18, 2), montoNum)
        .input("fecha_pago", sql.Date, new Date(fechaStr)); // Date sin hora

      await request.query(`
        INSERT INTO dbo.pagos_capital (expediente_id, monto, fecha_pago)
        VALUES (@expediente_id, @monto, @fecha_pago);
      `);

      return res.json({ ok: true });
    } catch (error) {
      console.error("Error al insertar pago parcial (capital):", error);
      return res.status(500).send("Error en el servidor");
    }
  });

  app.put('/jurisprudencias/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const {
      expediente_id,
      fuero,
      demandado_id,
      juzgado_id,
      juez_id,
      sentencia,
      camara,
      codigo_id,
      
    } = req.body || {};

    if (
      expediente_id === undefined &&
      fuero === undefined &&
      demandado_id === undefined &&
      juzgado_id === undefined &&
      juez_id === undefined &&
      sentencia === undefined &&
      camara === undefined &&
      codigo_id === undefined 
    ) {
      return res.status(400).json({ error: 'No hay datos para actualizar.' });
    }

    const current = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT TOP 1 * FROM jurisprudencias WHERE id = @id;`);

    if (current.recordset.length === 0) {
      return res.status(404).json({ error: 'Jurisprudencia no encontrada' });
    }

    const sets = [];
    const reqUpd = pool.request().input('id', sql.Int, id);

    if (expediente_id !== undefined) {
      sets.push('expediente_id = @expediente_id');
      reqUpd.input('expediente_id', sql.Int, expediente_id);
    }
    if (fuero !== undefined) {
      sets.push('fuero = @fuero');
      reqUpd.input('fuero', sql.VarChar, String(fuero));
    }
    if (demandado_id !== undefined) {
      sets.push('demandado_id = @demandado_id');
      reqUpd.input('demandado_id', sql.Int, demandado_id);
    }
    if (juzgado_id !== undefined) {
      sets.push('juzgado_id = @juzgado_id');
      reqUpd.input('juzgado_id', sql.Int, juzgado_id);
    }
    if (juez_id !== undefined) {
      sets.push('juez_id = @juez_id');
      reqUpd.input('juez_id', sql.Int, juez_id);
    }
    if (sentencia !== undefined) {
      sets.push('sentencia = @sentencia');
      reqUpd.input('sentencia', sql.DateTime, sentencia ? new Date(sentencia) : null);
    }
    if (camara !== undefined) {
      sets.push('camara = @camara');
      reqUpd.input('camara', sql.NVarChar(sql.MAX), camara);
    }
    if (codigo_id !== undefined) {
      sets.push('codigo_id = @codigo_id');
      reqUpd.input('codigo_id', sql.Int, codigo_id);
    }

    const sqlUpdate = `
      UPDATE jurisprudencias
      SET ${sets.join(', ')}
      WHERE id = @id;

      SELECT * FROM jurisprudencias WHERE id = @id;
    `;

    const rs = await reqUpd.query(sqlUpdate);
    res.json(rs.recordset[0]);
  } catch (err) {
    console.error('PUT /jurisprudencias/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar jurisprudencia' });
  }
});

module.exports = router;

    app.listen(3003, () => {
      console.log("Servidor corriendo en http://localhost:3003");
    });
  })
  .catch(err => {
    console.error("❌ Error conectando a SQL Server:", err);
  });
}

  iniciarServidor();

