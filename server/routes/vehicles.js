const express = require('express');
const db = require('../lib/db');

const router = express.Router();

// Create vehicle
router.post('/', async (req, res) => {
  const { customerId } = req.user;
  const { vehicle_type, license_no, year, brand, model } = req.body || {};
  if (!license_no) return res.status(400).json({ error: 'license_no is required' });
  try {
    const result = await db.query(
      'INSERT INTO vehicle (customer_id, vehicle_type, license_no, year, brand, model) VALUES (?,?,?,?,?,?)',
      [customerId, vehicle_type || null, license_no, year || null, brand || null, model || null]
    );
    const inserted = await db.query('SELECT * FROM vehicle WHERE vehicle_id=?', [result.insertId]);
    res.status(201).json(inserted[0]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'License number already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// List vehicles
router.get('/', async (req, res) => {
  const { customerId } = req.user;
  try {
    const result = await db.query('SELECT * FROM vehicle WHERE customer_id=? ORDER BY vehicle_id DESC', [customerId]);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update vehicle
router.put('/:vehicle_id', async (req, res) => {
  const { customerId } = req.user;
  const { vehicle_id } = req.params;
  const { vehicle_type, license_no, year, brand, model } = req.body || {};
  try {
    // Ensure ownership
    const owner = await db.query('SELECT vehicle_id FROM vehicle WHERE vehicle_id=? AND customer_id=?', [vehicle_id, customerId]);
    if (owner.length === 0) return res.status(404).json({ error: 'Not found' });
    await db.query(
      'UPDATE vehicle SET vehicle_type=IFNULL(?,vehicle_type), license_no=IFNULL(?,license_no), year=IFNULL(?,year), brand=IFNULL(?,brand), model=IFNULL(?,model) WHERE vehicle_id=?',
      [vehicle_type || null, license_no || null, year || null, brand || null, model || null, vehicle_id]
    );
    const updated = await db.query('SELECT * FROM vehicle WHERE vehicle_id=?', [vehicle_id]);
    res.json(updated[0]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'License number already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete vehicle
router.delete('/:vehicle_id', async (req, res) => {
  const { customerId } = req.user;
  const { vehicle_id } = req.params;
  try {
    const del = await db.query('DELETE FROM vehicle WHERE vehicle_id=? AND customer_id=?', [vehicle_id, customerId]);
    // mysql2 returns result object for execute, but our wrapper returns rows; for DELETE it's ok to check affectedRows via a second query
    const left = await db.query('SELECT 1 FROM vehicle WHERE vehicle_id=? AND customer_id=?', [vehicle_id, customerId]);
    if (left.length !== 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


