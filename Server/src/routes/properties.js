const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Create
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/properties request received:', req.body);
    const { property_name, property_description, property_priority } = req.body;
    
    if (!property_name) {
      return res.status(400).json({ error: 'Property name is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO properties (property_name, property_description, property_priority) VALUES ($1, $2, $3) RETURNING *',
      [property_name, property_description, property_priority || 0]
    );
    console.log('Property created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating property:', err);
    if (err.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Property name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error: ' + err.message });
    }
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM properties ORDER BY property_priority ASC, property_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM properties WHERE property_id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Property not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const { property_name, property_description, property_priority } = req.body;
    const result = await pool.query(
      'UPDATE properties SET property_name=$1, property_description=$2, property_priority=$3, updated_at=NOW() WHERE property_id=$4 RETURNING *',
      [property_name, property_description, property_priority, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Property not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Property name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM properties WHERE property_id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Property not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
