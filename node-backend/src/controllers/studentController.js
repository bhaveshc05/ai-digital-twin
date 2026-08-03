const db = require('../db');

// GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM students ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/students
exports.createStudent = async (req, res) => {
  const { email, full_name } = req.body;
  if (!email || !full_name) {
    return res.status(400).json({ success: false, error: 'email and full_name are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO students (email, full_name) VALUES ($1, $2) RETURNING *',
      [email, full_name]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
