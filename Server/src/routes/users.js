const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Create
router.post('/', async (req, res) => {
  try {
    const { name, age, date_of_birth, favorite_food } = req.body;
    const result = await pool.query(
      'INSERT INTO users (name, age, date_of_birth, favorite_food) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, age, date_of_birth, favorite_food]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
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
    const { name, age, date_of_birth, favorite_food } = req.body;
    const result = await pool.query(
      'UPDATE users SET name=$1, age=$2, date_of_birth=$3, favorite_food=$4 WHERE id=$5 RETURNING *',
      [name, age, date_of_birth, favorite_food, req.params.id]
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
    const result = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

