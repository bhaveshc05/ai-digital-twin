const db = require('../db');

// GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const result = await db.query('SELECT student_id, email, full_name, board, grade, date_of_birth, guardian_email, created_at FROM students ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/students (Signup)
exports.createStudent = async (req, res) => {
  const { name, full_name, email, password, board, grade, dateOfBirth, date_of_birth, guardianEmail, guardian_email } = req.body;
  const studentName = full_name || name;
  const dob = date_of_birth || dateOfBirth;
  const parentEmail = guardian_email || guardianEmail;
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  if (!cleanEmail || !studentName) {
    return res.status(400).json({ success: false, error: 'email and name are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO students (email, full_name, password_hash, board, grade, date_of_birth, guardian_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         password_hash = COALESCE(EXCLUDED.password_hash, students.password_hash),
         board = EXCLUDED.board,
         grade = EXCLUDED.grade,
         date_of_birth = EXCLUDED.date_of_birth,
         guardian_email = EXCLUDED.guardian_email
       RETURNING student_id, email, full_name, board, grade, date_of_birth, guardian_email, created_at`,
      [cleanEmail, studentName, password || null, board || null, grade || null, dob || null, parentEmail || null]
    );

    console.log(`[Database] Student profile saved to PostgreSQL (twin_db): ${cleanEmail}`);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error saving student to PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/login (Authentication against PostgreSQL)
exports.loginStudent = async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  if (!cleanEmail || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM students WHERE LOWER(TRIM(email)) = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'No account found with this email. Please sign up first!' });
    }

    const student = result.rows[0];

    // If password_hash is stored, check match (or match directly)
    if (student.password_hash && student.password_hash !== password) {
      return res.status(401).json({ success: false, error: 'Invalid password!' });
    }

    const { password_hash, ...studentProfile } = student;
    res.json({ success: true, message: 'Login successful!', user: studentProfile });
  } catch (err) {
    console.error('Error logging in student:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
