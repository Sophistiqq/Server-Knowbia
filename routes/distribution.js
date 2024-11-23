import express from 'express';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const router = express.Router();

// Create a connection pool
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

// Store active assessments in memory
let activeAssessments = [];

// Registration route
router.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    const [rows] = await pool.query('SELECT * FROM students WHERE studentNumber = ?', [userData.studentNumber]);

    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const insertQuery = `
      INSERT INTO students (studentNumber, email, password, firstName, lastName, section)
      VALUES (?, ?, ?, ?, ?, ?)`;
    
    await pool.execute(insertQuery, [
      userData.studentNumber,
      userData.email,
      hashedPassword,
      userData.firstName,
      userData.lastName,
      userData.section
    ]);

    res.status(201).json({
      success: true,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: error
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const loginData = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE studentNumber = ?', [loginData.studentNumber]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid student number or password'
      });
    }

    const match = await bcrypt.compare(loginData.password, rows[0].password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid student number or password'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        studentNumber: rows[0].studentNumber,
        email: rows[0].email,
        firstName: rows[0].firstName,
        lastName: rows[0].lastName,
        section: rows[0].section
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed due to server error'
    });
  }
});

router.post('/status/:assessmentId', async (req, res) => {
  const { studentNumber } = req.body;
  const { assessmentId } = req.params;
  try {
    // Check if user is restricted
    const restrictedResponse = await fetch('http://localhost:3000/assessments/restrictedUsers');
    const restrictedUsers = await restrictedResponse.json();
    const isRestricted = restrictedUsers.some(u => u.studentNumber === studentNumber);
    
    if (isRestricted) {
      return res.status(403).json({
        success: false,
        message: 'You are restricted from taking assessments'
      });
    }

    // Check if student has already taken the assessment
    const [assessmentResults] = await pool.query(
      'SELECT * FROM assessment_results WHERE student_number = ? AND assessment_id = ?',
      [studentNumber, assessmentId]
    );

    if (assessmentResults.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already taken this assessment.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'You are eligible to take the assessment'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed due to server error'
    });
  }
});
// Get active assessments
router.get('/assessments', (req, res) => {
  res.json({
    success: true,
    assessments: activeAssessments
  });
});

// Create new assessment
router.post('/assessments', async (req, res) => {
  try {
    const assessment = req.body;

    // Check if assessment with same ID already exists
    const existingAssessment = activeAssessments.find(a => a.id === assessment.id);
    if (existingAssessment) {
      return res.status(400).json({
        success: false,
        message: 'An assessment with this ID is already active'
      });
    }

    // Check if assessment exists in the database
    const [rows] = await pool.query('SELECT * FROM assessment_results WHERE assessment_id = ?', [assessment.id]);
    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This assessment has already been completed by some students'
      });
    }

    // Add to active assessments
    activeAssessments.push(assessment);

    res.status(201).json({
      success: true,
      message: 'Assessment successfully created',
      assessment
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assessment'
    });
  }
});

// Submit assessment results
router.post('/results', async (req, res) => {
  try {
    const { result } = req.body;
    const { studentNumber, assessmentId, score, answers } = result;
    const insertQuery = `
      INSERT INTO assessment_results (student_number, assessment_id, score, answers)
      VALUES (?, ?, ?, ?)
    `;
    await pool.execute(insertQuery, [studentNumber, assessmentId, score, JSON.stringify(answers)]);

    res.status(201).json({
      success: true,
      message: 'Result stored successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error
    });
  }
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
// Optional: Clear assessment (for cleanup)
router.delete('/assessments/:id', (req, res) => {
  const assessmentId = req.body.id;
  activeAssessments = activeAssessments.filter(a => a.id !== assessmentId);
  
  res.json({
    success: true,
    message: 'Assessment removed successfully'
  });
});

export default router;
