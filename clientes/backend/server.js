const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión a SQL Server con autenticación SQL
const dbConfig = {
    user: 'userMastrapasqua',         // Usuario de SQL Server
    password: '1503',  // Contraseña de SQL Server
    server: 'DESKTOP-Q9JTH4D', // Nombre del servidor
    database: 'ABOGACIA',      // Nombre de la base de datos
    options: {
        encrypt: true,          // Necesario para conexiones seguras
        trustServerCertificate: true  // Evita problemas con certificados SSL
    }
};

// Conectar a SQL Server
sql.connect(dbConfig)
    .then(pool => {
        // Ruta de prueba para ver si la API funciona
        app.get("/", (req, res) => {
            res.send("API funcionando correctamente.");
        });

        // Ruta para obtener todos los usuarios
        app.get("/usuarios", (req, res) => {
            pool.request()
                .query("SELECT * FROM usuarios")  // Consulta SQL
                .then(result => {
                    res.json(result.recordset);  // Devuelve los resultados
                })
                .catch(err => {
                    res.status(500).send(err);  // En caso de error, devuelve 500
                });
        });

        // Ruta para obtener clientes
        app.get("/clientes", (req, res) => {
            pool.request()
            .query("SELECT * FROM clientes WHERE estado = 'en gestión'")  
            .then(result => {
                    res.json(result.recordset);
                })
                .catch(err => {
                    res.status(500).send(err);
                });
        });

        // Ruta para obtener expedientes
        app.get("/expedientes", async (req, res) => {
            try {
                const result = await pool.request().query("SELECT * FROM expedientes WHERE estado != 'eliminado'");
                res.json(result.recordset);
            } catch (err) {
                console.error("Error al obtener expedientes:", err);
                res.status(500).send(err);
            }
        });

        // Ruta para buscar clientes
        app.get('/clientes/buscar', async (req, res) => {
            const texto = req.query.texto; 
            
            try {
              const result = await pool.request()
                .input('texto', sql.NVarChar, `%${texto}%`)
                .query("SELECT * FROM clientes WHERE estado = 'en gestión' AND (nombre LIKE @texto OR apellido LIKE @texto)")
          
              res.json(result.recordset);
            } catch (err) {
              console.error('Error al ejecutar la consulta:', err);
              return res.status(500).send('Error al obtener clientes');
            }
          });


          app.post('/clientes/agregar', async (req, res) => {
            try {
              const { nombre, apellido, dni, telefono, direccion, fecha_nacimiento, email, estado } = req.body;
          
              if (!nombre || !apellido || !dni || !email) {
                return res.status(400).json({
                  error: 'Faltan campos obligatorios',
                  camposRequeridos: ['nombre', 'apellido', 'dni', 'email']
                });
              }
          
              const result = await pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .input('apellido', sql.NVarChar, apellido)
                .input('dni', sql.Int, dni)
                .input('telefono', sql.NVarChar, telefono)
                .input('direccion', sql.NVarChar, direccion)
                .input('fecha_nacimiento', sql.DateTime, fecha_nacimiento)
                .input('email', sql.NVarChar, email)
                .input('estado', sql.NVarChar, estado)
                .query(`
                  INSERT INTO clientes (nombre, apellido, dni, telefono, direccion, fecha_nacimiento, email, estado)
                  OUTPUT INSERTED.id  -- Esto devuelve el id del nuevo cliente insertado
                  VALUES (@nombre, @apellido, @dni, @telefono, @direccion, @fecha_nacimiento, @email, @estado)
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
            
            console.log('ID del cliente a modificar:', id);
            console.log('Nuevos datos recibidos:', nuevosDatos);
        
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

                    .query(`
                        UPDATE Clientes
                        SET nombre = @nombre,
                            apellido = @apellido,
                            email = @email,
                            telefono = @telefono,
                            fecha_nacimiento = @fecha_nacimiento,
                            dni = @dni,
                            estado = @estado,
                            direccion = @direccion
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

    app.post('/expedientes/agregar', async (req, res) => {
      try {
          const { titulo, descripcion, demandado_id, juzgado_id, numero, anio, clientes, estado, honorario, monto, ultimo_movimiento, fecha_inicio, juez_id, juicio, fecha_sentencia } = req.body;
  
          if (!numero || !anio || !demandado_id || !juzgado_id || !Array.isArray(clientes)) {
              return res.status(400).json({
                  error: 'Faltan campos obligatorios',
                  camposRequeridos: ['numero', 'anio', 'demandado', 'juzgado', 'clientes']
              });
          }

          const resultExiste = await pool.request()
          .input('numero', sql.Int, numero)
          .input('anio', sql.Int, anio)
          .input('juzgado_id', sql.Int, juzgado_id)

          .query(`
            SELECT COUNT(*) AS count
            FROM expedientes
            WHERE numero = @numero AND anio = @anio AND juzgado_id = @juzgado_id
          `);

          if (resultExiste.recordset[0].count > 0) {
            return res.status(400).json({
              error: 'Ya existe un expediente con el mismo número, año y juzgado.'
            });
          }


          const result = await pool.request()
          .input('titulo', sql.NVarChar, titulo)
          .input('descripcion', sql.NVarChar, descripcion)
          .input('numero', sql.Int, numero)
          .input('anio', sql.Int, anio)
          .input('demandado_id', sql.Int, demandado_id)
          .input('juzgado_id', sql.Int, juzgado_id)
          .input('estado', sql.NVarChar, estado)
          .input('fecha_inicio', sql.DateTime, fecha_inicio)
          .input('fecha_sentencia', sql.DateTime, fecha_sentencia)
          .input('honorario', sql.NVarChar, honorario)
          .input('juez_id', sql.Int, juez_id)
          .input('juicio', sql.NVarChar, juicio)
          .input('monto', sql.NVarChar, monto)
      
          .query(`
              INSERT INTO expedientes (titulo, descripcion, numero, anio, demandado_id, juzgado_id, fecha_creacion, estado, fecha_inicio, honorario, juez_id, juicio, fecha_sentencia, ultimo_movimiento, monto)
              OUTPUT INSERTED.id
              VALUES (@titulo, @descripcion, @numero, @anio, @demandado_id, @juzgado_id, GETDATE(), @estado, @fecha_inicio, @honorario, @juez_id, @juicio, @fecha_sentencia, @fecha_inicio, @monto)
          `);
      
  
          // Verificar que se insertó el expediente correctamente
          if (!result.recordset || result.recordset.length === 0) {
              return res.status(400).json({ error: 'No se pudo generar el expediente' });
          }
  
          const expedienteId = result.recordset[0].id;
  
          // Insertar los clientes asociados al expediente
          for (const cliente of clientes) {
              await pool.request()
                  .input('id_cliente', sql.Int, cliente.id)
                  .input('id_expediente', sql.Int, expedienteId)
                  .query(`
                      INSERT INTO clientes_expedientes (id_cliente, id_expediente)
                      VALUES (@id_cliente, @id_expediente)
                  `);
          }
        

  
          res.status(201).json({
              message: 'Expediente y clientes agregados correctamente',
              expedienteId
          });
  
      } catch (err) {
          console.error('Error al agregar expediente:', err.message);
          res.status(500).json({
              error: 'Error al agregar expediente',
              message: err.message
          });
      }
  });
  
    
      
      
      

      /*MODIFICAR EXPEDIENTE */
      app.put('/expedientes/modificar/:id', async (req, res) => {
        const { id } = req.params;
        const nuevosDatos = req.body; 
               
        console.log('Datos recibidos para actualizar:', nuevosDatos); // Verifica los datos

        const resultExiste = await pool.request()
        .input('id', sql.Int, id) // Agregamos el id actual
        .input('numero', sql.Int, nuevosDatos.numero)
        .input('anio', sql.Int, nuevosDatos.anio)
        .input('juzgado_id', sql.Int, nuevosDatos.juzgado_id)
        .query(`
            SELECT COUNT(*) AS count
            FROM expedientes
            WHERE numero = @numero 
            AND anio = @anio 
            AND juzgado_id = @juzgado_id
            AND id <> @id  -- Excluir el expediente que se está actualizando
        `);

        if (resultExiste.recordset[0].count > 0) {
          return res.status(400).json({
            error: 'Ya existe un expediente con el mismo número, año y juzgado.'
          });
        }

        try {
          const resultado = await pool.request()
            .input('id', sql.Int, id)
            .input('titulo', sql.NVarChar, nuevosDatos.titulo)
            .input('descripcion', sql.NVarChar, nuevosDatos.descripcion)
            .input('numero', sql.Int, nuevosDatos.numero)
            .input('anio', sql.Int, nuevosDatos.anio)
            .input('juzgado_id', sql.Int, nuevosDatos.juzgado_id)
            .input('demandado_id', sql.Int, nuevosDatos.demandado_id)
            .input('estado', sql.NVarChar, nuevosDatos.estado)
            .input('juez_id', sql.Int, nuevosDatos.juez_id)
            .input('honorario', sql.NVarChar, nuevosDatos.honorario)
            .input('fecha_inicio', sql.DateTime, nuevosDatos.fecha_inicio)
            .input('juicio', sql.NVarChar, nuevosDatos.juicio)
            .input('fecha_sentencia', sql.DateTime, nuevosDatos.fecha_sentencia)
            .input('monto', sql.Int, nuevosDatos.monto)
            .input('apela', sql.Bit, nuevosDatos.apela)


            .query(`
              UPDATE expedientes
              SET 
                titulo = @titulo,
                descripcion = @descripcion,
                numero = @numero,
                anio = @anio,
                juzgado_id = @juzgado_id,
                demandado_id = @demandado_id,
                estado = @estado,
                juez_id = @juez_id,
                honorario = @honorario,
                fecha_inicio = @fecha_inicio,
                juicio = @juicio,
                fecha_sentencia = @fecha_sentencia,
                monto = @monto,
                apela = @apela
              WHERE id = @id
            `);

            //const expedienteId = resultado.recordset[0].id;
  
            
            if (nuevosDatos.clientes.length > 0) {
              for (const cliente of nuevosDatos.clientes) {
                // Realiza la actualización de los clientes si es necesario
                await pool.request()
                  .input('id_expediente', id)
                  .input('id_cliente', cliente.id)
                  .query(`
                    INSERT INTO clientes_expedientes (id_expediente, id_cliente)
                    VALUES (@id_expediente, @id_cliente)
                  `);
              }
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


      app.delete('/expedientes/eliminar/:id_expediente', async (req, res) => {
        const { id_expediente } = req.params;
      
        try {
          // Verificar que el id_expediente es válido
          if (!id_expediente || isNaN(id_expediente)) {
            return res.status(400).json({ error: 'El ID del expediente es obligatorio y debe ser un número válido' });
          }
      
          // Eliminar todos los clientes asociados al expediente
          const result = await pool.request()
            .input('id_expediente', sql.Int, id_expediente)
            .query(`
              DELETE FROM clientes_expedientes
              WHERE id_expediente = @id_expediente
            `);
      
          // Verificar si se eliminó algún registro
          if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: 'Clientes eliminados correctamente del expediente' });
          } else {
            res.status(404).json({ message: 'No se encontraron clientes para eliminar en este expediente' });
          }
        } catch (err) {
          console.error('Error al eliminar clientes del expediente:', err.message);
          res.status(500).json({
            error: 'Error al eliminar clientes del expediente',
            message: err.message
          });
        }
      });
      
      
      
      
      /*  BUSCAR EXPEDIENTES */
      app.get('/expedientes/buscar', async (req, res) => {
        const texto = req.query.texto;  // Obtener el parámetro 'texto' de la URL
        
        try {
          const result = await pool.request()
            .input('texto', sql.NVarChar, `%${texto}%`)
            .query("SELECT * FROM expedientes WHERE numero LIKE @texto");
      
          res.json(result.recordset);  // Retornar los clientes encontrados
        } catch (err) {
          console.error('Error al ejecutar la consulta:', err);
          return res.status(500).send('Error al obtener expedientes');
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

    const result = await pool.request()
      .input('localidad', sql.NVarChar, localidad)
      .input('partido', sql.NVarChar, partido)
      .input('provincia', sql.NVarChar, provincia)
      .query(`
        INSERT INTO localidades (localidad, partido, provincia)
        OUTPUT INSERTED.id  
        VALUES (@localidad, @partido, @provincia)
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
    const { localidad_id, direccion, nombre} = req.body;

    if (!localidad_id) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        camposRequeridos: ['localidad']
      });
    }

    const result = await pool.request()
    .input('localidad_id', sql.Int, Number(localidad_id))
    .input('nombre', sql.NVarChar, nombre) // Se declara la variable @nombre
    .input('direccion', sql.NVarChar, direccion) // Se declara la variable @nombre

    .query(`
        INSERT INTO juzgados (nombre, direccion, localidad_id)
        OUTPUT INSERTED.id  
        VALUES (@nombre, @direccion, @localidad_id)
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
      .query("SELECT * FROM juzgados WHERE estado = 'activo'")  
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
      .query("SELECT * FROM demandados WHERE estado = 'en gestión'")  
      .then(result => {
          res.json(result.recordset);  
      })
      .catch(err => {
          res.status(500).send(err);  
      });
});

app.get("/demandados/:id", async (req, res) => {
  try {
    const expedienteId = req.params.id;

    // Validar que el id sea un número
    if (isNaN(expedienteId)) {
      return res.status(400).json({ error: "El ID proporcionado no es válido" });
    }

    const result = await pool.request()
        .input("id", sql.Int, parseInt(expedienteId)) // Asegurarse de que el ID sea un número entero
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
  
  console.log('ID de la localidad a modificar:', id);
  console.log('Nuevos datos recibidos:', nuevosDatos);

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


app.put('/localidades/modificar/:id', async (req, res) => {
  const { id } = req.params;
  const nuevosDatos = req.body;
  
  console.log('ID de la localidad a modificar:', id);
  console.log('Nuevos datos recibidos:', nuevosDatos);

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
  
  console.log('ID del juzgado a modificar:', id);
  console.log('Nuevos datos recibidos:', nuevosDatos);

  try {
      const resultado = await pool.request()
          .input('id', sql.Int, id)
          .input('localidad_id', sql.Int, nuevosDatos.localidad_id)
          .input('nombre', sql.NVarChar, nuevosDatos.nombre)
          .input('direccion', sql.NVarChar, nuevosDatos.direccion)
          .input('estado', sql.NVarChar, nuevosDatos.estado)
          .query(`
              UPDATE juzgados
              SET localidad_id = @localidad_id,
                  nombre = @nombre,
                  direccion = @direccion,
                  estado = @estado
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
          .query(`
              UPDATE demandados
              SET nombre = @nombre,
                  estado = @estado
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
    const { nombre, estado} = req.body;

    if (!nombre) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        camposRequeridos: ['nombre']
      });
    }

    const result = await pool.request()
    .input('nombre', sql.NVarChar, nombre)
    .input('estado', sql.NVarChar, 'en gestión')
    .query(`
        INSERT INTO demandados (nombre, estado)
        OUTPUT INSERTED.id  
        VALUES (@nombre, @estado)
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
    const expedientesEnGestion = result.recordset.filter(exp => exp.estado === 'en gestión');

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

//TERMINAR// HACER LA MISMA PARA EXPEDIENTES Y CLIENTES
// 
/* 
app.get("/juzgados/localidades", async (req, res) => {
  const { id } = req.query;

  try {
    const result = await pool.request()
      .input("localidadId", sql.Int, id) // 🔹 Asegurar que se pasa como Int
      .query("SELECT * FROM juzgados WHERE localidad_id = @localidadId");

    // Filtrar expedientes en gestión
    const expedientesEnGestion = result.recordset.filter(exp => exp.estado === 'activo');

    res.json(expedientesEnGestion);  // Devolver solo los expedientes en gestión
  } catch (err) {
    console.error("Error al obtener juzgados:", err);
    res.status(500).send("Error al obtener los juzgados.");
  }
});*/

// funciona
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




app.get("/juez", async (req, res) => {
  try {
      const result = await pool.request().query("SELECT * FROM juez");
      res.json(result.recordset);
  } catch (err) {
      console.error("Error al obtener expedientes:", err);
      res.status(500).send(err);
  }
});

       

app.get("/expedientes/buscarPorNumeroyAnio", async (req, res) => {
  try {
      const { numero, anio, juzgado_id } = req.query; 

      if (!numero || !anio) {
          return res.status(400).json({ error: "Se requieren 'numero' y 'anio'." });
      }

      const result = await pool
          .request()
          .input("numero", sql.Int, numero)
          .input("anio", sql.Int, anio)
          .input("juzgado_id", sql.Int, juzgado_id)

          .query("SELECT * FROM expedientes WHERE estado != 'eliminado' AND numero = @numero AND anio = @anio AND juzgado_id = @juzgado_id");

      res.json(result.recordset);
  } catch (err) {
      console.error("Error al obtener expedientes:", err);
      res.status(500).send(err);
  }
});

app.get("/expedientes/buscarPorEstado", async (req, res) => {
  try {
      const { estado } = req.query; 

      if (!numero || !anio) {
          return res.status(400).json({ error: "Se requieren 'numero' y 'anio'." });
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
});


             // Iniciar el servidor
      app.listen(3000, () => {
      console.log("Servidor corriendo en http://localhost:3000");
      });     

    })
    .catch(err => {
        console.error("Error conectando a SQL Server:", err);  
    });
