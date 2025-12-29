const express = require('express');
const router = express.Router();
const { Producto } = require('../models');

router.get('/', async (req, res) => {
  try {
    const productos = await Producto.findAll({
      order: [['id', 'DESC']]
    });
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});


router.post('/', async (req, res) => {
  try {
    const { nombre, precio } = req.body;

    const producto = await Producto.create({
      nombre,
      precio
    });

    res.json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear producto' });
  }
});


module.exports = router;
