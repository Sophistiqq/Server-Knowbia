import { Router } from 'express';
const router = Router();
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: "localhost",
  user: "roi",
  port: 3306,
  database: "knowbia",
  password: "123",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

//  endpoint to create a new assessment
router.post('/assessments', async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    const [result] = await pool.query(
      'INSERT INTO assessments (title, description, questions) VALUES (?, ?, ?)',
      [title, description, JSON.stringify(questions)]
    );
    res.json({ id: result.insertId, message: 'Assessment created successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//  endpoint to get all assessments
router.get('/assessments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, description FROM assessments');
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//  endpoint to get a specific assessment
router.get('/assessments/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM assessments WHERE id = ?', [req.params.id]);
    if (rows.length > 0) {
      const assessment = rows[0];
      assessment.questions = JSON.parse(assessment.questions);
      res.json(assessment);
    } else {
      res.status(404).json({ error: 'Assessment not found' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//  endpoint to update an assessment
router.put('/assessments/:id', async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    await pool.query(
      'UPDATE assessments SET title = ?, description = ?, questions = ? WHERE id = ?',
      [title, description, JSON.stringify(questions), req.params.id]
    );
    res.json({ message: 'Assessment updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//  endpoint to delete an assessment
router.delete('/assessments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM assessments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TODO: ADD A ROUTE FOR GETTING ALL THE STUDENTS THAT TOOK THE ASSESSMENTS

export default router;
