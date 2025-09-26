const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Create
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/products request received:', req.body);
    const { idProject, product_name, product_description, product_priority, start_date, end_date } = req.body;
    
    if (!product_name) {
      return res.status(400).json({ 
        error: 'Product name is required' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO products (idProject, product_name, product_description, product_priority, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [idProject || null, product_name, product_description, product_priority || 1, start_date, end_date]
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
    const result = await pool.query('SELECT * FROM products ORDER BY productID DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE productID = $1', [req.params.id]);
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
    const { idProject, product_name, product_description, product_priority, start_date, end_date } = req.body;
    const result = await pool.query(
      'UPDATE products SET idProject=$1, product_name=$2, product_description=$3, product_priority=$4, start_date=$5, end_date=$6, updated_at=NOW() WHERE productID=$7 RETURNING *',
      [idProject, product_name, product_description, product_priority, start_date, end_date, req.params.id]
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
    const result = await pool.query('DELETE FROM products WHERE productID = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
