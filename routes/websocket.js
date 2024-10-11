import WebSocket from 'ws';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

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

// Global variable to store active assessments
let activeAssessments = [];

// WebSocket Server Setup
const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    // Send active assessments to newly connected client
    if (activeAssessments.length > 0) {
      ws.send(JSON.stringify({ type: 'activeAssessments', assessments: activeAssessments }));
    }

    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      // handle ping from heartbeat
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }

      // Handle incoming messages
      if (data.type === 'register') {
        handleRegistration(ws, data.data);
      } else if (data.type === 'login') {
        handleLogin(ws, data.data);
      } else if (data.type === 'newAssessment') {
        activeAssessments.push(data.assessment); // Store the new assessment
        broadcastAssessment(wss, data.assessment);
      } else if (data.type === 'studentResult') {
        handleStudentResult(ws, data.result);
      }
    });
  });

  console.log('WebSocket server is running');
};

// Handle registration
const handleRegistration = async (ws, userData) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE studentNumber = ?', [userData.studentNumber]);

    if (rows.length > 0) {
      ws.send(JSON.stringify({
        type: 'registerResponse',
        result: { success: false, message: 'User already exists' }
      }));
    } else {
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

      ws.send(JSON.stringify({
        type: 'registerResponse',
        result: { success: true, message: 'Registration successful' }
      }));
    }
  } catch (error) {
    console.error('Database error:', error);
    ws.send(JSON.stringify({
      type: 'registerResponse',
      result: { success: false, message: 'Registration failed' }
    }));
  }
};

// Handle login
const handleLogin = async (ws, loginData) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE studentNumber = ?', [loginData.studentNumber]);

    if (rows.length > 0) {
      const match = await bcrypt.compare(loginData.password, rows[0].password);
      if (match) {
        // Check if the student has already taken the assessment
        const [assessmentResults] = await pool.query(
          'SELECT * FROM assessment_results WHERE student_number = ? AND assessment_id = ?',
          [loginData.studentNumber, loginData.assessmentId]
        );

        if (assessmentResults.length > 0) {
          ws.send(JSON.stringify({
            type: 'loginResponse',
            success: false,
            message: 'You have already taken this assessment.'
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'loginResponse',
            success: true,
            message: 'Login successful',
            data: {
              studentNumber: rows[0].studentNumber,
              email: rows[0].email,
              firstName: rows[0].firstName,
              lastName: rows[0].lastName,
              section: rows[0].section
            }
          }));
        }
      } else {
        ws.send(JSON.stringify({
          type: 'loginResponse',
          success: false,
          message: 'Invalid student number or password'
        }));
      }
    } else {
      ws.send(JSON.stringify({
        type: 'loginResponse',
        success: false,
        message: 'Invalid student number or password'
      }));
    }
  } catch (error) {
    console.error('Database error:', error);
    ws.send(JSON.stringify({
      type: 'loginResponse',
      success: false,
      message: 'Login failed due to server error'
    }));
  }
};

// Broadcast assessment to all clients except the sender
const broadcastAssessment = (wss, assessment) => {
  const assessmentData = JSON.stringify({
    type: 'newAssessment',
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      questions: assessment.questions,
      timeLimit: assessment.timeLimit
    }
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(assessmentData);
    }
  });
};



const handleStudentResult = async (ws, resultData) => {
  try {
    const { studentNumber, assessmentId, score, answers } = resultData;

    // Store the result in the database
    const insertQuery = `
      INSERT INTO assessment_results (student_number, assessment_id, score, answers)
      VALUES (?, ?, ?, ?)
    `;
    await pool.execute(insertQuery, [studentNumber, assessmentId, score, JSON.stringify(answers)]);

    ws.send(JSON.stringify({
      type: 'resultConfirmation',
      success: true,
      message: 'Result stored successfully'
    }));
  } catch (error) {
    console.error('Database error:', error);
    ws.send(JSON.stringify({
      type: 'resultConfirmation',
      success: false,
      message: 'Failed to store result'
    }));
  }
};

export default setupWebSocket;
