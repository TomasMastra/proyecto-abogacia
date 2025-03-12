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
                .query("SELECT * FROM clientes")  
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
                const result = await pool.request().query("SELECT * FROM expedientes");
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
                .query("SELECT * FROM clientes WHERE nombre LIKE @texto OR apellido LIKE @texto");
          
              res.json(result.recordset);
            } catch (err) {
              console.error('Error al ejecutar la consulta:', err);
              return res.status(500).send('Error al obtener clientes');
            }
          });


          app.post('/clientes/agregar', async (req, res) => {
            try {
              const { nombre, apellido, dni, telefono, direccion, fecha_nacimiento, email } = req.body;
          
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
                .query(`
                  INSERT INTO clientes (nombre, apellido, dni, telefono, direccion, fecha_nacimiento, email)
                  OUTPUT INSERTED.id  -- Esto devuelve el id del nuevo cliente insertado
                  VALUES (@nombre, @apellido, @dni, @telefono, @direccion, @fecha_nacimiento, @email)
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
                    .query(`
                        UPDATE Clientes
                        SET nombre = @nombre,
                            apellido = @apellido,
                            email = @email,
                            telefono = @telefono,
                            fecha_nacimiento = @fecha_nacimiento,
                            dni = @dni
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
          const { titulo, descripcion, demandado_id, juzgado_id, numero, anio, clientes } = req.body;
  
          if (!numero || !anio || !demandado_id || !juzgado_id || !Array.isArray(clientes)) {
              return res.status(400).json({
                  error: 'Faltan campos obligatorios',
                  camposRequeridos: ['numero', 'anio', 'demandado', 'juzgado', 'clientes']
              });
          }
  
          const result = await pool.request()
              .input('titulo', sql.NVarChar, titulo)
              .input('descripcion', sql.NVarChar, descripcion)
              .input('numero', sql.Int, numero)
              .input('anio', sql.Int, anio)
              .input('demandado_id', sql.Int, demandado_id)
              .input('juzgado_id', sql.Int, juzgado_id)
              .query(`
                  INSERT INTO expedientes (titulo, descripcion, numero, anio, demandado_id, juzgado_id, fecha_creacion)
                  OUTPUT INSERTED.id
                  VALUES (@titulo, @descripcion, @numero, @anio, @demandado_id, @juzgado_id, GETDATE())
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
        
        console.log('ID del expediente a modificar:', id);
        console.log('Nuevos datos recibidos:', nuevosDatos); 
        

        
        try {
          const resultado = await pool.request()
            .input('id', sql.Int, id)
            .input('titulo', sql.NVarChar, nuevosDatos.titulo) 
            .input('descripcion', sql.NVarChar, nuevosDatos.descripcion)
            .input('numero', sql.Int, nuevosDatos.numero)
            .input('anio', sql.Int, nuevosDatos.anio)            
            .input('juzgado_id', sql.Int, nuevosDatos.juzgado_id)  
            .input('demandado_id', sql.Int, nuevosDatos.demandado_id)
            .query(`
              UPDATE expedientes
              SET 
                titulo = @titulo,
                descripcion = @descripcion,
                numero = @numero,
                anio = @anio,
                juzgado_id = @juzgado_id,
                demandado_id = @demandado_id
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
            .query("SELECT * FROM expedientes WHERE titulo LIKE @texto");
      
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
      .query("SELECT * FROM localidades ORDER BY localidad")  
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
      .query("SELECT * FROM juzgados")  
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
      .query("SELECT * FROM demandados")  
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

          
             // Iniciar el servidor
      app.listen(3000, () => {
      console.log("Servidor corriendo en http://localhost:3000");
      });     

    })
    .catch(err => {
        console.error("Error conectando a SQL Server:", err);  
    });
