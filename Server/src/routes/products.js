const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Create
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/products request received:', req.body);
    const { name, price, category, stock_quantity, description, status } = req.body;
    
    if (!name || !price || !category) {
      return res.status(400).json({ 
        error: 'Name, price, and category are required' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO products (name, price, category, stock_quantity, description, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, price, category, stock_quantity || 0, description, status || 'active']
    );
    console.log('Product created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const { name, price, category, stock_quantity, description, status } = req.body;
    const result = await pool.query(
      'UPDATE products SET name=$1, price=$2, category=$3, stock_quantity=$4, description=$5, status=$6 WHERE id=$7 RETURNING *',
      [name, price, category, stock_quantity, description, status, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
