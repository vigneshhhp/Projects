const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../lib/db');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, phone_no, address, password } = req.body || {};
  if (!name || !email || !phone_no || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO customer (name, email, phone_no, address, password_hash) VALUES (?,?,?,?,?)',
      [name, email, phone_no, address || null, hashed]
    );
    const customerId = result.insertId;
    const token = jwt.sign({ customerId }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    return res.json({ token });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  try {
    const result = await db.query('SELECT customer_id, password_hash FROM customer WHERE email=?', [email]);
    if (result.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const { customer_id, password_hash } = result[0];
    const ok = await bcrypt.compare(password, password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ customerId: customer_id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


