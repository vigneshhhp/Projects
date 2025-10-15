const express = require('express');
const db = require('../lib/db');

const router = express.Router();

// Get service history for a vehicle owned by current user
router.get('/vehicle/:vehicle_id', async (req, res) => {
  const { customerId } = req.user;
  const { vehicle_id } = req.params;
  try {
    const owner = await db.query('SELECT vehicle_id FROM vehicle WHERE vehicle_id=? AND customer_id=?', [vehicle_id, customerId]);
    if (owner.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    const result = await db.query(
      'SELECT * FROM service WHERE vehicle_id=? ORDER BY service_date DESC, service_id DESC',
      [vehicle_id]
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a service record for a vehicle
router.post('/vehicle/:vehicle_id', async (req, res) => {
  const { customerId } = req.user;
  const { vehicle_id } = req.params;
  const { service_date, description, status } = req.body || {};
  if (!service_date || !description) return res.status(400).json({ error: 'service_date and description required' });
  try {
    const owner = await db.query('SELECT vehicle_id FROM vehicle WHERE vehicle_id=? AND customer_id=?', [vehicle_id, customerId]);
    if (owner.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    const result = await db.query(
      'INSERT INTO service (vehicle_id, service_date, description, status) VALUES (?,?,?,?)',
      [vehicle_id, service_date, description, status || 'Scheduled']
    );
    const inserted = await db.query('SELECT * FROM service WHERE service_id=?', [result.insertId]);
    res.status(201).json(inserted[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


