const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Create
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/product-properties request received:', req.body);
    const { product_id, property_id, property_name, property_value, property_description } = req.body;
    
    if (!product_id || !property_id || !property_name || !property_value) {
      return res.status(400).json({ 
        error: 'Product ID, Property ID, Property Name, and Property Value are required' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO product_properties (product_id, property_id, property_name, property_value, property_description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [product_id, property_id, property_name, property_value, property_description]
    );
    console.log('Product property created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product property:', err);
    if (err.code === '23505') { // Unique violation
      res.status(409).json({ error: 'This property is already assigned to this product' });
    } else if (err.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'Invalid product ID or property ID' });
    } else {
      res.status(500).json({ error: 'Internal server error: ' + err.message });
    }
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product_properties ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read by product ID
router.get('/product/:productId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM product_properties WHERE product_id = $1 ORDER BY created_at DESC',
      [req.params.productId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product_properties WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Product property not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const { property_value, property_description } = req.body;
    const result = await pool.query(
      'UPDATE product_properties SET property_value=$1, property_description=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [property_value, property_description, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Product property not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM product_properties WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Product property not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
