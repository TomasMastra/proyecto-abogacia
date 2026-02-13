const express = require("express");
const cors = require("cors");
const argon2 = require("argon2");
const Archiver = require("archiver");
const router = express.Router();

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

// ====== Postgres (Supabase) ======
const { Pool } = require("pg");

// PRUEBA
const raw = process.env.DATABASE_URL || "";
console.log("HAS_DATABASE_URL:", Boolean(raw), "LEN:", raw.length);
console.log("DB_URL_MASKED:", raw);

// DATABASE_URL = URI del *Session pooler* (recomendado en tu caso)
/*const pgPool = new Pool({
  
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase
});*/


const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4
});


// Render
const PORT = process.env.PORT || 3000;


// =======================================================
//              FUNCIÓN PRINCIPAL DEL SERVIDOR
// =======================================================

async function iniciarServidor() {
  try {
    await pgPool.query("select 1");
    console.log("✔ Conectado a Supabase (Postgres) correctamente.");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error conectando", err);
    process.exit(1);
  }
}

    app.get("/health", (req, res) => {
      res.status(200).send("ok");
    });


    // Ruta para obtener todos los usuarios (postgres)
    app.get("/usuario", async (req, res) => {
      try {
        const result = await pgPool.query(`SELECT * FROM public."usuario"`);
        res.json(result.rows);
      } catch (err) {
        console.error(err);
        res.status(500).send(err);
      }
    });

      // postgre
      app.get("/uma", async (req, res) => {
        try {
          const result = await pgPool.query(`
            SELECT * FROM public."uma"
            ORDER BY fecha_resolucion DESC
          `);
          res.json(result.rows);
        } catch (err) {
          console.error(err);
          res.status(500).send(err);
        }
      });




app.post("/login", async (req, res) => {
  const { email, contraseña } = req.body;

  try {
    const result = await pgPool.query(
      `
      SELECT
        id,
        nombre,
        email,
        rol,
        estado,
        fecha_creacion,
        password_hash
      FROM public."usuario"
      WHERE email = $1
        AND estado = 'activo'
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    const usuario = result.rows[0];

    if (!usuario.password_hash || !usuario.password_hash.startsWith("$argon2")) {
      console.error("Usuario sin hash Argon2 configurado. ID:", usuario.id);
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    let esValida = false;
    try {
      esValida = await argon2.verify(usuario.password_hash, contraseña);
    } catch (err) {
      console.error("Error verificando hash Argon2:", err);
      return res.status(500).json({ error: "Error al verificar la contraseña" });
    }

    if (!esValida) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    // Nunca mandamos el hash al frontend
    delete usuario.password_hash;

    return res.status(200).json({
      message: "Login exitoso",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        estado: usuario.estado,
        fecha_creacion: usuario.fecha_creacion,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /register  (para usar con Postman)
app.post("/register", async (req, res) => {
  try {
    const {
      nombre,
      email,
      rol = "abogado",
      estado = "activo",
      porcentaje = 50,
      porcentajeHonorarios = 50,
      contraseña,
    } = req.body;

    if (!nombre || !email || !contraseña) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
        camposRequeridos: ["nombre", "email", "contraseña"],
      });
    }

    // Email único
    const existe = await pgPool.query(
      `SELECT 1 FROM public."usuario" WHERE email = $1 LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );
    if (existe.rows.length) {
      return res.status(409).json({ error: "Ya existe un usuario con ese email" });
    }

    // Nuevo ID (tenés función genérica y usuario está permitido) :contentReference[oaicite:2]{index=2}
    const nuevoId = await generarNuevoId(pgPool, "usuario", "id");

    // Hash Argon2 (misma config que ya usás) :contentReference[oaicite:3]{index=3}
    const password_hash = await hashPassword(String(contraseña));

    const { rows } = await pgPool.query(
      `
      INSERT INTO public."usuario"
        (id, nombre, email, rol, estado, fecha_creacion, porcentaje, "porcentajeHonorarios", password_hash)
      VALUES
        ($1,$2,$3,$4,$5, now(), $6, $7, $8)
      RETURNING id, nombre, email, rol, estado, fecha_creacion, porcentaje, "porcentajeHonorarios"
      `,
      [
        Number(nuevoId),
        String(nombre).trim(),
        String(email).trim().toLowerCase(),
        String(rol).trim(),
        String(estado).trim(),
        Number(porcentaje),
        Number(porcentajeHonorarios),
        password_hash,
      ]
    );

    return res.status(201).json({ message: "Usuario creado", usuario: rows[0] });
  } catch (err) {
    console.error("POST /register error:", err);
    return res.status(500).json({ error: "Error al registrar usuario", message: err.message });
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
// Ruta para obtener clientes (postgres)
app.get("/clientes", async (req, res) => {
  const usuario_id = Number(req.query.usuario_id);
  const rol = String(req.query.rol || "");

  try {
    const params = [];
    let sqlText = `SELECT * FROM public.clientes WHERE estado <> 'eliminado'`;

 /*   if (rol !== "admin") {
      params.push(usuario_id);
      sqlText += ` AND usuario_id = $${params.length}`;
    }*/

    const result = await pgPool.query(sqlText, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener clientes:", err);
    res.status(500).send(err);
  }
});

/*
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
});*/

// postgres
app.get("/expedientes", async (req, res) => {
  const rol = String(req.query.rol || "");
  const usuario_id = req.query.usuario_id != null ? Number(req.query.usuario_id) : null;

  // si NO es admin, usuario_id es obligatorio
  if (rol !== "admin" && !Number.isFinite(usuario_id)) {
    return res.status(400).json({ error: "usuario_id inválido" });
  }

  try {
    const params = [];
    let filtroUsuario = "";

    if (rol !== "admin") {
      params.push(usuario_id);
      filtroUsuario = ` AND e.usuario_id = $1`;
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
        e."capitalCobrado",
        e."estadoHonorariosSeleccionado",
        COALESCE((
          SELECT string_agg(btrim(p.nombre_completo::text), ' | ')
          FROM (
            SELECT btrim(c.nombre || ' ' || c.apellido) AS nombre_completo
            FROM public.clientes_expedientes ce
            JOIN public.clientes c ON c.id = ce.id_cliente
            WHERE ce.id_expediente = e.id

            UNION ALL
            SELECT btrim(d.nombre) AS nombre_completo
            FROM public.expedientes_demandados ed
            JOIN public.demandados d ON d.id = ed.id_demandado
            WHERE ed.id_expediente = e.id

            UNION ALL
            SELECT btrim(c2.nombre || ' ' || c2.apellido) AS nombre_completo
            FROM public.expedientes_demandados ed2
            JOIN public.clientes c2 ON c2.id = ed2.id_cliente
            WHERE ed2.id_expediente = e.id
          ) p
        ), '') AS busqueda
      FROM public.expedientes e
      WHERE e.estado <> 'eliminado'
      ${filtroUsuario}
      ORDER BY e.id DESC;
    `;

    const result = await pgPool.query(query, params);
    res.json(result.rows);
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


// (postgres)
app.post("/clientes/agregar", async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      dni,
      telefono,
      direccion,
      fecha_nacimiento,
      email,
      estado,
      usuario_id,
      fecha_mediacion,
    } = req.body;

    if (!nombre || !apellido || !dni || !email) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
        camposRequeridos: ["nombre", "apellido", "dni", "email"],
      });
    }

    const nuevoId = await generarNuevoId(pgPool, "clientes", "id");

    const result = await pgPool.query(
      `
      INSERT INTO public.clientes
        (id, nombre, apellido, dni, telefono, direccion, fecha_nacimiento, email, estado, usuario_id, fecha_mediacion)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id
      `,
      [
        nuevoId,
        nombre,
        apellido,
        Number(dni),
        telefono ?? null,
        direccion ?? null,
        fecha_nacimiento || null, // si viene "" -> null
        email,
        estado ?? "en gestión",
        usuario_id ?? null,
        fecha_mediacion || null,
      ]
    );

    return res.status(201).json({
      message: "Cliente agregado exitosamente",
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error("Error al agregar cliente:", err);
    return res.status(500).json({
      error: "Error al agregar cliente",
      message: err.message,
    });
  }
});


/* Ruta para modificar cliente (posTgres)*/
app.put("/clientes/modificar/:id", async (req, res) => {
  const id = Number(req.params.id);
  const nuevosDatos = req.body;

  try {
    const result = await pgPool.query(
      `
      UPDATE public.clientes
      SET nombre = $1,
          apellido = $2,
          email = $3,
          telefono = $4,
          fecha_nacimiento = $5,
          dni = $6,
          estado = $7,
          direccion = $8,
          fecha_mediacion = $9
      WHERE id = $10
      `,
      [
        nuevosDatos.nombre ?? null,
        nuevosDatos.apellido ?? null,
        nuevosDatos.email ?? null,
        nuevosDatos.telefono ?? null,
        nuevosDatos.fecha_nacimiento || null,
        nuevosDatos.dni != null ? Number(nuevosDatos.dni) : null,
        nuevosDatos.estado ?? null,
        nuevosDatos.direccion ?? null,
        nuevosDatos.fecha_mediacion || null,
        id,
      ]
    );

    if (result.rowCount > 0) {
      return res.status(200).json({ mensaje: "Cliente actualizado correctamente" });
    }
    return res.status(404).json({ mensaje: "Cliente no encontrado" });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return res.status(500).json({ mensaje: "Error al actualizar cliente" });
  }
});


/* POSTGRES */
app.get("/expedientes/clientesPorExpediente/:id_expediente", async (req, res) => {
  const id_expediente = Number(req.params.id_expediente);
  if (!Number.isFinite(id_expediente)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const result = await pgPool.query(
      `
      SELECT c.*
      FROM public.clientes c
      JOIN public.clientes_expedientes ce ON c.id = ce.id_cliente
      WHERE ce.id_expediente = $1
      `,
      [id_expediente]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener clientes del expediente" });
  }
});

/* POSTGRES */ 
app.get("/expedientes/obtener/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const { rows } = await pgPool.query(
      `
      SELECT *
      FROM public.expedientes
      WHERE id = $1
        AND estado <> 'eliminado'
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Expediente no encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Error al obtener expediente:", err);
    return res.status(500).send("Error al obtener expediente");
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

/* POSTGRES */ 
app.get("/expedientes/demandadosPorExpediente/:id_expediente", async (req, res) => {
  const id_expediente = Number(req.params.id_expediente);
  if (!Number.isFinite(id_expediente)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const result = await pgPool.query(
      `
      SELECT DISTINCT d.*
      FROM public.demandados d
      JOIN public.expedientes_demandados ed ON d.id = ed.id_demandado
      WHERE ed.id_expediente = $1
      `,
      [id_expediente]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener demandados del expediente" });
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

async function recalcularCaratulaPg(pgPool, expedienteId) {
  // === ACTORAS ===
  const rsAct = await pgPool.query(
    `
    SELECT ce.id, ce.tipo,
           cli.nombre  AS c_nombre, cli.apellido AS c_apellido,
           emp.nombre  AS e_nombre
    FROM public.clientes_expedientes ce
    LEFT JOIN public.clientes   cli ON cli.id = ce.id_cliente
    LEFT JOIN public.demandados emp ON emp.id = ce.id_empresa
    WHERE ce.id_expediente = $1
    ORDER BY ce.id ASC
    `,
    [expedienteId]
  );

  const actoras = rsAct.rows.map(r => {
    const tipo = (r.tipo || "").toLowerCase();
    if (tipo === "cliente") {
      const nombre = (r.c_nombre || "").trim();
      const apellido = (r.c_apellido || "").trim();
      return (nombre || apellido) ? `${nombre} ${apellido}`.trim() : "Cliente";
    } else if (tipo === "empresa") {
      return (r.e_nombre || "").trim() || "Empresa";
    }
    return "(sin actora)";
  }).filter(Boolean);

  let actoraStr = "(sin actora)";
  if (actoras.length === 1) actoraStr = actoras[0];
  else if (actoras.length > 1) actoraStr = `${actoras[0]} y otros`;

  // === DEMANDADOS ===
  const rsDem = await pgPool.query(
    `
    SELECT ed.id, ed.tipo,
           cli.nombre  AS c_nombre, cli.apellido AS c_apellido,
           emp.nombre  AS e_nombre
    FROM public.expedientes_demandados ed
    LEFT JOIN public.clientes   cli ON cli.id = ed.id_cliente
    LEFT JOIN public.demandados emp ON emp.id = ed.id_demandado
    WHERE ed.id_expediente = $1
    ORDER BY ed.id ASC
    `,
    [expedienteId]
  );

  const demandados = rsDem.rows.map(r => {
    const tipo = (r.tipo || "").toLowerCase();
    if (tipo === "cliente") {
      const nombre = (r.c_nombre || "").trim();
      const apellido = (r.c_apellido || "").trim();
      return (nombre || apellido) ? `${nombre} ${apellido}`.trim() : "Cliente";
    } else if (tipo === "empresa") {
      return (r.e_nombre || "").trim() || "Empresa";
    }
    return "(sin demandado)";
  }).filter(Boolean);

  let demandadoStr = "(sin demandado)";
  if (demandados.length === 1) demandadoStr = demandados[0];
  else if (demandados.length > 1) demandadoStr = `${demandados[0]} y otros`;

  // === Materia ===
  const rsExp = await pgPool.query(
    `
    SELECT 
      e.juicio,
      e.titulo,
      j.descripcion AS codigo_descripcion,
      COALESCE(
        NULLIF(btrim(j.descripcion), ''),
        NULLIF(btrim(e.juicio), '')
      ) AS materia
    FROM public.expedientes e
    LEFT JOIN public.codigos j ON j.id = e.codigo_id
    WHERE e.id = $1
    `,
    [expedienteId]
  );

  const row = rsExp.rows[0] || {};
  const materia = (row.materia || "").toString().trim();
  const tituloActual = row.titulo ? row.titulo.toString().trim() : null;

  const caratula = materia
    ? `${actoraStr} c/ ${demandadoStr} s/ ${materia}`
    : `${actoraStr} c/ ${demandadoStr}`;

  const tituloNuevo = tituloActual ?? caratula;

  await pgPool.query(
    `
    UPDATE public.expedientes
       SET caratula = $1,
           titulo   = $2
     WHERE id = $3
    `,
    [caratula, tituloNuevo, expedienteId]
  );

  console.log(`Carátula recalculada: ${caratula}`);
  return caratula;
}

// postgres
app.post("/expedientes/agregar", async (req, res) => {
  const {
    titulo, descripcion, demandado_id, juzgado_id, numero, anio,
    usuario_id, estado, honorario, monto,
    fecha_inicio, juez_id, juicio, requiere_atencion, fecha_sentencia,
    numeroCliente, minutosSinLuz, periodoCorte,
    actoras, demandados, porcentaje, procurador_id
  } = req.body;

  if (!numero || !anio || !juzgado_id) {
    return res.status(400).json({
      error: "Faltan campos obligatorios",
      camposRequeridos: ["numero", "anio", "juzgado"]
    });
  }

  const client = await pgPool.connect();

  // Helper: nextval dentro de la misma tx
  const nextId = async (seqName) => {
    const { rows } = await client.query(
      `SELECT nextval($1::regclass) AS id`,
      [seqName]
    );
    return Number(rows[0].id);
  };

  try {
    await client.query("BEGIN");

    // 1) Tipo de juzgado
    const tipoJuz = await client.query(
      `SELECT tipo FROM public.juzgados WHERE id = $1`,
      [Number(juzgado_id)]
    );
    if (tipoJuz.rows.length === 0) throw new Error("No se encontró el tipo del juzgado especificado.");
    const tipoJ = tipoJuz.rows[0].tipo;

    // 2) Unicidad
    const existe = await client.query(
      `
      SELECT 1
      FROM public.expedientes e
      JOIN public.juzgados j ON e.juzgado_id = j.id
      WHERE e.numero = $1
        AND e.anio = $2
        AND j.tipo = $3
        AND e.estado <> 'eliminado'
      LIMIT 1
      `,
      [Number(numero), Number(anio), tipoJ]
    );

    if (existe.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Ya existe un expediente con el mismo número, año y juzgado." });
    }

    // 3) ID por sequence
    const expedienteId = await nextId("public.seq_expedientes");

    // 4) Insert expediente
    await client.query(
      `
      INSERT INTO public.expedientes (
        id, titulo, descripcion, numero, anio, demandado_id, juzgado_id,
        fecha_creacion, estado, fecha_inicio, honorario,
        juez_id, juicio, fecha_sentencia, ultimo_movimiento,
        monto, usuario_id, "numeroCliente", "minutosSinLuz", "periodoCorte",
        porcentaje, procurador_id, requiere_atencion
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        now(),$8,$9,$10,
        $11,$12,$13,$14,
        $15,$16,$17,$18,$19,
        $20,$21,$22
      )
      `,
      [
        expedienteId,
        (titulo ?? "").toString(),
        (descripcion ?? "").toString(),
        Number(numero),
        Number(anio),
        demandado_id ?? null,
        Number(juzgado_id),
        estado ?? null,
        fecha_inicio || null,
        honorario ?? null,
        juez_id ?? null,
        juicio ?? null,
        fecha_sentencia || null,
        fecha_inicio || null,
        monto ?? null,
        usuario_id ?? null,
        numeroCliente ?? null,
        minutosSinLuz ?? null,
        periodoCorte ?? null,
        porcentaje ?? null,
        procurador_id ?? null,
        !!requiere_atencion
      ]
    );

      // 5) ACTORAS
    if (Array.isArray(actoras)) {
      for (const a of actoras) {
        const tipoA = String(a?.tipo || "").toLowerCase().trim();
        const idA = a?.id !== undefined && a?.id !== null && a?.id !== ""
          ? Number(a.id)
          : null;

        if (!idA || Number.isNaN(idA) || (tipoA !== "cliente" && tipoA !== "empresa")) {
          throw new Error(`Actora inválida: ${JSON.stringify(a)}`);
        }

        const idRel = await nextId("public.seq_clientes_expedientes");

        await client.query(
          `
          INSERT INTO public.clientes_expedientes
            (id, id_expediente, id_cliente, id_empresa, tipo)
          VALUES
            ($1, $2,
            CASE WHEN $3 = 'cliente' THEN $4::int ELSE NULL END,
            CASE WHEN $3 = 'empresa' THEN $4::int ELSE NULL END,
            $3)
          `,
          [idRel, expedienteId, tipoA, idA]
        );
      }
    }

    // 6) DEMANDADOS
    if (Array.isArray(demandados)) {
      for (const d of demandados) {
        const tipoD = String(d?.tipo || "").toLowerCase().trim();
        const idD = d?.id !== undefined && d?.id !== null && d?.id !== ""
          ? Number(d.id)
          : null;

        if (!idD || Number.isNaN(idD) || (tipoD !== "cliente" && tipoD !== "empresa")) {
          throw new Error(`Demandado inválido: ${JSON.stringify(d)}`);
        }

        const idRel = await nextId("public.seq_expedientes_demandados");

        await client.query(
          `
          INSERT INTO public.expedientes_demandados
            (id, id_expediente, id_cliente, id_demandado, tipo)
          VALUES
            ($1, $2,
            CASE WHEN $3 = 'cliente' THEN $4::int ELSE NULL END,
            CASE WHEN $3 = 'empresa' THEN $4::int ELSE NULL END,
            $3)
          `,
          [idRel, expedienteId, tipoD, idD]
        );
      }
    }


    await client.query("COMMIT");

    // Recalcular carátula fuera de tx (ok)
    await recalcularCaratulaPg(pgPool, expedienteId);

    return res.status(201).json({
      message: "Expediente agregado correctamente",
      expedienteId
    });

  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("POST /expedientes/agregar ERROR =>", err);
    return res.status(500).json({
      error: "Error al agregar expediente",
      message: err?.message || String(err)
    });
  } finally {
    client.release();
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

app.put("/expedientes/modificar/:id", async (req, res) => {
  const expedienteIdNum = Number(req.params.id);
  const nuevosDatos = req.body;

  if (!Number.isInteger(expedienteIdNum) || expedienteIdNum <= 0) {
    return res.status(400).json({ mensaje: "ID inválido" });
  }

  // helpers
  const toNullIfEmpty = (v) => (v === "" || v === undefined ? null : v);
  const toIntOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
  const toFloatOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
  const toBool = (v) => !!v;

  const client = await pgPool.connect();

  try {
    await client.query("BEGIN");

    // =========================
    // 1) Unicidad nro/año/juzgado (excluyendo el propio)
    // =========================
    const existe = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM public.expedientes
      WHERE numero = $1::int
        AND anio = $2::int
        AND juzgado_id = $3::int
        AND id <> $4::int
        AND estado <> 'eliminado'
      `,
      [
        Number(nuevosDatos.numero),
        Number(nuevosDatos.anio),
        Number(nuevosDatos.juzgado_id),
        expedienteIdNum,
      ]
    );

    if ((existe.rows?.[0]?.count ?? 0) > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Ya existe un expediente con el mismo número, año y juzgado.",
      });
    }

    // =========================
    // 2) UPDATE expediente (gigante)
    // =========================
    const updateRes = await client.query(
      `
      UPDATE public.expedientes
      SET
        titulo = $1,
        descripcion = $2,
        numero = $3::int,
        anio = $4::int,
        juzgado_id = $5::int,
        estado = $6,
        juez_id = $7::int,
        honorario = $8,
        fecha_inicio = $9::timestamp,
        juicio = $10,
        fecha_sentencia = $11::timestamp,
        monto = $12::int,
        apela = $13::boolean,
        ultimo_movimiento = $14::timestamp,
        porcentaje = $15::double precision,
        usuario_id = $16::int,
        fecha_cobro = $17::timestamp,
        fecha_cobro_capital = $18::timestamp,
        procurador_id = $19::int,
        "valorUMA" = $20::int,
        sala = $21,
        requiere_atencion = $22::boolean,
        fecha_atencion = $23::date,

        -- Capital
        "estadoCapitalSeleccionado" = $24,
        "subEstadoCapitalSeleccionado" = $25,
        "fechaCapitalSubestado" = $26::timestamp,
        "estadoLiquidacionCapitalSeleccionado" = $27,
        "fechaLiquidacionCapital" = $28::timestamp,
        "montoLiquidacionCapital" = $29::double precision,
        "capitalCobrado" = $30::boolean,

        -- Honorarios
        "estadoHonorariosSeleccionado" = $31,
        "subEstadoHonorariosSeleccionado" = $32,
        "fechaHonorariosSubestado" = $33::timestamp,
        "estadoLiquidacionHonorariosSeleccionado" = $34,
        "fechaLiquidacionHonorarios" = $35::timestamp,
        "montoLiquidacionHonorarios" = $36::double precision,
        "honorarioCobrado" = $37::boolean,
        "cantidadUMA" = $38::double precision,

        -- Alzada
        "estadoHonorariosAlzadaSeleccionado" = $39,
        "subEstadoHonorariosAlzadaSeleccionado" = $40,
        "fechaHonorariosAlzada" = $41::timestamp,
        "umaSeleccionado_alzada" = $42::int,
        "cantidadUMA_alzada" = $43::double precision,
        "montoAcuerdo_alzada" = $44::double precision,
        "honorarioAlzadaCobrado" = $45::boolean,
        "fechaCobroAlzada" = $46::timestamp,

        -- Ejecución
        "estadoHonorariosEjecucionSeleccionado" = $47,
        "subEstadoHonorariosEjecucionSeleccionado" = $48,
        "fechaHonorariosEjecucion" = $49::timestamp,
        "montoHonorariosEjecucion" = $50::double precision,
        "honorarioEjecucionCobrado" = $51::boolean,
        "fechaCobroEjecucion" = $52::timestamp,
        "cantidadUMA_ejecucion" = $53::double precision,
        "umaSeleccionado_ejecucion" = $54::int,

        -- Diferencia
        "estadoHonorariosDiferenciaSeleccionado" = $55,
        "subEstadoHonorariosDiferenciaSeleccionado" = $56,
        "fechaHonorariosDiferencia" = $57::timestamp,
        "montoHonorariosDiferencia" = $58::double precision,
        "honorarioDiferenciaCobrado" = $59::boolean,
        "fechaCobroDiferencia" = $60::timestamp,

        "capitalPagoParcial" = $61::double precision,
        "esPagoParcial" = $62::boolean,
        codigo_id = $63::int

      WHERE id = $64::int
      `,
      [
        nuevosDatos.titulo ?? null,
        nuevosDatos.descripcion ?? null,
        Number(nuevosDatos.numero),
        Number(nuevosDatos.anio),
        Number(nuevosDatos.juzgado_id),
        nuevosDatos.estado ?? null,
        toIntOrNull(nuevosDatos.juez_id),
        nuevosDatos.honorario ?? null,
        toNullIfEmpty(nuevosDatos.fecha_inicio),
        nuevosDatos.juicio ?? null,
        toNullIfEmpty(nuevosDatos.fecha_sentencia),
        toIntOrNull(nuevosDatos.monto),
        toBool(nuevosDatos.apela),
        toNullIfEmpty(nuevosDatos.ultimo_movimiento),
        toFloatOrNull(nuevosDatos.porcentaje),
        toIntOrNull(nuevosDatos.usuario_id),
        toNullIfEmpty(nuevosDatos.fecha_cobro),
        toNullIfEmpty(nuevosDatos.fecha_cobro_capital),
        toIntOrNull(nuevosDatos.procurador_id),
        toIntOrNull(nuevosDatos.valorUMA),
        nuevosDatos.sala ?? null,
        toBool(nuevosDatos.requiere_atencion),
        toNullIfEmpty(nuevosDatos.fecha_atencion),

        // Capital
        nuevosDatos.estadoCapitalSeleccionado ?? null,
        nuevosDatos.subEstadoCapitalSeleccionado ?? null,
        toNullIfEmpty(nuevosDatos.fechaCapitalSubestado),
        nuevosDatos.estadoLiquidacionCapitalSeleccionado ?? null,
        toNullIfEmpty(nuevosDatos.fechaLiquidacionCapital),
        toFloatOrNull(nuevosDatos.montoLiquidacionCapital),
        toBool(nuevosDatos.capitalCobrado),

        // Honorarios
        nuevosDatos.estadoHonorariosSeleccionado ?? null,
        nuevosDatos.subEstadoHonorariosSeleccionado ?? null,
        toNullIfEmpty(nuevosDatos.fechaHonorariosSubestado),
        nuevosDatos.estadoLiquidacionHonorariosSeleccionado ?? null,
        toNullIfEmpty(nuevosDatos.fechaLiquidacionHonorarios),
        toFloatOrNull(nuevosDatos.montoLiquidacionHonorarios),
        toBool(nuevosDatos.honorarioCobrado),
        toFloatOrNull(nuevosDatos.cantidadUMA),

        // Alzada
        nuevosDatos.estadoHonorariosAlzadaSeleccionado ?? null,
        nuevosDatos.subEstadoHonorariosAlzadaSeleccionado ?? null,
        toNullIfEmpty(nuevosDatos.fechaHonorariosAlzada),
        toIntOrNull(nuevosDatos.umaSeleccionado_alzada),
        toFloatOrNull(nuevosDatos.cantidadUMA_alzada),
        toFloatOrNull(nuevosDatos.montoAcuerdo_alzada),
        toBool(nuevosDatos.honorarioAlzadaCobrado),
        toNullIfEmpty(nuevosDatos.fechaCobroAlzada),

        // Ejecución
        nuevosDatos.estadoHonorariosEjecucionSeleccionado ?? null,
        nuevosDatos.subEstadoHonorariosEjecucionSeleccionado ?? null,
        toNullIfEmpty(nuevosDatos.fechaHonorariosEjecucion),
        toFloatOrNull(nuevosDatos.montoHonorariosEjecucion),
        toBool(nuevosDatos.honorarioEjecucionCobrado),
        toNullIfEmpty(nuevosDatos.fechaCobroEjecucion),
        toFloatOrNull(nuevosDatos.cantidadUMA_ejecucion),
        toIntOrNull(nuevosDatos.umaSeleccionado_ejecucion),

        // Diferencia
        nuevosDatos.estadoHonorariosDiferenciaSeleccionado ?? null,
        nuevosDatos.subEstadoHonorariosDiferenciaSeleccionado ?? null,
        toNullIfEmpty(nuevosDatos.fechaHonorariosDiferencia),
        toFloatOrNull(nuevosDatos.montoHonorariosDiferencia),
        toBool(nuevosDatos.honorarioDiferenciaCobrado),
        toNullIfEmpty(nuevosDatos.fechaCobroDiferencia),

        toFloatOrNull(nuevosDatos.capitalPagoParcial),
        toBool(nuevosDatos.esPagoParcial),
        toIntOrNull(nuevosDatos.codigo_id),

        expedienteIdNum,
      ]
    );

    // =========================
    // 3) Reemplazo de relaciones + recalcular carátula
    // =========================
    if (nuevosDatos.recalcular_caratula === true) {
      // DEMANDADOS MIXTOS
      if (Array.isArray(nuevosDatos.demandados)) {
        await client.query(
          `DELETE FROM public.expedientes_demandados WHERE id_expediente = $1::int`,
          [expedienteIdNum]
        );

        for (const d of nuevosDatos.demandados) {
          const tipoD = String(d?.tipo || "").toLowerCase();
          const entidadId = d?.id != null && d?.id !== "" ? Number(d.id) : null;

          if (!entidadId || Number.isNaN(entidadId)) continue;
          if (tipoD !== "cliente" && tipoD !== "empresa") continue;

          const relacionId = await generarNuevoId(client, "expedientes_demandados", "id");

          await client.query(
            `
            INSERT INTO public.expedientes_demandados (id, id_expediente, id_cliente, id_demandado, tipo)
            VALUES (
              $1::int,
              $2::int,
              CASE WHEN $3::text = 'cliente' THEN $4::int ELSE NULL END,
              CASE WHEN $3::text = 'empresa' THEN $4::int ELSE NULL END,
              $3::text
            )
            `,
            [relacionId, expedienteIdNum, tipoD, entidadId]
          );
        }
      }

      // ACTORAS MIXTAS
      if (Array.isArray(nuevosDatos.actoras)) {
        await client.query(
          `DELETE FROM public.clientes_expedientes WHERE id_expediente = $1::int`,
          [expedienteIdNum]
        );

        for (const a of nuevosDatos.actoras) {
          const tipoA = String(a?.tipo || "").toLowerCase();
          const entidadId = a?.id != null && a?.id !== "" ? Number(a.id) : null;

          if (!entidadId || Number.isNaN(entidadId)) continue;
          if (tipoA !== "cliente" && tipoA !== "empresa") continue;

          const relacionId = await generarNuevoId(client, "clientes_expedientes", "id");

          await client.query(
            `
            INSERT INTO public.clientes_expedientes (id, id_expediente, id_cliente, id_empresa, tipo)
            VALUES (
              $1::int,
              $2::int,
              CASE WHEN $3::text = 'cliente' THEN $4::int ELSE NULL END,
              CASE WHEN $3::text = 'empresa' THEN $4::int ELSE NULL END,
              $3::text
            )
            `,
            [relacionId, expedienteIdNum, tipoA, entidadId]
          );
        }
      }

      // recalcular caratula (si tu función espera client, perfecto)
      await recalcularCaratulaPg(client, expedienteIdNum);
    }

    await client.query("COMMIT");
    client.release();

    if (updateRes.rowCount > 0) {
      return res.status(200).json({ mensaje: "Expediente actualizado correctamente" });
    }
    return res.status(404).json({ mensaje: "Expediente no encontrado" });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    client.release();
    console.error("Error al actualizar expediente:", error);
    return res.status(500).json({ mensaje: "Error al actualizar expediente", message: error.message });
  }
});



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

/* postgres */

app.put("/expedientes/eliminar/:id_expediente", async (req, res) => {
  const { id_expediente } = req.params;
  const idNum = Number(id_expediente);

  try {
    if (!id_expediente || !Number.isInteger(idNum) || idNum <= 0) {
      return res.status(400).json({
        error: "El ID del expediente es obligatorio y debe ser un número válido",
      });
    }

    const r = await pgPool.query(
      `
      UPDATE public.expedientes
      SET estado = 'eliminado'
      WHERE id = $1
      `,
      [idNum]
    );

    if ((r.rowCount || 0) > 0) {
      return res.status(200).json({ message: "Expediente eliminado correctamente" });
    } else {
      return res.status(404).json({ message: "Expediente no encontrado" });
    }
  } catch (err) {
    console.error("Error al eliminar expediente:", err.message);
    return res.status(500).json({
      error: "Error al eliminar expediente",
      message: err.message,
    });
  }
});


/* revisar */
app.put("/expedientes/eliminar/:id_expediente", async (req, res) => {
  const expedienteId = Number(req.params.id_expediente);

  try {
    if (!Number.isFinite(expedienteId)) {
      return res.status(400).json({
        error: "El ID del expediente es obligatorio y debe ser un número válido",
      });
    }

    const result = await pgPool.query(
      `
      UPDATE public.expedientes
      SET estado = 'eliminado'
      WHERE id = $1
      `,
      [expedienteId]
    );

    if (result.rowCount > 0) {
      return res.status(200).json({ message: "Expediente eliminado correctamente" });
    }
    return res.status(404).json({ message: "Expediente no encontrado" });
  } catch (err) {
    console.error("Error al eliminar expediente:", err);
    return res.status(500).json({
      error: "Error al eliminar expediente",
      message: err.message,
    });
  }
});




/*
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
});*/

// postgres
app.get("/demandados/buscar", async (req, res) => {
  const texto = String(req.query.texto || "").trim();

  try {
    const { rows } = await pgPool.query(
      `
      SELECT *
      FROM public.demandados
      WHERE nombre ILIKE $1
        AND estado <> 'eliminado'
      ORDER BY id DESC
      `,
      [`%${texto}%`]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener demandados:", err);
    return res.status(500).send("Error al obtener demandados");
  }
});


/*  postgres */
app.get("/juzgados/buscar", async (req, res) => {
  const texto = String(req.query.texto || "").trim();

  try {
    const { rows } = await pgPool.query(
      `
      SELECT *
      FROM public.juzgados
      WHERE nombre ILIKE $1
        AND estado <> 'eliminado'
      ORDER BY id DESC
      `,
      [`%${texto}%`]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener juzgados:", err);
    return res.status(500).send("Error al obtener juzgados");
  }
});



/* postgres */
app.post("/clientes-expedientes/agregar", async (req, res) => {
  try {
    const { cliente, expediente } = req.body;

    if (!cliente || !expediente) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
        camposRequeridos: ["cliente", "expediente"],
      });
    }

    const { rows } = await pgPool.query(
      `SELECT nextval('public.seq_clientes_expedientes'::regclass) AS id`
    );
    const idRel = Number(rows[0].id);

    await pgPool.query(
      `
      INSERT INTO public.clientes_expedientes (id, id_expediente, id_cliente, id_empresa, tipo)
      VALUES ($1, $2, $3, NULL, 'cliente')
      `,
      [idRel, Number(expediente), Number(cliente)]
    );

    return res.status(201).json({ message: "Relación cliente-expediente agregada exitosamente" });
  } catch (err) {
    console.error("Error al agregar relación clientes-expedientes:", err);
    return res.status(500).json({
      error: "Error al agregar relación clientes-expedientes",
      message: err.message,
    });
  }
});


/* agregar loclaidades postgres*/
app.post("/localidades/agregar", async (req, res) => {
  try {
    const { localidad, partido, provincia } = req.body;

    if (!localidad || !partido || !provincia) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
        camposRequeridos: ["localidad", "partido", "provincia"],
      });
    }

    // mantenemos TU mecanismo de ID
    const id = await generarNuevoId(pgPool, "localidades", "id");

    const { rows } = await pgPool.query(
      `
      INSERT INTO public.localidades (id, localidad, partido, provincia, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [id, localidad, partido, provincia, "activo"]
    );

    return res.status(201).json({
      message: "Localidad agregada exitosamente",
      id: rows[0].id,
    });
  } catch (err) {
    console.error("Error al agregar localidad:", err);
    return res.status(500).json({
      error: "Error al agregar localidad",
      message: err.message,
    });
  }
});


/* postgres */
/* postgres */
app.get("/localidades", async (req, res) => {
  try {
    const { rows } = await pgPool.query(`
      SELECT *
      FROM public."localidades"
      WHERE estado = 'activo'
      ORDER BY localidad
    `);
    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener localidades:", err);
    return res.status(500).json({ error: "Error al obtener localidades", message: err.message });
  }
});


/* postgres */
app.post("/juzgados/agregar", async (req, res) => {
  try {
    const { localidad_id, direccion, nombre, tipo } = req.body;

    if (!localidad_id) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
        camposRequeridos: ["localidad"],
      });
    }

    // mantenemos TU mecanismo de ID
    const id = await generarNuevoId(pgPool, "juzgados", "id");

    const { rows } = await pgPool.query(
      `
      INSERT INTO public.juzgados (id, nombre, estado, direccion, localidad_id, tipo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        id,
        nombre ?? null,
        "activo",
        direccion ?? null,
        Number(localidad_id),
        tipo ?? null,
      ]
    );

    return res.status(201).json({
      message: "Juzgado agregado exitosamente",
      id: rows[0].id,
    });
  } catch (err) {
    console.error("Error al agregar juzgado:", err);
    return res.status(500).json({
      error: "Error al agregar juzgado",
      message: err.message,
    });
  }
});



// =======================
//      JUZGADOS
// =======================
app.get("/juzgados", async (req, res) => {
  try {
    const { rows } = await pgPool.query(
      "SELECT * FROM public.juzgados WHERE estado <> 'eliminado'"
    );
    return res.json(rows);
  } catch (err) {
    console.error("Error /juzgados:", err);
    return res.status(500).json({ error: "Error al obtener juzgados", message: err.message });
  }
});

// =======================
//      PARTIDOS
// =======================
app.get("/localidades/partidos", async (req, res) => {
  try {
    // OJO: en MSSQL era "partido" (singular). En Postgres puede ser "partidos".
    // Si tu tabla realmente se llama "partido", dejalo así como está acá.
    const { rows } = await pgPool.query(
      'SELECT * FROM public.Partido ORDER BY nombre'
    );
    return res.json(rows);
  } catch (err) {
    console.error("Error /partidos:", err);
    return res.status(500).json({ error: "Error al obtener partidos", message: err.message });
  }
});

// =======================
//      DEMANDADOS
// =======================
app.get("/demandados", async (req, res) => {
  try {
    const { rows } = await pgPool.query(
      "SELECT * FROM public.demandados WHERE estado <> 'eliminado'"
    );
    return res.json(rows);
  } catch (err) {
    console.error("Error /demandados:", err);
    return res.status(500).json({ error: "Error al obtener demandados", message: err.message });
  }
});

// =======================
//   DEMANDADOS OFICIADOS
// =======================
app.get("/demandados/oficiados", async (req, res) => {
  try {
    // En MSSQL: esOficio = 1
    // En Postgres puede ser boolean (true/false) o int (0/1).
    // Te dejo ambas opciones; usá la que coincida con tu esquema.

    // Opción A: si es boolean
    // const { rows } = await pgPool.query(
    //   "SELECT * FROM public.demandados WHERE estado <> 'eliminado' AND esoficio = true"
    // );

    // Opción B: si es integer (0/1)
    const { rows } = await pgPool.query(`
      SELECT *
      FROM public.demandados
      WHERE estado <> 'eliminado'
        AND "esOficio" = 1
    `);


    return res.json(rows);
  } catch (err) {
    console.error("Error /demandados/oficiados:", err);
    return res.status(500).json({ error: "Error al obtener oficiados", message: err.message });
  }
});

// =======================
//  OBTENER DEMANDADO POR ID
// (tu ruta dice expedientes/demandados/:id pero en realidad trae demandado)
// =======================
app.get("/expedientes/demandados/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "El ID proporcionado no es válido" });
    }

    const { rows } = await pgPool.query(
      "SELECT * FROM public.demandados WHERE id = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Demandado no encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Error /expedientes/demandados/:id:", err);
    return res.status(500).json({ error: "Error al obtener demandado", message: err.message });
  }
});

// postgres
app.get("/demandados/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "El ID proporcionado no es válido" });
    }

    const { rows } = await pgPool.query(
      "SELECT * FROM public.demandados WHERE id = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Demandado no encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Error al obtener demandado:", err);
    return res.status(500).json({ error: "Error al obtener demandado", message: err.message });
  }
});



// postgres
app.post("/expedientes/agregarExpedienteClientes", async (req, res) => {
  try {
    console.error("Datos recibidos:", req.body);

    const { cliente, expediente } = req.body;

    if (!cliente || !expediente) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
        camposRequeridos: ["cliente", "expediente"],
      });
    }

    const id_cliente = Number(cliente);
    const id_expediente = Number(expediente);

    if (!Number.isInteger(id_cliente) || !Number.isInteger(id_expediente)) {
      return res.status(400).json({ error: "cliente/expediente inválidos" });
    }

    await pgPool.query(
      `
      INSERT INTO public.clientes_expedientes (id_cliente, id_expediente)
      VALUES ($1, $2)
      `,
      [id_cliente, id_expediente]
    );

    return res.status(201).json({
      message: "Relación cliente-expediente agregada exitosamente",
    });
  } catch (err) {
    console.error("Error al agregar relación cliente-expediente:", err);
    return res.status(500).json({
      error: "Error al agregar relación clientes-expedientes",
      message: err.message,
    });
  }
});

//postgres 
app.put("/localidades/modificar/:id", async (req, res) => {
  const id = Number(req.params.id);
  const nuevosDatos = req.body;

  try {
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const { rows, rowCount } = await pgPool.query(
      `
      UPDATE public.localidades
      SET localidad = $1,
          partido   = $2,
          provincia = $3,
          estado    = $4
      WHERE id = $5
      RETURNING id
      `,
      [
        nuevosDatos.localidad ?? null,
        nuevosDatos.partido ?? null,
        nuevosDatos.provincia ?? null,
        nuevosDatos.estado ?? null,
        id,
      ]
    );

    if (rowCount > 0) {
      return res.status(200).json({ mensaje: "Localidad actualizado correctamente", id: rows[0].id });
    } else {
      return res.status(404).json({ mensaje: "Localidad no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar localidad:", error);
    return res.status(500).json({ mensaje: "Error al actualizar localidad", message: error.message });
  }
});


// postgres
app.put("/juzgados/modificar/:id", async (req, res) => {
  const id = Number(req.params.id);
  const nuevosDatos = req.body;

  try {
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const { rows, rowCount } = await pgPool.query(
      `
      UPDATE public.juzgados
      SET localidad_id = $1,
          nombre       = $2,
          direccion    = $3,
          estado       = $4,
          tipo         = $5
      WHERE id = $6
      RETURNING id
      `,
      [
        nuevosDatos.localidad_id != null ? Number(nuevosDatos.localidad_id) : null,
        nuevosDatos.nombre ?? null,
        nuevosDatos.direccion ?? null,
        nuevosDatos.estado ?? null,
        nuevosDatos.tipo ?? null,
        id,
      ]
    );

    if (rowCount > 0) {
      return res.status(200).json({ mensaje: "Juzgado actualizado correctamente", id: rows[0].id });
    } else {
      return res.status(404).json({ mensaje: "Juzgado no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar juzgado:", error);
    return res.status(500).json({ mensaje: "Error al actualizar juzgado", message: error.message });
  }
});

// postgres
app.put("/demandados/modificar/:id", async (req, res) => {
  const id = Number(req.params.id);
  const nuevosDatos = req.body;

  try {
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const esOficioBool = !!nuevosDatos.esOficio;

    const { rows, rowCount } = await pgPool.query(
      `
      UPDATE public.demandados
      SET nombre       = $1,
          estado       = $2,
          localidad_id = $3,
          direccion    = $4,
          "esOficio"   = $5
      WHERE id = $6
      RETURNING id
      `,
      [
        nuevosDatos.nombre ?? null,
        nuevosDatos.estado ?? null,
        nuevosDatos.localidad_id != null ? Number(nuevosDatos.localidad_id) : null,
        nuevosDatos.direccion ?? null,
        esOficioBool,
        id,
      ]
    );

    if (rowCount > 0) {
      return res.status(200).json({ mensaje: "Demandado actualizado correctamente", id: rows[0].id });
    }
    return res.status(404).json({ mensaje: "Demandado no encontrado" });
  } catch (error) {
    console.error("Error al actualizar demandado:", error);
    return res.status(500).json({ mensaje: "Error al actualizar demandado", message: error.message });
  }
});

// POSTGRES
app.post("/demandados/agregar", async (req, res) => {
  try {
    const { nombre, estado, localidad_id, direccion, esOficio } = req.body;

    if (!nombre) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
        camposRequeridos: ["nombre"],
      });
    }

    const { rows: seq } = await pgPool.query(
      `SELECT nextval('public.seq_demandados'::regclass) AS id`
    );
    const id = Number(seq[0].id);

    const { rows } = await pgPool.query(
      `
      INSERT INTO public.demandados (id, nombre, estado, localidad_id, direccion, "esOficio")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        id,
        nombre,
        estado ?? "en gestión",
        localidad_id != null ? Number(localidad_id) : null,
        direccion ?? null,
        !!esOficio,
      ]
    );

    return res.status(201).json({
      message: "Demandado agregado exitosamente",
      id: rows[0].id,
    });
  } catch (err) {
    console.error("Error al agregar demandado:", err);
    return res.status(500).json({
      error: "Error al agregar demandado",
      message: err.message,
    });
  }
});

// postgres
app.get("/expedientes/demandados", async (req, res) => {
  const { id } = req.query;

  try {
    const demandadoId = Number(id);
    if (!Number.isInteger(demandadoId) || demandadoId <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { rows } = await pgPool.query(
      `
      SELECT *
      FROM public.expedientes
      WHERE demandado_id = $1
        AND estado <> 'eliminado'
      `,
      [demandadoId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener expedientes por demandado:", err);
    return res.status(500).json({ error: "Error al obtener los expedientes", message: err.message });
  }
});



////////////////
// postgres
app.get("/expedientes/juzgados", async (req, res) => {
  const { id } = req.query;

  try {
    const juzgadoId = Number(id);
    if (!Number.isInteger(juzgadoId) || juzgadoId <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { rows } = await pgPool.query(
      `
      SELECT *
      FROM public.expedientes
      WHERE juzgado_id = $1
        AND estado <> 'eliminado'
      `,
      [juzgadoId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener expedientes por juzgado:", err);
    return res.status(500).json({ error: "Error al obtener los expedientes", message: err.message });
  }
});


// postgres
app.get("/juzgados/localidades", async (req, res) => {
  const { id } = req.query;

  try {
    const localidadId = Number(id);
    if (!Number.isInteger(localidadId) || localidadId <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { rows } = await pgPool.query(
      `
      SELECT *
      FROM public.juzgados
      WHERE localidad_id = $1
        AND estado <> 'eliminado'
      `,
      [localidadId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener juzgados por localidad:", err);
    return res.status(500).json({ error: "Error al obtener los juzgados", message: err.message });
  }
});

// postgres
app.get("/expedientes/clientes", async (req, res) => {
  const { id } = req.query;

  try {
    const clienteId = Number(id);
    if (!Number.isInteger(clienteId) || clienteId <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { rows } = await pgPool.query(
      `
      SELECT e.*
      FROM public.clientes_expedientes ce
      JOIN public.expedientes e ON e.id = ce.id_expediente
      WHERE ce.id_cliente = $1
        AND e.estado <> 'eliminado'
      `,
      [clienteId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener expedientes por cliente:", err);
    return res.status(500).json({ error: "Error al obtener los clientes", message: err.message });
  }
});


// postgres
app.get("/expedientes/jueces", async (req, res) => {
  const { id } = req.query;

  try {
    const juezId = Number(id);
    if (!Number.isInteger(juezId) || juezId <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { rows } = await pgPool.query(
      `
      SELECT *
      FROM public.expedientes
      WHERE juez_id = $1
        AND estado <> 'eliminado'
      `,
      [juezId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener expedientes por juez:", err);
    return res.status(500).json({ error: "Error al obtener los expedientes", message: err.message });
  }
});


//postgres
app.get("/juez", async (req, res) => {
  try {
    const { rows } = await pgPool.query(
      "SELECT * FROM public.juez WHERE estado <> 'eliminado'"
    );
    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener jueces:", err);
    return res.status(500).json({ error: "Error al obtener jueces", message: err.message });
  }
});


   
// postgres
app.get("/expedientes/buscarPorNumeroAnioTipo", async (req, res) => {
  try {
    const { numero, anio, tipo, usuario_id, rol } = req.query;

    console.log("Busqueda realizada:", { numero, anio, tipo });

    const n = Number(numero);
    const a = Number(anio);
    const t = (tipo ?? "").toString().trim();

    if (!Number.isInteger(n) || !Number.isInteger(a) || !t) {
      return res.status(400).json({ error: "Se requieren 'numero', 'anio' y 'tipo' válidos." });
    }

    let query = `
      SELECT e.*
      FROM public.expedientes e
      JOIN public.juzgados j ON e.juzgado_id = j.id
      WHERE e.estado <> 'eliminado'
        AND e.numero = $1
        AND e.anio = $2
        AND j.tipo = $3
    `;

    const params = [n, a, t];

    if (rol !== "admin") {
      const u = Number(usuario_id);
      if (!Number.isInteger(u) || u <= 0) {
        return res.status(400).json({ error: "usuario_id inválido para rol no-admin." });
      }
      query += ` AND e.usuario_id = $4`;
      params.push(u);
    }

    const { rows } = await pgPool.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener expedientes:", err);
    return res.status(500).json({ error: "Error interno", message: err.message });
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

//postgres
app.get("/expedientes/estado", async (req, res) => {
  try {
    const estado = (req.query.estado ?? "").toString().trim();
    if (!estado) {
      return res.status(400).json({ error: "Se requiere estado." });
    }

    const { rows } = await pgPool.query(
      `
      SELECT *
      FROM public.expedientes
      WHERE estado = $1
      `,
      [estado]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener expedientes por estado:", err);
    return res.status(500).json({ error: "Error interno del servidor", message: err.message });
  }
});


/* postgres */
app.get("/expedientes/juzgados/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "El ID del juzgado debe ser un número válido." });
  }

  try {
    const { rows } = await pgPool.query(
      "SELECT * FROM public.juzgados WHERE id = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Juzgado no encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Error al obtener juzgado:", err);
    return res.status(500).json({ error: "Error al obtener juzgado", message: err.message });
  }
});


//postgres
app.get("/juzgados/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "El ID del juzgado debe ser un número válido." });
  }

  try {
    const { rows } = await pgPool.query(
      "SELECT * FROM public.juzgados WHERE id = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Juzgado no encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Error al obtener juzgado:", err);
    return res.status(500).json({ error: "Error al obtener juzgado", message: err.message });
  }
});


//TRAE LOS EVENTOS postgres
app.get("/eventos", async (req, res) => {
  try {
    const { rows } = await pgPool.query(
      `
      SELECT
        e.*,
        COALESCE(
          (
            SELECT json_agg(c.*)
            FROM public.clientes_eventos ce
            JOIN public.clientes c ON c.id = ce.id_cliente
            WHERE ce.id_evento = e.id
              AND c.id IS NOT NULL
          ),
          '[]'::json
        ) AS clientes
      FROM public.eventos_calendario e
      WHERE e.estado <> 'eliminado'
      ORDER BY e.fecha_evento DESC, e.id DESC;

      `
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener eventos:", err);
    return res.status(500).json({ error: "Error al obtener eventos", message: err.message });
  }
});




// postgres
app.post('/eventos/agregar', async (req, res) => {
  try {
    const {
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

    if (!fecha_evento || !tipo_evento) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        camposRequeridos: ['fecha_evento', 'tipo_evento']
      });
    }

    const id = await generarNuevoId(pgPool, 'eventos_calendario', 'id');

    const { rows } = await pgPool.query(
      `
      INSERT INTO public.eventos_calendario (
        id,
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id
      `,
      [
        id,
        descripcion ?? null,
        new Date(fecha_evento),
        hora_evento ?? null,
        tipo_evento,
        ubicacion ?? null,
        mediacion_id ?? null,
        expediente_id ?? null,
        link_virtual ?? null,
        'En curso'
      ]
    );

    const eventoId = rows[0].id;

    for (const cliente of clientes) {
      const relId = await generarNuevoId(pgPool, 'clientes_eventos', 'id');

      await pgPool.query(
        `
        INSERT INTO public.clientes_eventos (id, id_evento, id_cliente)
        VALUES ($1, $2, $3)
        `,
        [relId, eventoId, cliente.id]
      );
    }

    return res.status(201).json({
      message: 'Evento agregado exitosamente',
      id: eventoId
    });

  } catch (err) {
    console.error('Error al agregar evento:', err);
    return res.status(500).json({
      error: 'Error al agregar evento',
      message: err.message
    });
  }
});




// postgres
app.post("/juez/agregar", async (req, res) => {
  try {
    const { nombre, apellido, estado } = req.body;

    if (!nombre || !apellido || !estado) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
        camposRequeridos: ["nombre", "apellido", "estado"],
      });
    }

    // OJO: acá era mediaciones, lo correcto es juez
    const nuevoId = await generarNuevoId(pgPool, "juez", "id");

    const { rows } = await pgPool.query(
      `
      INSERT INTO public.juez (id, nombre, apellido, estado)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [nuevoId, nombre, apellido, estado]
    );

    return res.status(201).json({
      message: "Juez agregado exitosamente",
      id: rows[0].id,
    });
  } catch (err) {
    console.error("Error al agregar juez:", err);
    return res.status(500).json({
      error: "Error al agregar juez",
      message: err.message,
    });
  }
});


// postgres
app.put("/juez/modificar/:id", async (req, res) => {
  const id = Number(req.params.id);
  const nuevosDatos = req.body;

  try {
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const { rowCount } = await pgPool.query(
      `
      UPDATE public.juez
      SET nombre = $1,
          apellido = $2,
          estado = $3
      WHERE id = $4
      `,
      [
        nuevosDatos.nombre ?? null,
        nuevosDatos.apellido ?? null,
        nuevosDatos.estado ?? null,
        id,
      ]
    );

    if (rowCount > 0) {
      return res.status(200).json({ mensaje: "Juez actualizado correctamente" });
    } else {
      return res.status(404).json({ mensaje: "Juez no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar juez:", error);
    return res.status(500).json({ mensaje: "Error al actualizar juez", message: error.message });
  }
});

// postgres
app.get("/juzgados/BuscarPorTipo", async (req, res) => {
  const tipo = (req.query.tipo ?? "").toString().trim();

  if (!tipo) {
    return res.status(400).json({ error: "Falta el parámetro 'tipo'" });
  }

  try {
    const { rows } = await pgPool.query(
      `
      SELECT *
      FROM public.juzgados
      WHERE estado <> 'eliminado'
        AND tipo = $1
      `,
      [tipo]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener juzgados:", err);
    return res.status(500).json({ error: "Error al obtener juzgados", message: err.message });
  }
});


// postgres
app.get("/clientes/expedientesPorCliente", async (req, res) => {
  const raw = req.query.id;
  const id = Number(String(raw ?? "").trim());

  if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "id inválido", raw });
  }

  try {
    const { rows } = await pgPool.query(
      `
      SELECT e.id, e.numero, e.anio, e.estado, e.fecha_creacion, e.monto, e.juzgado_id
      FROM public.clientes_expedientes ce
      JOIN public.expedientes e ON ce.id_expediente = e.id
      WHERE ce.id_cliente = $1
        AND e.estado <> 'eliminado'
      `,
      [id]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener expedientes del cliente:", err);
    return res.status(500).json({ error: "Error al obtener los expedientes", message: err.message });
  }
});



// postgres
app.get("/expedientes/cobrados", async (req, res) => {
  try {
    const { rows } = await pgPool.query(`
      SELECT *
      FROM public.expedientes
      WHERE estado <> 'eliminado'
        AND (
          estado = 'Archivo'
          OR "capitalCobrado" IS TRUE
          OR "esPagoParcial" IS TRUE
          OR "honorarioCobrado" IS TRUE
          OR "honorarioAlzadaCobrado" IS TRUE
          OR "honorarioEjecucionCobrado" IS TRUE
          OR "honorarioDiferenciaCobrado" IS TRUE
        )
    `);

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener expedientes cobrados:", err);
    return res.status(500).json({ error: "Error interno del servidor", message: err.message });
  }
});



// postgres
app.get("/expedientes/vencimiento", async (req, res) => {
  const juicio = (req.query.juicio ?? "").toString().trim();

  if (juicio !== "ordinario" && juicio !== "sumarismo") {
    return res
      .status(400)
      .send("Parámetro 'juicio' inválido. Debe ser 'ordinario' o 'sumarismo'.");
  }

  const diasLimite = juicio === "ordinario" ? 160 : 70;

  try {
    const { rows } = await pgPool.query(
      `
      SELECT *
      FROM public.expedientes
      WHERE juicio = $1
        AND (now() - ultimo_movimiento) <= ($2 || ' days')::interval
        AND estado <> 'eliminado'
      `,
      [juicio, diasLimite]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener expedientes por vencimiento:", err);
    return res.status(500).json({ error: "Error al obtener expedientes por vencimiento", message: err.message });
  }
});

// postgres
app.post("/mediaciones", async (req, res) => {
  try {
    const {
      numero,
      abogado_id,
      cliente_id,
      demandado_id,
      fecha,
      mediadora,
      finalizada,
    } = req.body;

    const id = await generarNuevoId(pgPool, "mediaciones", "id");

    const { rows } = await pgPool.query(
      `
      INSERT INTO public.mediaciones
        (id, numero, abogado_id, cliente_id, demandado_id, fecha, mediadora, finalizada)
      VALUES
        ($1,  $2,     $3,        $4,        $5,          $6,    $7,       $8)
      RETURNING id
      `,
      [
        id,
        numero ?? null,
        abogado_id != null ? Number(abogado_id) : null,
        cliente_id != null ? Number(cliente_id) : null,
        demandado_id != null ? Number(demandado_id) : null,
        fecha ? new Date(fecha) : null,      // antes mandabas null siempre
        mediadora ?? null,
        Boolean(finalizada),
      ]
    );

    return res.status(201).json({ id: rows[0].id });
  } catch (error) {
    console.error("Error al crear mediación:", error);
    return res.status(500).json({ error: "Error al crear mediación", detalle: error.message });
  }
});

// postgres
app.get("/mediaciones/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { rows } = await pgPool.query(
      `SELECT * FROM public.mediaciones WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Mediación no encontrada" });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener mediación por ID:", error);
    return res.status(500).json({ error: "Error interno al buscar la mediación" });
  }
});

// postgres
app.put("/eventos/editar/:id", async (req, res) => {
  const id = Number(req.params.id);
  const e = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE public.eventos_calendario SET
        descripcion   = $2,
        fecha_evento  = $3,
        tipo_evento   = $4,
        ubicacion     = $5,
        estado        = $6,
        mediacion_id  = $7,
        link_virtual  = $8,
        expediente_id = $9
      WHERE id = $10
      `,
      [
        e.descripcion ?? null,
        e.fecha_evento ? new Date(e.fecha_evento) : null,
        e.tipo_evento ?? null,
        e.ubicacion ?? null,
        e.estado ?? null,
        e.mediacion_id != null ? Number(e.mediacion_id) : null,
        e.link_virtual ?? null,
        e.expediente_id != null ? Number(e.expediente_id) : null,
        id,
      ]
    );

    await client.query(
      `DELETE FROM public.clientes_eventos WHERE id_evento = $1`,
      [id]
    );

    for (const c of (e.clientes || [])) {
      const clienteId = Number(c?.id);
      if (!Number.isInteger(clienteId) || clienteId <= 0) continue;

      // Si tu clientes_eventos tiene (id_evento,id_cliente) como PK y NO tiene id, esto está perfecto.
      // Si tiene id obligatorio, decime y lo adapto usando generarNuevoId.
      await client.query(
        `
        INSERT INTO public.clientes_eventos (id_evento, id_cliente)
        VALUES ($1, $2)
        `,
        [id, clienteId]
      );
    }

    await client.query("COMMIT");
    return res.send({ message: "Evento actualizado con éxito" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error actualizando evento:", err);
    return res.status(500).json({ error: "Error actualizando evento", message: err.message });
  } finally {
    client.release();
  }
});





// postgres
app.put("/eventos/eliminar/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    await pgPool.query(
      `
      UPDATE public.eventos_calendario
      SET estado = 'eliminado'
      WHERE id = $1
      `,
      [id]
    );

    return res.status(200).json({ message: "Evento marcado como eliminado" });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return res.status(500).json({ error: "Error al eliminar evento", message: error.message });
  }
});


//postgres
app.post("/oficios/agregar", async (req, res) => {
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
      supletoria,
    } = req.body;

    if (!expediente_id || !parte || !estado || !tipo) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
        camposRequeridos: ["expediente_id", "parte", "estado", "tipo"],
      });
    }

    const tipoNorm = String(tipo).toLowerCase().trim();
    if (!["oficio", "testimonial", "pericia"].includes(tipoNorm)) {
      return res.status(400).json({ error: "Tipo inválido. Use: oficio | testimonial | pericia" });
    }

    if (tipoNorm === "oficio") {
      if (!demandado_id) return res.status(400).json({ error: 'Para tipo "oficio", demandado_id es obligatorio' });
    } else if (tipoNorm === "testimonial") {
      if (!nombre_oficiada || String(nombre_oficiada).trim() === "") {
        return res.status(400).json({ error: 'Para tipo "testimonial", nombre_oficiada (testigo) es obligatorio' });
      }
    } else if (tipoNorm === "pericia") {
      if (!nombre_oficiada || String(nombre_oficiada).trim() === "") {
        return res.status(400).json({ error: 'Para tipo "pericia", nombre_oficiada (perito) es obligatorio' });
      }
      const tp = String(tipo_pericia || "").toLowerCase().trim();
      if (!["pericial informática", "pericial informatica","pericial contable", "pericial caligrafica", "pericial telecomunicaciones"].includes(tp)) {
        return res.status(400).json({ error: 'tipo_pericia inválido. Solo "Pericial informática".' });
      }
    }

    const id = await generarNuevoId(pgPool, "oficios", "id");

    const { rows } = await pgPool.query(
      `
      INSERT INTO public.oficios (
        id, expediente_id, demandado_id, parte, estado, fecha_diligenciado,
        tipo, nombre_oficiada, tipo_pericia, supletoria
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10
      )
      RETURNING id
      `,
      [
        id,
        Number(expediente_id),
        demandado_id != null ? Number(demandado_id) : null,
        parte,
        estado,
        fecha_diligenciado ? new Date(fecha_diligenciado) : null,
        tipoNorm,
        nombre_oficiada ?? null,
        tipoNorm === "pericia" ? (tipo_pericia ?? null) : null,
        tipoNorm === "testimonial" ? (supletoria ? new Date(supletoria) : null) : null,
      ]
    );

    return res.status(201).json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("Error al agregar prueba:", err);
    return res.status(500).json({ error: "Error al agregar prueba", message: err.message });
  }
});


// postgres
app.get("/oficios", async (req, res) => {
  try {
    const { rows } = await pgPool.query(
      "SELECT * FROM public.oficios WHERE estado <> 'eliminado'"
    );
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error al obtener oficios:", err);
    return res.status(500).json({ error: "Error al obtener oficios", message: err.message });
  }
});

// postgres
app.put("/oficios/modificar/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { expediente_id, demandado_id, parte, estado, fecha_diligenciado } = req.body;

  try {
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const { rowCount } = await pgPool.query(
      `
      UPDATE public.oficios
      SET expediente_id = $1,
          demandado_id = $2,
          parte = $3,
          estado = $4,
          fecha_diligenciado = $5
      WHERE id = $6
      `,
      [
        expediente_id != null ? Number(expediente_id) : null,
        demandado_id != null ? Number(demandado_id) : null,
        parte ?? null,
        estado ?? null,
        fecha_diligenciado ? new Date(fecha_diligenciado) : null,
        id,
      ]
    );

    if (rowCount > 0) {
      return res.status(200).json({ mensaje: "Oficio actualizado correctamente" });
    } else {
      return res.status(404).json({ mensaje: "Oficio no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar oficio:", error);
    return res.status(500).json({ mensaje: "Error al actualizar oficio", message: error.message });
  }
});

// postgres
app.get("/expedientes/total-cobranzas-por-mes", async (req, res) => {
  const { anio, mes, usuario_id } = req.query;
  if (!anio || !mes) return res.status(400).send("Debe enviar 'anio' y 'mes'");

  //console.log(usuario_id);
  const y = parseInt(anio, 10);
  const m = parseInt(mes, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12)
    return res.status(400).send("Parámetros inválidos. 'mes' debe ser 1..12.");

  const usuarioId = Number(usuario_id);
  if (!Number.isFinite(usuarioId) || usuarioId <= 0) {
    return res.status(400).send("Falta usuario_id válido");
  }

  const inicio = new Date(Date.UTC(y, m - 1, 1));
  const fin    = new Date(Date.UTC(y, m, 1));
  const inicioStr = inicio.toISOString().slice(0, 10);
  const finStr    = fin.toISOString().slice(0, 10);

  try {
    const { rows } = await pgPool.query(
      `
  WITH U AS (
  SELECT DISTINCT ON (id)
    id,
    COALESCE(porcentaje, 0)::numeric AS p
  FROM public.usuario
  ORDER BY id
),
movimientos AS (

  -- CAPITAL NO PARCIAL (incluye viejos flag=true pero sin filas en pagos)
  SELECT
    'capital' AS concepto,
    COALESCE(e."capitalPagoParcial", 0)::numeric
    * (COALESCE(e.porcentaje, 100)::numeric / 100.0)
    *
    CASE
      WHEN e.usuario_id = 7 THEN
        CASE WHEN $3 = 7 THEN 1.0 ELSE 0.0 END
      ELSE
        CASE
          WHEN $3 = e.usuario_id THEN (COALESCE(u.p, 0) / 100.0)
          WHEN $3 = 7           THEN ((100 - COALESCE(u.p, 0)) / 100.0)
          ELSE 0.0
        END
    END AS monto
  FROM public.expedientes e
  LEFT JOIN U u ON u.id = e.usuario_id
  WHERE e.estado <> 'eliminado'
    AND (
      COALESCE(e."esPagoParcial", false) = false
      OR NOT EXISTS (SELECT 1 FROM public.pagos pc WHERE pc.expediente_id = e.id)
    )
    AND e."fecha_cobro_capital"::date >= $1::date
    AND e."fecha_cobro_capital"::date <  $2::date

  UNION ALL

  -- CAPITAL PARCIAL REAL (suma pagos del mes)
  SELECT
    'capital' AS concepto,
    SUM(
      COALESCE(pc.monto, 0)::numeric
      * (COALESCE(e.porcentaje, 100)::numeric / 100.0)
      *
      CASE
        WHEN e.usuario_id = 7 THEN
          CASE WHEN $3 = 7 THEN 1.0 ELSE 0.0 END
        ELSE
          CASE
            WHEN $3 = e.usuario_id THEN (COALESCE(u.p, 0) / 100.0)
            WHEN $3 = 7           THEN ((100 - COALESCE(u.p, 0)) / 100.0)
            ELSE 0.0
          END
      END
    ) AS monto
  FROM public.expedientes e
  JOIN public.pagos pc ON pc.expediente_id = e.id
  LEFT JOIN U u ON u.id = e.usuario_id
  WHERE e.estado <> 'eliminado'
    AND COALESCE(e."esPagoParcial", false) = true
    AND pc.fecha >= $1::date
    AND pc.fecha <  $2::date
  GROUP BY e.usuario_id, u.p, e.porcentaje

  UNION ALL

  -- HONORARIOS (sin e.porcentaje, como venías)
  SELECT
    'honorarios' AS concepto,
    COALESCE(e."montoLiquidacionHonorarios", 0)::numeric
    *
    CASE
      WHEN e.usuario_id = 7 THEN
        CASE WHEN $3 = 7 THEN 1.0 ELSE 0.0 END
      ELSE
        CASE
          WHEN $3 = e.usuario_id THEN (COALESCE(u.p, 0) / 100.0)
          WHEN $3 = 7           THEN ((100 - COALESCE(u.p, 0)) / 100.0)
          ELSE 0.0
        END
    END AS monto
  FROM public.expedientes e
  LEFT JOIN U u ON u.id = e.usuario_id
  WHERE e.estado <> 'eliminado'
    AND e."fecha_cobro"::date >= $1::date
    AND e."fecha_cobro"::date <  $2::date

  UNION ALL

  -- ALZADA
  SELECT
    'alzada' AS concepto,
    COALESCE(e."montoAcuerdo_alzada", 0)::numeric
    *
    CASE
      WHEN e.usuario_id = 7 THEN
        CASE WHEN $3 = 7 THEN 1.0 ELSE 0.0 END
      ELSE
        CASE
          WHEN $3 = e.usuario_id THEN (COALESCE(u.p, 0) / 100.0)
          WHEN $3 = 7           THEN ((100 - COALESCE(u.p, 0)) / 100.0)
          ELSE 0.0
        END
    END AS monto
  FROM public.expedientes e
  LEFT JOIN U u ON u.id = e.usuario_id
  WHERE e.estado <> 'eliminado'
    AND e."fechaCobroAlzada"::date >= $1::date
    AND e."fechaCobroAlzada"::date <  $2::date

  UNION ALL

  -- EJECUCION
  SELECT
    'ejecucion' AS concepto,
    COALESCE(e."montoHonorariosEjecucion", 0)::numeric
    *
    CASE
      WHEN e.usuario_id = 7 THEN
        CASE WHEN $3 = 7 THEN 1.0 ELSE 0.0 END
      ELSE
        CASE
          WHEN $3 = e.usuario_id THEN (COALESCE(u.p, 0) / 100.0)
          WHEN $3 = 7           THEN ((100 - COALESCE(u.p, 0)) / 100.0)
          ELSE 0.0
        END
    END AS monto
  FROM public.expedientes e
  LEFT JOIN U u ON u.id = e.usuario_id
  WHERE e.estado <> 'eliminado'
    AND e."fechaCobroEjecucion"::date >= $1::date
    AND e."fechaCobroEjecucion"::date <  $2::date

  UNION ALL

  -- DIFERENCIA
  SELECT
    'diferencia' AS concepto,
    COALESCE(e."montoHonorariosDiferencia", 0)::numeric
    *
    CASE
      WHEN e.usuario_id = 7 THEN
        CASE WHEN $3 = 7 THEN 1.0 ELSE 0.0 END
      ELSE
        CASE
          WHEN $3 = e.usuario_id THEN (COALESCE(u.p, 0) / 100.0)
          WHEN $3 = 7           THEN ((100 - COALESCE(u.p, 0)) / 100.0)
          ELSE 0.0
        END
    END AS monto
  FROM public.expedientes e
  LEFT JOIN U u ON u.id = e.usuario_id
  WHERE e.estado <> 'eliminado'
    AND e."fechaCobroDiferencia"::date >= $1::date
    AND e."fechaCobroDiferencia"::date <  $2::date
)
SELECT
  COALESCE(SUM(CASE WHEN concepto = 'capital'    THEN monto ELSE 0 END), 0) AS "totalCapital",
  COALESCE(SUM(CASE WHEN concepto = 'honorarios' THEN monto ELSE 0 END), 0) AS "totalHonorarios",
  COALESCE(SUM(CASE WHEN concepto = 'alzada'     THEN monto ELSE 0 END), 0) AS "totalAlzada",
  COALESCE(SUM(CASE WHEN concepto = 'ejecucion'  THEN monto ELSE 0 END), 0) AS "totalEjecucion",
  COALESCE(SUM(CASE WHEN concepto = 'diferencia' THEN monto ELSE 0 END), 0) AS "totalDiferencia",
  COALESCE(SUM(monto), 0) AS "totalGeneral"
FROM movimientos;

      `,
      [inicioStr, finStr, usuarioId] // ✅ 3 parámetros
    );

    return res.json(rows?.[0] ?? {
      totalCapital: 0,
      totalHonorarios: 0,
      totalAlzada: 0,
      totalEjecucion: 0,
      totalDiferencia: 0,
      totalGeneral: 0
    });
  } catch (error) {
    console.error("Error al obtener total de cobranzas por mes:", error);
    return res.status(500).send("Error en el servidor");
  }
});


// ==========================================================
// GET /expedientes/cobranzas-detalle-por-mes?anio=YYYY&mes=MM postgres
// ==========================================================
app.get("/expedientes/cobranzas-detalle-por-mes", async (req, res) => {
  const { anio, mes, usuario_id } = req.query;
  if (!anio || !mes) return res.status(400).send("Debe enviar 'anio' y 'mes'");

  const y = parseInt(anio, 10);
  const m = parseInt(mes, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
    return res.status(400).send("Parámetros inválidos.");
  }

  const usuarioId = Number(usuario_id);
  if (!Number.isFinite(usuarioId) || usuarioId <= 0) {
    return res.status(400).send("Falta usuario_id válido");
  }

  const inicio = new Date(Date.UTC(y, m - 1, 1));
  const fin    = new Date(Date.UTC(y, m, 1));
  const inicioStr = inicio.toISOString().slice(0, 10);
  const finStr    = fin.toISOString().slice(0, 10);

  try {
    const { rows } = await pgPool.query(
      `
WITH rangos AS (
  SELECT
    $1::date AS inicio,
    $2::date AS fin,
    $3::int  AS uid
),
U AS (
  SELECT DISTINCT ON (id)
    id,
    COALESCE(porcentaje, 0)::numeric AS p
  FROM public.usuario
  ORDER BY id
),
capital_mes AS (
  -- NO PARCIAL (incluye viejos flag=true pero sin filas en pagos)
  SELECT
    e.id AS expediente_id,
    COALESCE(e."capitalPagoParcial", 0)::numeric AS cobrado_mes
  FROM public.expedientes e
  WHERE e.estado <> 'eliminado'
    AND (
      COALESCE(e."esPagoParcial", false) = false
      OR NOT EXISTS (SELECT 1 FROM public.pagos p WHERE p.expediente_id = e.id)
    )
    AND e."fecha_cobro_capital"::date >= (SELECT inicio FROM rangos)
    AND e."fecha_cobro_capital"::date <  (SELECT fin FROM rangos)

  UNION ALL

  -- PARCIAL REAL (suma pagos del mes)
  SELECT
    e.id AS expediente_id,
    SUM(COALESCE(p.monto, 0))::numeric AS cobrado_mes
  FROM public.expedientes e
  JOIN public.pagos p ON p.expediente_id = e.id
  WHERE e.estado <> 'eliminado'
    AND COALESCE(e."esPagoParcial", false) = true
    AND p.fecha >= (SELECT inicio FROM rangos)
    AND p.fecha <  (SELECT fin FROM rangos)
  GROUP BY e.id
),
movimientos AS (

  /* =========================
     CAPITAL (desde capital_mes)
     ========================= */
  SELECT
    e.id AS expediente_id,
    e.numero,
    e.anio AS anio_expediente,
    e.caratula,
    'capital'::text AS concepto,
    SUM(
      cm.cobrado_mes
      * (COALESCE(e.porcentaje, 100)::numeric / 100.0)   -- ✅ tu corrección
      *
      CASE
        WHEN e.usuario_id = 7 THEN
          CASE WHEN (SELECT uid FROM rangos) = 7 THEN 1.0 ELSE 0.0 END
        ELSE
          CASE
            WHEN (SELECT uid FROM rangos) = e.usuario_id THEN (COALESCE(u.p, 0) / 100.0)
            WHEN (SELECT uid FROM rangos) = 7           THEN ((100 - COALESCE(u.p, 0)) / 100.0)
            ELSE 0.0
          END
      END
    ) AS monto
  FROM public.expedientes e
  JOIN capital_mes cm ON cm.expediente_id = e.id
  LEFT JOIN U u ON u.id = e.usuario_id
  WHERE e.estado <> 'eliminado'
  GROUP BY e.id, e.numero, e.anio, e.caratula

  UNION ALL

  /* =========================
     HONORARIOS (como estaba)
     ========================= */
  SELECT
    e.id, e.numero, e.anio, e.caratula,
    'honorarios'::text AS concepto,
    COALESCE(e."montoLiquidacionHonorarios", 0)::numeric
    *
    CASE
      WHEN e.usuario_id = 7 THEN
        CASE WHEN (SELECT uid FROM rangos) = 7 THEN 1.0 ELSE 0.0 END
      ELSE
        CASE
          WHEN (SELECT uid FROM rangos) = e.usuario_id THEN (COALESCE(u.p, 0) / 100.0)
          WHEN (SELECT uid FROM rangos) = 7           THEN ((100 - COALESCE(u.p, 0)) / 100.0)
          ELSE 0.0
        END
    END AS monto
  FROM public.expedientes e
  LEFT JOIN U u ON u.id = e.usuario_id
  WHERE e.estado <> 'eliminado'
    AND e."fecha_cobro"::date >= (SELECT inicio FROM rangos)
    AND e."fecha_cobro"::date <  (SELECT fin FROM rangos)

  UNION ALL

  /* =========================
     ALZADA (como estaba)
     ========================= */
  SELECT
    e.id, e.numero, e.anio, e.caratula,
    'alzada'::text AS concepto,
    COALESCE(e."montoAcuerdo_alzada", 0)::numeric
    *
    CASE
      WHEN e.usuario_id = 7 THEN
        CASE WHEN (SELECT uid FROM rangos) = 7 THEN 1.0 ELSE 0.0 END
      ELSE
        CASE
          WHEN (SELECT uid FROM rangos) = e.usuario_id THEN (COALESCE(u.p, 0) / 100.0)
          WHEN (SELECT uid FROM rangos) = 7           THEN ((100 - COALESCE(u.p, 0)) / 100.0)
          ELSE 0.0
        END
    END AS monto
  FROM public.expedientes e
  LEFT JOIN U u ON u.id = e.usuario_id
  WHERE e.estado <> 'eliminado'
    AND e."fechaCobroAlzada"::date >= (SELECT inicio FROM rangos)
    AND e."fechaCobroAlzada"::date <  (SELECT fin FROM rangos)

  UNION ALL

  /* =========================
     EJECUCION (como estaba)
     ========================= */
  SELECT
    e.id, e.numero, e.anio, e.caratula,
    'ejecucion'::text AS concepto,
    COALESCE(e."montoHonorariosEjecucion", 0)::numeric
    *
    CASE
      WHEN e.usuario_id = 7 THEN
        CASE WHEN (SELECT uid FROM rangos) = 7 THEN 1.0 ELSE 0.0 END
      ELSE
        CASE
          WHEN (SELECT uid FROM rangos) = e.usuario_id THEN (COALESCE(u.p, 0) / 100.0)
          WHEN (SELECT uid FROM rangos) = 7           THEN ((100 - COALESCE(u.p, 0)) / 100.0)
          ELSE 0.0
        END
    END AS monto
  FROM public.expedientes e
  LEFT JOIN U u ON u.id = e.usuario_id
  WHERE e.estado <> 'eliminado'
    AND e."fechaCobroEjecucion"::date >= (SELECT inicio FROM rangos)
    AND e."fechaCobroEjecucion"::date <  (SELECT fin FROM rangos)

  UNION ALL

  /* =========================
     DIFERENCIA (como estaba)
     ========================= */
  SELECT
    e.id, e.numero, e.anio, e.caratula,
    'diferencia'::text AS concepto,
    COALESCE(e."montoHonorariosDiferencia", 0)::numeric
    *
    CASE
      WHEN e.usuario_id = 7 THEN
        CASE WHEN (SELECT uid FROM rangos) = 7 THEN 1.0 ELSE 0.0 END
      ELSE
        CASE
          WHEN (SELECT uid FROM rangos) = e.usuario_id THEN (COALESCE(u.p, 0) / 100.0)
          WHEN (SELECT uid FROM rangos) = 7           THEN ((100 - COALESCE(u.p, 0)) / 100.0)
          ELSE 0.0
        END
    END AS monto
  FROM public.expedientes e
  LEFT JOIN U u ON u.id = e.usuario_id
  WHERE e.estado <> 'eliminado'
    AND e."fechaCobroDiferencia"::date >= (SELECT inicio FROM rangos)
    AND e."fechaCobroDiferencia"::date <  (SELECT fin FROM rangos)
),
detalle AS (
  SELECT
    m.expediente_id,
    m.numero,
    m.anio_expediente,
    m.caratula,
    SUM(CASE WHEN m.concepto = 'capital'    THEN m.monto ELSE 0 END) AS "Capital",
    SUM(CASE WHEN m.concepto = 'honorarios' THEN m.monto ELSE 0 END) AS "Honorarios",
    SUM(CASE WHEN m.concepto = 'alzada'     THEN m.monto ELSE 0 END) AS "Alzada",
    SUM(CASE WHEN m.concepto = 'ejecucion'  THEN m.monto ELSE 0 END) AS "Ejecucion",
    SUM(CASE WHEN m.concepto = 'diferencia' THEN m.monto ELSE 0 END) AS "Diferencia",
    SUM(m.monto) AS "TotalExpediente"
  FROM movimientos m
  GROUP BY m.expediente_id, m.numero, m.anio_expediente, m.caratula
)
SELECT *
FROM (
  SELECT
    expediente_id,
    numero::text AS numero,
    anio_expediente,
    caratula,
    "Capital","Honorarios","Alzada","Ejecucion","Diferencia","TotalExpediente",
    0 AS orden
  FROM detalle

  UNION ALL

  SELECT
    NULL::int,
    'TOTAL GENERAL'::text,
    NULL::int,
    NULL::text,
    SUM("Capital"), SUM("Honorarios"), SUM("Alzada"), SUM("Ejecucion"), SUM("Diferencia"), SUM("TotalExpediente"),
    1
  FROM detalle
) x
ORDER BY x.orden, x.numero;



      `,
      [inicioStr, finStr, usuarioId]  
    );

    return res.json(rows ?? []);
  } catch (error) {
    console.error("Error en /expedientes/cobranzas-detalle-por-mes:", error);
    return res.status(500).send("Error en el servidor");
  }
});




// postgres
/*app.get("/expedientes/honorarios-pendientes", async (req, res) => {
  try {
    const { rows } = await pgPool.query(
      `
      WITH uma_val AS (
        SELECT COALESCE(MAX(valor), 0)::numeric AS valoruma
        FROM public.uma
      ),
      pendientes AS (
        SELECT
          e.id, e.numero, e.anio, e.caratula,

          -- CAPITAL
          CASE
            WHEN e."fecha_cobro_capital" IS NULL AND COALESCE(e."montoLiquidacionCapital", 0) > 0
            THEN ROUND(
              COALESCE(e."montoLiquidacionCapital", 0)::numeric
              * (COALESCE(e.porcentaje, 100)::numeric / 100.0)
              * ((100.0 - COALESCE(u.porcentaje, 0)::numeric) / 100.0),
              2
            )
            ELSE 0
          END AS "pendienteCapital",

          -- HONORARIOS
          CASE
            WHEN e."fecha_cobro" IS NULL THEN
              CASE
                WHEN LOWER(COALESCE(e."subEstadoHonorariosSeleccionado", '')) IN ('giro', 'da en pago parcial', 'da en pago total')
                THEN ROUND(
                  COALESCE(e."montoLiquidacionHonorarios", 0)::numeric
                  * ((100 - COALESCE(u."porcentajeHonorarios", 0)::numeric) / 100.0),
                  2
                )
                ELSE ROUND(
                  (
                    CASE
                      WHEN COALESCE(e."montoLiquidacionHonorarios", 0) > 0
                        THEN COALESCE(e."montoLiquidacionHonorarios", 0)::numeric
                      ELSE (COALESCE(e."cantidadUMA", 0)::numeric * (SELECT valoruma FROM uma_val))
                    END
                  )
                  * ((100 - COALESCE(u."porcentajeHonorarios", 0)::numeric) / 100.0),
                  2
                )
              END
            ELSE 0
          END AS "pendienteHonorarios",

          -- ALZADA
          CASE
            WHEN e."fechaCobroAlzada" IS NULL THEN
              ROUND(COALESCE(e."montoAcuerdo_alzada", 0)::numeric * ((100 - COALESCE(u."porcentajeHonorarios", 0)::numeric) / 100.0), 2)
            ELSE 0
          END AS "pendienteAlzada",

          -- EJECUCIÓN
          CASE
            WHEN e."fechaCobroEjecucion" IS NULL THEN
              ROUND(COALESCE(e."montoHonorariosEjecucion", 0)::numeric * ((100 - COALESCE(u."porcentajeHonorarios", 0)::numeric) / 100.0), 2)
            ELSE 0
          END AS "pendienteEjecucion",

          -- DIFERENCIA
          CASE
            WHEN e."fechaCobroDiferencia" IS NULL THEN
              ROUND(COALESCE(e."montoHonorariosDiferencia", 0)::numeric * ((100 - COALESCE(u."porcentajeHonorarios", 0)::numeric) / 100.0), 2)
            ELSE 0
          END AS "pendienteDiferencia"
        FROM public.expedientes e
        LEFT JOIN public.usuario u ON e.usuario_id = u.id
        WHERE e.estado <> 'eliminado'
      )
      SELECT
        COALESCE(
          ROUND(
            SUM(
              "pendienteCapital"
              + "pendienteHonorarios"
              + "pendienteAlzada"
              + "pendienteEjecucion"
              + "pendienteDiferencia"
            ),
            2
          ),
          0
        ) AS "totalGeneral"
      FROM pendientes
      WHERE ("pendienteCapital" + "pendienteHonorarios" + "pendienteAlzada" + "pendienteEjecucion" + "pendienteDiferencia") > 0;
      `
    );

    const total = Number(rows?.[0]?.totalGeneral ?? 0);
    return res.status(200).json(total);
  } catch (err) {
    console.error("Error al calcular honorarios pendientes:", err);
    return res.status(500).json({ error: "Error al calcular honorarios pendientes", message: err.message });
  }
});*/

app.get("/expedientes/honorarios-pendientes", async (req, res) => {
  try {
    const usuarioId = Number(req.query.usuario_id);
    if (!Number.isFinite(usuarioId) || usuarioId <= 0) {
      return res.status(400).send("Falta usuario_id válido");
    }

    const { rows } = await pgPool.query(
      `
      WITH uma_val AS (
        SELECT COALESCE(MAX(valor), 0)::numeric AS valoruma
        FROM public.uma
      ),
      U AS (
        SELECT DISTINCT ON (id)
          id,
          COALESCE(porcentaje, 0)::numeric AS p_cap,
          COALESCE("porcentajeHonorarios", porcentaje, 0)::numeric AS p_hon
        FROM public.usuario
        ORDER BY id
      ),
      pendientes AS (
        SELECT
          e.id, e.numero, e.anio, e.caratula,

          /* =========================
             FACTOR CAPITAL (mi parte)
             ========================= */
          CASE
            WHEN e.usuario_id = 7 THEN
              CASE WHEN $1::int = 7 THEN 1.0 ELSE 0.0 END
            ELSE
              CASE
                WHEN $1::int = e.usuario_id THEN (COALESCE(u.p_cap,0) / 100.0)
                WHEN $1::int = 7           THEN ((100 - COALESCE(u.p_cap,0)) / 100.0)
                ELSE 0.0
              END
          END AS f_cap,

          /* =========================
             FACTOR HONORARIOS (mi parte)
             ========================= */
          CASE
            WHEN e.usuario_id = 7 THEN
              CASE WHEN $1::int = 7 THEN 1.0 ELSE 0.0 END
            ELSE
              CASE
                WHEN $1::int = e.usuario_id THEN (COALESCE(u.p_hon,0) / 100.0)
                WHEN $1::int = 7           THEN ((100 - COALESCE(u.p_hon,0)) / 100.0)
                ELSE 0.0
              END
          END AS f_hon,

          /* =========================
             CAPITAL (pendiente para MI)
             ========================= */
          CASE
            WHEN e."fecha_cobro_capital" IS NULL
             AND COALESCE(e."montoLiquidacionCapital", 0) > 0
            THEN ROUND(
              COALESCE(e."montoLiquidacionCapital", 0)::numeric
              * (COALESCE(e.porcentaje, 100)::numeric / 100.0)
              * (
                  CASE
                    WHEN e.usuario_id = 7 THEN
                      CASE WHEN $1::int = 7 THEN 1.0 ELSE 0.0 END
                    ELSE
                      CASE
                        WHEN $1::int = e.usuario_id THEN (COALESCE(u.p_cap,0) / 100.0)
                        WHEN $1::int = 7           THEN ((100 - COALESCE(u.p_cap,0)) / 100.0)
                        ELSE 0.0
                      END
                  END
                ),
              2
            )
            ELSE 0
          END AS "pendienteCapital",

          /* =========================
             HONORARIOS (pendiente para MI)
             ========================= */
          CASE
            WHEN e."fecha_cobro" IS NULL THEN
              ROUND(
                (
                  CASE
                    WHEN LOWER(COALESCE(e."subEstadoHonorariosSeleccionado", '')) IN ('giro', 'da en pago parcial', 'da en pago total')
                      THEN COALESCE(e."montoLiquidacionHonorarios", 0)::numeric
                    ELSE
                      (
                        CASE
                          WHEN COALESCE(e."montoLiquidacionHonorarios", 0) > 0
                            THEN COALESCE(e."montoLiquidacionHonorarios", 0)::numeric
                          ELSE (COALESCE(e."cantidadUMA", 0)::numeric * (SELECT valoruma FROM uma_val))
                        END
                      )
                  END
                )
                * (
                    CASE
                      WHEN e.usuario_id = 7 THEN
                        CASE WHEN $1::int = 7 THEN 1.0 ELSE 0.0 END
                      ELSE
                        CASE
                          WHEN $1::int = e.usuario_id THEN (COALESCE(u.p_hon,0) / 100.0)
                          WHEN $1::int = 7           THEN ((100 - COALESCE(u.p_hon,0)) / 100.0)
                          ELSE 0.0
                        END
                    END
                  ),
                2
              )
            ELSE 0
          END AS "pendienteHonorarios",

          /* =========================
             ALZADA (pendiente para MI)
             ========================= */
          CASE
            WHEN e."fechaCobroAlzada" IS NULL THEN
              ROUND(
                COALESCE(e."montoAcuerdo_alzada", 0)::numeric
                * (
                    CASE
                      WHEN e.usuario_id = 7 THEN
                        CASE WHEN $1::int = 7 THEN 1.0 ELSE 0.0 END
                      ELSE
                        CASE
                          WHEN $1::int = e.usuario_id THEN (COALESCE(u.p_hon,0) / 100.0)
                          WHEN $1::int = 7           THEN ((100 - COALESCE(u.p_hon,0)) / 100.0)
                          ELSE 0.0
                        END
                    END
                  ),
                2
              )
            ELSE 0
          END AS "pendienteAlzada",

          /* =========================
             EJECUCIÓN (pendiente para MI)
             ========================= */
          CASE
            WHEN e."fechaCobroEjecucion" IS NULL THEN
              ROUND(
                COALESCE(e."montoHonorariosEjecucion", 0)::numeric
                * (
                    CASE
                      WHEN e.usuario_id = 7 THEN
                        CASE WHEN $1::int = 7 THEN 1.0 ELSE 0.0 END
                      ELSE
                        CASE
                          WHEN $1::int = e.usuario_id THEN (COALESCE(u.p_hon,0) / 100.0)
                          WHEN $1::int = 7           THEN ((100 - COALESCE(u.p_hon,0)) / 100.0)
                          ELSE 0.0
                        END
                    END
                  ),
                2
              )
            ELSE 0
          END AS "pendienteEjecucion",

          /* =========================
             DIFERENCIA (pendiente para MI)
             ========================= */
          CASE
            WHEN e."fechaCobroDiferencia" IS NULL THEN
              ROUND(
                COALESCE(e."montoHonorariosDiferencia", 0)::numeric
                * (
                    CASE
                      WHEN e.usuario_id = 7 THEN
                        CASE WHEN $1::int = 7 THEN 1.0 ELSE 0.0 END
                      ELSE
                        CASE
                          WHEN $1::int = e.usuario_id THEN (COALESCE(u.p_hon,0) / 100.0)
                          WHEN $1::int = 7           THEN ((100 - COALESCE(u.p_hon,0)) / 100.0)
                          ELSE 0.0
                        END
                    END
                  ),
                2
              )
            ELSE 0
          END AS "pendienteDiferencia"

        FROM public.expedientes e
        LEFT JOIN U u ON u.id = e.usuario_id
        WHERE e.estado <> 'eliminado'
      )
      SELECT
        COALESCE(
          ROUND(
            SUM(
              "pendienteCapital"
              + "pendienteHonorarios"
              + "pendienteAlzada"
              + "pendienteEjecucion"
              + "pendienteDiferencia"
            ),
            2
          ),
          0
        ) AS "totalGeneral"
      FROM pendientes
      WHERE ("pendienteCapital" + "pendienteHonorarios" + "pendienteAlzada" + "pendienteEjecucion" + "pendienteDiferencia") > 0;
      `,
      [usuarioId]
    );

    const total = Number(rows?.[0]?.totalGeneral ?? 0);
    return res.status(200).json(total);
  } catch (err) {
    console.error("Error al calcular honorarios pendientes:", err);
    return res.status(500).json({ error: "Error al calcular honorarios pendientes", message: err.message });
  }
});


// postgres
app.get("/expedientes/expedientes-activos", async (req, res) => {
  const usuarioId = Number(req.query.usuario_id);

  if (!Number.isFinite(usuarioId) || usuarioId <= 0) {
    return res.status(400).send("Falta usuario_id válido");
  }

  try {
    const { rows } = await pgPool.query(
      `
      SELECT COUNT(*)::int AS cantidad
      FROM public.expedientes
      WHERE estado <> 'eliminado'
        AND usuario_id = $1
      `,
      [usuarioId]
    );

    return res.json(rows[0].cantidad);
  } catch (err) {
    console.error("Error al contar expedientes activos:", err);
    return res.status(500).send("Error en expedientes-activos");
  }
});


// postgres
app.get("/expedientes/clientes-registrados", async (req, res) => {
  try {
    const { rows } = await pgPool.query(
      `
      SELECT COUNT(*)::int AS cantidad
      FROM public.clientes
      WHERE estado <> 'eliminado'
        AND estado <> 'cobrado'
      `
    );
    return res.json(rows[0].cantidad);
  } catch (err) {
    console.error("Error al contar clientes:", err);
    return res.status(500).send("Error en clientes-registrados");
  }
});


// postgres
app.get("/expedientes/sentencias-emitidas", async (req, res) => {
  const usuarioId = Number(req.query.usuario_id);

  if (!Number.isFinite(usuarioId) || usuarioId <= 0) {
    return res.status(400).send("Falta usuario_id válido");
  }

  try {
    const { rows } = await pgPool.query(
      `
      SELECT COUNT(*)::int AS cantidad
      FROM public.expedientes
      WHERE estado = 'sentencia'
        AND usuario_id = $1
      `,
      [usuarioId]
    );

    return res.json(rows[0].cantidad);
  } catch (err) {
    console.error("Error al contar sentencias emitidas:", err);
    return res.status(500).send("Error en sentencias-emitidas");
  }
});



// postgres
app.get("/expedientes/demandados-por-mes", async (req, res) => {
  try {
    const { rows } = await pgPool.query(
      `
      SELECT
        to_char(e.fecha_inicio, 'YYYY-MM') AS mes,
        COUNT(d.id) AS cantidad
      FROM public.expedientes e
      JOIN public.expedientes_demandados ed ON e.id = ed.expediente_id
      JOIN public.demandados d ON d.id = ed.demandado_id
      WHERE e.fecha_inicio IS NOT NULL
      GROUP BY to_char(e.fecha_inicio, 'YYYY-MM')
      ORDER BY mes DESC
      `
    );

    const datos = rows.reduce((acc, row) => {
      acc[row.mes] = Number(row.cantidad);
      return acc;
    }, {});

    return res.json(datos);
  } catch (err) {
    console.error("Error al obtener demandados por mes:", err);
    return res.status(500).send("Error servidor");
  }
});

// postgres
app.put("/oficios/modificar/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Falta id" });
    }

    let {
      expediente_id,
      demandado_id,
      parte,
      estado,
      fecha_diligenciado,
      tipo,
      nombre_oficiada,
      tipo_pericia,
      supletoria
    } = req.body;

    // Traigo registro actual
    const prevR = await pgPool.query(
      `SELECT * FROM public.oficios WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!prevR.rows.length) {
      return res.status(404).json({ error: "Oficio/Prueba no encontrado" });
    }
    const prev = prevR.rows[0];

    const has = (k) => Object.prototype.hasOwnProperty.call(req.body, k);
    const normStr = (v) => (v === undefined || v === null ? null : String(v).trim());
    const normDate = (v) => (v ? v : null);

    const tipoNorm = normStr(has("tipo") ? tipo : prev.tipo)?.toLowerCase();
    if (!["oficio", "testimonial", "pericia"].includes(tipoNorm || "")) {
      return res.status(400).json({ error: "Tipo inválido. Use: oficio | testimonial | pericia" });
    }

    const final = {
      expediente_id: has("expediente_id") ? Number(expediente_id) : prev.expediente_id,
      demandado_id: has("demandado_id")
        ? (demandado_id === "" || demandado_id === null ? null : Number(demandado_id))
        : prev.demandado_id,
      parte: has("parte") ? normStr(parte) : prev.parte,
      estado: has("estado") ? normStr(estado) : prev.estado,
      fecha_diligenciado: has("fecha_diligenciado") ? normDate(fecha_diligenciado) : prev.fecha_diligenciado,
      nombre_oficiada: has("nombre_oficiada") ? normStr(nombre_oficiada) : prev.nombre_oficiada,
      tipo_pericia: has("tipo_pericia") ? normStr(tipo_pericia) : prev.tipo_pericia,
      supletoria: has("supletoria") ? normDate(supletoria) : prev.supletoria
    };

    // Validaciones por tipo
    if (tipoNorm === "oficio") {
      if (final.demandado_id == null) {
        return res.status(400).json({ error: 'Para tipo "oficio", demandado_id es obligatorio' });
      }
      final.nombre_oficiada = null;
      final.tipo_pericia = null;
      final.supletoria = null;
    }

    if (tipoNorm === "testimonial") {
      if (!final.nombre_oficiada) {
        return res.status(400).json({ error: 'Para tipo "testimonial", nombre_oficiada (testigo) es obligatorio' });
      }
      final.demandado_id = null;
      final.tipo_pericia = null;
    }

    if (tipoNorm === "pericia") {
      if (!final.nombre_oficiada) {
        return res.status(400).json({ error: 'Para tipo "pericia", nombre_oficiada (perito) es obligatorio' });
      }
      const tp = (final.tipo_pericia || "").toLowerCase();
      if (!["pericial informática", "pericial informatica", "pericial contable", "pericial caligrafica", "pericial telecomunicaciones"].includes(tp)) {
        return res.status(400).json({ error: 'tipo_pericia inválido. Solo "Pericial informática".' });
      }
      final.demandado_id = null;
      final.supletoria = null;
    }

    const upd = await pgPool.query(
      `
      UPDATE public.oficios
      SET
        expediente_id      = $1,
        demandado_id       = $2,
        parte              = $3,
        estado             = $4,
        fecha_diligenciado = $5,
        tipo               = $6,
        nombre_oficiada    = $7,
        tipo_pericia       = $8,
        supletoria         = $9
      WHERE id = $10
      `,
      [
        final.expediente_id ?? null,
        final.demandado_id ?? null,
        final.parte ?? null,
        final.estado ?? null,
        final.fecha_diligenciado || null,
        tipoNorm,
        final.nombre_oficiada ?? null,
        final.tipo_pericia ?? null,
        final.supletoria || null,
        id
      ]
    );

    if (upd.rowCount === 0) return res.status(404).json({ error: "Oficio/Prueba no encontrado" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error al modificar prueba:", err);
    return res.status(500).json({ error: "Error al modificar prueba" });
  }
});



// postgres
app.get("/expedientes/caratula/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "ID inválido" });

  try {
    const { rows } = await pgPool.query(
      `
      SELECT
        e.numero,
        e.anio,
        e.juicio,
        -- actora: primer cliente de clientes_expedientes (tipo cliente)
        (
          SELECT (c.apellido || ' ' || c.nombre)
          FROM public.clientes_expedientes ce
          JOIN public.clientes c ON c.id = ce.id_cliente
          WHERE ce.id_expediente = e.id
            AND ce.id_cliente IS NOT NULL
          ORDER BY ce.id ASC
          LIMIT 1
        ) AS actor,
        -- demandado: primera empresa demandada (tipo empresa)
        (
          SELECT d.nombre
          FROM public.expedientes_demandados ed
          JOIN public.demandados d ON d.id = ed.id_demandado
          WHERE ed.id_expediente = e.id
            AND ed.id_demandado IS NOT NULL
          ORDER BY ed.id ASC
          LIMIT 1
        ) AS demandado
      FROM public.expedientes e
      WHERE e.id = $1
      LIMIT 1
      `,
      [id]
    );

    const row = rows[0];
    if (!row) return res.status(404).json({ message: "No encontrado" });

    return res.json({
      numero: row.numero ?? null,
      anio: row.anio ?? null,
      juicio: row.juicio ?? null,
      actor: row.actor ?? null,
      demandado: row.demandado ?? null
    });
  } catch (err) {
    console.error("caratula error", err);
    return res.status(500).json({ message: "Error consultando carátula" });
  }
});


// postgres
app.get("/pagos", async (req, res) => {
  try {
    const { rows } = await pgPool.query(
      `
      SELECT *
      FROM public.pagos
      WHERE tipo_pago NOT IN ('capital','honorario','alzada','ejecucion','diferencia')
      ORDER BY fecha DESC
      `
    );
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /pagos:", err);
    res.status(500).json({ error: "Error al obtener los pagos" });
  }
});

// postgres
app.post("/pagos", async (req, res) => {
  const { fecha, monto, tipo_pago, expediente_id } = req.body;

  const tiposPermitidos = ["carta documento","consulta","otro","capital","honorario","alzada","diferencia","ejecucion"];
  if (!fecha || monto == null) return res.status(400).json({ error: "La fecha y el monto son obligatorios" });
  if (!tipo_pago || !tiposPermitidos.includes(tipo_pago)) {
    return res.status(400).json({ error: 'tipo_pago inválido.' });
  }

  try {
    const nuevoId = await generarNuevoId(pgPool, "pagos", "id");

    const { rows } = await pgPool.query(
      `
      INSERT INTO public.pagos (id, fecha, monto, tipo_pago, expediente_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [nuevoId, fecha, monto, tipo_pago, expediente_id ?? null]
    );

    return res.status(201).json({
      message: "Pago registrado con éxito",
      pago: { id: rows[0].id, fecha, monto, tipo_pago }
    });
  } catch (err) {
    console.error("Error en POST /pagos:", err);
    return res.status(500).json({ error: "Error al registrar el pago" });
  }
});

// postgres
app.delete("/pagos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "ID inválido" });

  try {
    const r = await pgPool.query(`DELETE FROM public.pagos WHERE id = $1`, [id]);
    if (!r.rowCount) return res.status(404).json({ error: "Pago no encontrado" });
    return res.json({ message: "Pago eliminado con éxito" });
  } catch (err) {
    console.error("Error en DELETE /pagos:", err);
    return res.status(500).json({ error: "Error al eliminar el pago" });
  }
});




// postgres
app.get("/expedientes/partes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "ID inválido" });

    const rsAct = await pgPool.query(
      `
      SELECT 'cliente' AS tipo, c.id, c.nombre, c.apellido
      FROM public.clientes_expedientes ce
      JOIN public.clientes c ON c.id = ce.id_cliente
      WHERE ce.id_expediente = $1 AND ce.id_cliente IS NOT NULL

      UNION ALL

      SELECT 'empresa' AS tipo, d.id, d.nombre, NULL AS apellido
      FROM public.clientes_expedientes ce
      JOIN public.demandados d ON d.id = ce.id_empresa
      WHERE ce.id_expediente = $1 AND ce.id_empresa IS NOT NULL
      ORDER BY tipo, nombre
      `,
      [id]
    );

    const rsDem = await pgPool.query(
      `
      SELECT 'empresa' AS tipo, d.id, d.nombre, NULL AS apellido
      FROM public.expedientes_demandados ed
      JOIN public.demandados d ON d.id = ed.id_demandado
      WHERE ed.id_expediente = $1 AND ed.id_demandado IS NOT NULL

      UNION ALL

      SELECT 'cliente' AS tipo, c.id, c.nombre, c.apellido
      FROM public.expedientes_demandados ed
      JOIN public.clientes c ON c.id = ed.id_cliente
      WHERE ed.id_expediente = $1 AND ed.id_cliente IS NOT NULL
      ORDER BY tipo, nombre
      `,
      [id]
    );

    return res.json({ actoras: rsAct.rows, demandados: rsDem.rows });
  } catch (err) {
    console.error("GET /expedientes/partes/:id", err);
    return res.status(500).json({ error: "Error obteniendo partes" });
  }
});

// postgres ⚠️ Si esos campos en tu Postgres quedaron como 0/1 y no boolean, 
// reemplazo FALSE por 0. Si te tira error de tipo, esa es la causa.
app.put("/expedientes/restaurar-cobro/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    const r = await client.query(
      `
      UPDATE public.expedientes
      SET
        -- flags (si son boolean, usar FALSE; si son 0/1, decime y lo ajusto)
        "honorarioCobrado"           = FALSE,
        "capitalCobrado"             = FALSE,
        "honorarioAlzadaCobrado"     = FALSE,
        "honorarioEjecucionCobrado"  = FALSE,
        "honorarioDiferenciaCobrado" = FALSE,

        -- fechas de cobro
        "fecha_cobro"          = NULL,
        "fecha_cobro_capital"  = NULL,
        "fechaCobroAlzada"     = NULL,
        "fechaCobroEjecucion"  = NULL,
        "fechaCobroDiferencia" = NULL,

        -- montos ligados al cobro
        "montoAcuerdo_alzada"       = NULL,
        "montoHonorariosEjecucion"  = NULL,
        "montoHonorariosDiferencia" = NULL,

        -- parciales
        "capitalPagoParcial" = NULL
      WHERE id = $1
        AND estado <> 'eliminado'
      `,
      [id]
    );

    await client.query("COMMIT");

    if ((r.rowCount || 0) > 0) {
      return res.json({ ok: true, mensaje: "Cobro restaurado" });
    }
    return res.status(404).json({ ok: false, mensaje: "Expediente no encontrado" });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("REST/expedientes/restaurar-cobro", e);
    return res.status(500).json({ ok: false, message: "Error al restaurar cobro", detail: e.message });
  } finally {
    client.release();
  }
});

// ------- CODIGO -------
// Campos: id, tipo ('familia' | 'patrimoniales' | 'comercial'), codigo, descripcion

const TIPOS_JURIS = ['familia', 'patrimoniales', 'comercial'];

/**
 * GET /codigos postgres
 * Query params opcionales:
 *   - q: busca en tipo, codigo o descripcion
 *   - tipo: filtra por tipo exacto
 *   - page, pageSize: paginación
 */
app.get("/codigos", async (req, res) => {
  try {
    const { rows } = await pgPool.query(`SELECT * FROM public.codigos`);
    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener codigos:", err);
    return res.status(500).json({ error: "Error al obtener codigos", message: err.message });
  }
});



/**
 * POST /codigos postgres
 * Body JSON: { tipo, codigo, descripcion }
 */
app.post("/codigos", async (req, res) => {
  try {
    const { tipo, codigo, descripcion } = req.body || {};

    if (!tipo || !codigo || !descripcion) {
      return res.status(400).json({
        error: "Faltan campos: tipo, codigo y descripcion son obligatorios.",
      });
    }

    const tipoNorm = String(tipo).toLowerCase().trim();
    if (!TIPOS_JURIS.includes(tipoNorm)) {
      return res.status(400).json({
        error: "Tipo inválido. Use: familia, patrimoniales o comercial.",
      });
    }

    const { rows: ex } = await pgPool.query(
      `SELECT id FROM public.codigos WHERE codigo = $1 LIMIT 1`,
      [codigo]
    );
    if (ex.length > 0) {
      return res.status(409).json({ error: "El código ya existe." });
    }

    const nuevoId = await generarNuevoId(pgPool, "codigos", "id");

    const { rows } = await pgPool.query(
      `
      INSERT INTO public.codigos (id, tipo, codigo, descripcion)
      VALUES ($1, $2, $3, $4)
      RETURNING id, tipo, codigo, descripcion
      `,
      [nuevoId, tipoNorm, codigo, descripcion]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /codigos error:", err);
    return res.status(500).json({ error: "Error al crear codigo", message: err.message });
  }
});


/**
 * PUT /codigos/:id postgrres
 * Body JSON: { tipo?, codigo?, descripcion? }
 */
app.put("/codigos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { tipo, codigo, descripcion } = req.body || {};

    if (tipo === undefined && codigo === undefined && descripcion === undefined) {
      return res.status(400).json({ error: "No hay datos para actualizar." });
    }

    const tipoNorm = tipo !== undefined ? String(tipo).toLowerCase().trim() : undefined;
    if (tipo !== undefined && !TIPOS_JURIS.includes(tipoNorm)) {
      return res.status(400).json({ error: "Tipo inválido. Use: familia, patrimoniales o comercial." });
    }

    const { rows: curr } = await pgPool.query(
      `SELECT * FROM public.codigos WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (curr.length === 0) {
      return res.status(404).json({ error: "codigos no encontrada" });
    }

    if (codigo !== undefined) {
      const { rows: dup } = await pgPool.query(
        `SELECT id FROM public.codigos WHERE codigo = $1 AND id <> $2 LIMIT 1`,
        [codigo, id]
      );
      if (dup.length > 0) {
        return res.status(409).json({ error: "El código ya existe en otro registro." });
      }
    }

    const sets = [];
    const params = [];
    let p = 1;

    if (tipo !== undefined) {
      sets.push(`tipo = $${p++}`);
      params.push(tipoNorm);
    }
    if (codigo !== undefined) {
      sets.push(`codigo = $${p++}`);
      params.push(codigo);
    }
    if (descripcion !== undefined) {
      sets.push(`descripcion = $${p++}`);
      params.push(descripcion);
    }

    params.push(id);

    const { rows: updated } = await pgPool.query(
      `
      UPDATE public.codigos
      SET ${sets.join(", ")}
      WHERE id = $${p}
      RETURNING id, tipo, codigo, descripcion, fecha_creacion
      `,
      params
    );

    return res.json(updated[0]);
  } catch (err) {
    console.error("PUT /codigos/:id error:", err);
    return res.status(500).json({ error: "Error al actualizar el codigo", message: err.message });
  }
});


//postgres
app.delete("/codigos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const del = await pgPool.query(
      `DELETE FROM public.codigos WHERE id = $1`,
      [id]
    );

    if ((del.rowCount || 0) === 0) {
      return res.status(404).json({ error: "No encontrada" });
    }

    return res.json({ ok: true, deleted: del.rowCount });
  } catch (e) {
    console.error("DELETE /codigos error:", e);
    return res.status(500).json({ error: "Error al eliminar", message: e.message });
  }
});

const FUEROS = ['CCF', 'COM', 'CIV', 'CC'];

// postgres
app.get("/jurisprudencias", async (req, res) => {
  try {
    const { expedienteId } = req.query;

    let query = `
      SELECT 
        j.id,
        j.expediente_id,
        j.fuero,
        j.demandado_id,
        d.nombre      AS demandado_nombre,
        j.juzgado_id,
        juz.nombre    AS juzgado_nombre,
        j.sentencia,
        j.juez_id,
        jue.nombre    AS juez_nombre,
        j.camara,
        j.codigo_id,
        c.codigo      AS codigo,
        c.descripcion AS codigo_descripcion
      FROM public.jurisprudencias j
      LEFT JOIN public.demandados d ON d.id = j.demandado_id
      LEFT JOIN public.juzgados   juz ON juz.id = j.juzgado_id
      LEFT JOIN public.juez       jue ON jue.id = j.juez_id
      LEFT JOIN public.codigos    c   ON c.id = j.codigo_id
      WHERE 1=1
    `;

    const params = [];
    if (expedienteId) {
      const eid = Number(expedienteId);
      if (!Number.isInteger(eid) || eid <= 0) {
        return res.status(400).json({ error: "expedienteId inválido" });
      }
      params.push(eid);
      query += ` AND j.expediente_id = $${params.length}`;
    }

    query += ` ORDER BY j.id DESC`;

    const { rows } = await pgPool.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error("GET /jurisprudencias error:", err);
    return res.status(500).json({ error: "Error al obtener jurisprudencias", message: err.message });
  }
});


// postgres
app.post("/jurisprudencias", async (req, res) => {
  try {
    const {
      expediente_id,
      fuero,
      demandado_id,
      juzgado_id,
      sentencia,
      juez_id,
      camara,
      codigo_id,
    } = req.body || {};

    if (!expediente_id || !fuero || !demandado_id || !juzgado_id || !juez_id || !camara || !codigo_id) {
      return res.status(400).json({
        error: "Faltan datos obligatorios: expediente_id, fuero, demandado_id, juzgado_id, juez_id, camara, codigo_id",
      });
    }

    const fueroNorm = String(fuero).toUpperCase().trim();
    if (!FUEROS.includes(fueroNorm)) {
      return res.status(400).json({ error: "Fuero inválido. Use: CCF, COM, CIV o CC." });
    }

    const id = await generarNuevoId(pgPool, "jurisprudencias", "id");

    const { rows: ins } = await pgPool.query(
      `
      INSERT INTO public.jurisprudencias (
        id, expediente_id, fuero, demandado_id, juzgado_id, sentencia, juez_id, camara, codigo_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id
      `,
      [
        Number(id),
        Number(expediente_id),
        fueroNorm,
        Number(demandado_id),
        Number(juzgado_id),
        sentencia ? new Date(sentencia) : null,
        Number(juez_id),
        String(camara),
        Number(codigo_id),
      ]
    );

    const newId = ins[0].id;

    const { rows } = await pgPool.query(
      `
      SELECT 
        j.id,
        j.expediente_id,
        j.fuero,
        j.demandado_id,
        d.nombre      AS demandado_nombre,
        j.juzgado_id,
        juz.nombre    AS juzgado_nombre,
        j.sentencia,
        j.juez_id,
        jue.nombre    AS juez_nombre,
        j.camara,
        j.codigo_id,
        c.codigo      AS codigo,
        c.descripcion AS codigo_descripcion
      FROM public.jurisprudencias j
      LEFT JOIN public.demandados d ON d.id = j.demandado_id
      LEFT JOIN public.juzgados   juz ON juz.id = j.juzgado_id
      LEFT JOIN public.juez       jue ON jue.id = j.juez_id
      LEFT JOIN public.codigos    c   ON c.id = j.codigo_id
      WHERE j.id = $1
      `,
      [newId]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /jurisprudencias error:", err);
    return res.status(500).json({ error: "Error al crear jurisprudencia", message: err.message });
  }
});


// 🔢 Método genérico para generar un nuevo ID para cualquier tabla (POSTGRES)
async function generarNuevoId(pgPool, tabla, columna = "id") {
  const tablasValidas = [
    "clientes",
    "expedientes",
    "localidades",
    "juzgados",
    "demandados",
    "juez",
    "eventos_calendario",
    "partido",
    "pagos",
    "pagos_expediente",
    "clientes_expedientes",
    "jurisprudencias",
    "codigos",
    "uma",
    "usuario",
    "oficios",
    "mediaciones",
    "clientes_eventos",
    "expedientes_demandados",
  ];

  if (!tablasValidas.includes(tabla)) {
    throw new Error(`Tabla no permitida para generar nuevo id: ${tabla}`);
  }

  // columna también la controlamos por si un día la pasás distinta
  const columnasValidas = ["id"];
  if (!columnasValidas.includes(columna)) {
    throw new Error(`Columna no permitida para generar nuevo id: ${columna}`);
  }

  const consulta = `
    SELECT COALESCE(MAX("${columna}"), 0) + 1 AS "nuevoId"
    FROM public."${tabla}"
  `;

  const result = await pgPool.query(consulta);
  const nuevoId = result.rows[0]?.nuevoId;

  if (!nuevoId) {
    throw new Error(`No se pudo calcular nuevo id para tabla ${tabla}`);
  }

  return Number(nuevoId);
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

// postgres
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

    const fechaStr = String(fecha_pago).slice(0, 10);
    const fechaDate = new Date(fechaStr + "T00:00:00.000Z");
    if (Number.isNaN(fechaDate.getTime())) {
      return res.status(400).send("fecha_pago inválida (usar YYYY-MM-DD)");
    }

    await pgPool.query(
      `
      INSERT INTO public.pagos_capital (expediente_id, monto, fecha_pago)
      VALUES ($1, $2, $3)
      `,
      [expedienteIdNum, montoNum, fechaStr] // date string es perfecto para date
    );

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error al insertar pago parcial (capital):", error);
    return res.status(500).send("Error en el servidor");
  }
});

// postgres
app.put("/jurisprudencias/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
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
      return res.status(400).json({ error: "No hay datos para actualizar." });
    }

    const { rows: current } = await pgPool.query(
      `SELECT * FROM public.jurisprudencias WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (current.length === 0) {
      return res.status(404).json({ error: "Jurisprudencia no encontrada" });
    }

    const sets = [];
    const params = [];
    let p = 1;

    if (expediente_id !== undefined) {
      sets.push(`expediente_id = $${p++}`);
      params.push(Number(expediente_id));
    }
    if (fuero !== undefined) {
      const fueroNorm = String(fuero).toUpperCase().trim();
      if (!FUEROS.includes(fueroNorm)) {
        return res.status(400).json({ error: "Fuero inválido. Use: CCF, COM, CIV o CC." });
      }
      sets.push(`fuero = $${p++}`);
      params.push(fueroNorm);
    }
    if (demandado_id !== undefined) {
      sets.push(`demandado_id = $${p++}`);
      params.push(demandado_id == null ? null : Number(demandado_id));
    }
    if (juzgado_id !== undefined) {
      sets.push(`juzgado_id = $${p++}`);
      params.push(juzgado_id == null ? null : Number(juzgado_id));
    }
    if (juez_id !== undefined) {
      sets.push(`juez_id = $${p++}`);
      params.push(juez_id == null ? null : Number(juez_id));
    }
    if (sentencia !== undefined) {
      sets.push(`sentencia = $${p++}`);
      params.push(sentencia ? new Date(sentencia) : null);
    }
    if (camara !== undefined) {
      sets.push(`camara = $${p++}`);
      params.push(camara == null ? null : String(camara));
    }
    if (codigo_id !== undefined) {
      sets.push(`codigo_id = $${p++}`);
      params.push(codigo_id == null ? null : Number(codigo_id));
    }

    params.push(id);

    const { rows } = await pgPool.query(
      `
      UPDATE public.jurisprudencias
      SET ${sets.join(", ")}
      WHERE id = $${p}
      RETURNING *
      `,
      params
    );

    return res.json(rows[0]);
  } catch (err) {
    console.error("PUT /jurisprudencias/:id error:", err);
    return res.status(500).json({ error: "Error al actualizar jurisprudencia", message: err.message });
  }
});


module.exports = router;



iniciarServidor();
