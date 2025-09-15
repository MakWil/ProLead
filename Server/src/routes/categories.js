const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Create
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/categories request received:', req.body);
    const { name, description, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO categories (name, description, status) VALUES ($1, $2, $3) RETURNING *',
      [name, description, status || 'active']
    );
    console.log('Category created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating category:', err);
    if (err.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Category name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error: ' + err.message });
    }
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
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
    const { name, description, status } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name=$1, description=$2, status=$3 WHERE id=$4 RETURNING *',
      [name, description, status, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Category name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
