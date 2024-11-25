import { Router } from 'express';
const router = Router();
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  port: process.env.PORT,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
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
router.get('/assessments', async (_req, res) => {
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

router.get('/finished', async (_req, res) => {
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


// Router to deleteFinishedAssessment
router.post('/deleteFinished', async (req, res) => {
  const { assessmentId } = req.body;
  try {
    await pool.query('DELETE assessment_results, assessments FROM assessment_results INNER JOIN assessments ON assessment_results.assessment_id = assessments.id WHERE assessments.id = ?', [assessmentId]);

    res.json({
      success: true,
      message: 'Finished assessment deleted successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get data to give to the dashboard
router.get('/dashboard', async (_req, res) => {
  try {
    const [assessments] = await pool.query('SELECT * FROM assessments');
    const [results] = await pool.query('SELECT * FROM assessment_results');
    const [students] = await pool.query('SELECT * FROM students');
    res.json({ assessments, results, students });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get the Highest ranking of the students
router.get('/rankings', async (_req, res) => {
  try {
    const [rows] = await pool.query('select students.studentNumber, students.firstName, students.lastName, max(assessment_results.score) as highest_score from assessment_results inner join students on assessment_results.student_number = students.studentNumber group by students.studentNumber order by highest_score desc limit 10');
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Endpoint to get all the records in the assessment_results table
router.get('/assessment_results', async (_req, res) => {
  try {
    const [rows] = await pool.query('select * from assessment_results');
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT endpoint to update score
router.put('/results/:id', async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;
  
  try {
    await pool.query('UPDATE assessment_results SET score = ? WHERE id = ?', [score, id]);
    res.json({ message: 'Score updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE endpoint to remove record
router.delete('/results/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM assessment_results WHERE id = ?', [id]);
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Array to store users who pressed Home or Recent apps
let usersWhoPressedHomeOrRecent = [];
let restrictedUsers = [];

// Endpoint to receive activity
router.post('/detected', (req, res) => {
  const { activity, user } = req.body;
  console.log('Activity:', activity);
  console.log('User:', user);
  if (activity === "home_or_recent_apps_pressed") {
    // Log the user who pressed the Home or Recent apps button
    //console.log(`User ${user.name} (ID: ${user.id}) pressed Home or Recent Apps`);

    // Check if the user is already in the array
    const userExists = usersWhoPressedHomeOrRecent.some(u => u.id === user.id);

    // If the user is not in the array, add them
    if (!userExists) {
      usersWhoPressedHomeOrRecent.push(user);
    }

    // Optionally, log the current list of users who pressed Home/Recent
    console.log("Users who pressed Home or Recent Apps:", usersWhoPressedHomeOrRecent);
  }

  if (activity === "restrictUser") {
    // console log the restricted user
    console.log(`User ${user.firstName} (Student Number: ${user.studentNumber}) has been restricted`);
    // Check if the user is already in the Array
    const userExists = restrictedUsers.some(u => u.studentNumber === user.studentNumber);
    // If the user is not in the array, add them
    if (!userExists) {
      restrictedUsers.push(user);
    }
    // Optionally, log the current list of restricted users
    console.log("Restricted Users:", restrictedUsers);

  }
  res.json({ message: 'Activity received' });
});

// Endpoint to get all the restricted users
router.get('/restrictedUsers', (req, res) => {
  res.json(restrictedUsers);
});

// Endpoint to reset the restricted users
router.post('/resetRestrictedUsers', (req, res) => {
  restrictedUsers = [];
  res.json({ message: 'Restricted users reset' });
});



// Cancel an active assessment
router.post('/cancel', (req, res) => {
  const { assessmentId } = req.body;

  // Remove from active assessments in the main router
  activeAssessments = activeAssessments.filter(a => a.id !== assessmentId);

  res.json({
    success: true,
    message: 'Assessment cancelled successfully'
  });
});

// Add a user to restricted list
router.post('/restrict', (req, res) => {
  const { studentNumber, reason } = req.body;

  // Check if already restricted
  const existingRestriction = restrictedUsers.find(u => u.studentNumber === studentNumber);
  if (existingRestriction) {
    return res.status(400).json({
      success: false,
      message: 'User is already restricted'
    });
  }

  restrictedUsers.push({
    studentNumber,
    reason,
    restrictedAt: new Date()
  });

  res.json({
    success: true,
    message: 'User restricted successfully'
  });
});

// Remove restriction for a user
router.post('/unrestrict', (req, res) => {
  const { studentNumber } = req.body;

  restrictedUsers = restrictedUsers.filter(u => u.studentNumber !== studentNumber);

  res.json({
    success: true,
    message: 'User restriction removed successfully'
  });
});

export default router;
