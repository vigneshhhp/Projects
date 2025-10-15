const express = require('express');
const db = require('../lib/db');

const router = express.Router();

router.get('/profile', async (req, res) => {
  const { customerId } = req.user;
  try {
    const result = await db.query(
      'SELECT customer_id, name, email, phone_no, address FROM customer WHERE customer_id=?',
      [customerId]
    );
    if (result.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile', async (req, res) => {
  const { customerId } = req.user;
  const { name, phone_no, address } = req.body || {};
  try {
    await db.query(
      'UPDATE customer SET name=IFNULL(?, name), phone_no=IFNULL(?, phone_no), address=IFNULL(?, address) WHERE customer_id=?',
      [name || null, phone_no || null, address || null, customerId]
    );
    const out = await db.query('SELECT customer_id, name, email, phone_no, address FROM customer WHERE customer_id=?', [customerId]);
    res.json(out[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


