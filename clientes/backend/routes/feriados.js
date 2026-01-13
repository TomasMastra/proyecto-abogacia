// backend/routes/feriados.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/feriados', async (req, res) => {
  const apiKey = '9ZdrccexJYcmxPw7kSRQUHgwsaalhTbG'; // 🔑 reemplazá con tu clave real
  const fechaBase = new Date(req.query.fecha);

  if (!fechaBase || isNaN(fechaBase)) {
    return res.status(400).json({ error: 'Fecha inválida' });
  }

  const años = [fechaBase.getFullYear(), fechaBase.getFullYear() + 1];
  const pais = 'AR';

  try {
    const promesas = años.map((anio) =>
      axios.get(`https://calendarific.com/api/v2/holidays`, {
        params: {
          api_key: apiKey,
          country: pais,
          year: anio
        }
      })
    );

    const resultados = await Promise.all(promesas);

    const feriados = resultados.flatMap(resp =>
      resp.data.response.holidays
        .filter(h => h.type.includes('National holiday'))
        .map(h => h.date.iso) // devuelve en formato 'YYYY-MM-DD'
    );

    res.json(feriados);
  } catch (error) {
    console.error('Error al obtener feriados:', error);
    res.status(500).json({ error: 'No se pudieron obtener los feriados' });
  }
});

export default router;
