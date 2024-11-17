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
    const [rows] = await pool.query('SELECT * FROM assessments');
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


// endpoint for getting assessment results based on assessment id
router.get('/assessments/:id/results', async (req, res) => {
  try {
    //const [rows] = await pool.query('select * from assessment_results where assessment_id = ?', [req.params.id]);
    // select all from assessment_results and the student_number in there should be used to get the lastname of the student from the students table
    const [rows] = await pool.query('select assessment_results.*, students.lastName from assessment_results inner join students on assessment_results.student_number = students.studentNumber where assessment_id = ?', [req.params.id]);
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// endpoint for getting all finished assessments, and get the title from assessments table

router.get('/finished', async (req, res) => {
  try {
    const [rows] = await pool.query('select assessments.title, assessment_results.*, students.firstName, students.lastName from assessments inner join assessment_results on assessments.id = assessment_results.assessment_id inner join students on assessment_results.student_number = students.studentNumber');
    const combinedResults = rows.reduce((acc, row) => {
      const { assessment_id, title, firstName, lastName, ...rest } = row;
      if (!acc[assessment_id]) {
        acc[assessment_id] = { assessment_id, title, results: [] };
      }
      acc[assessment_id].results.push({ ...rest, firstName, lastName, studentName: `${firstName} ${lastName}` });
      return acc;
    }, {});
    res.json(Object.values(combinedResults));
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
