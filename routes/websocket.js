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
        handleNewAssessment(wss, ws, data.assessment);
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
          sendLoginResponse(ws, false, 'You have already taken this assessment.');
        } else {
          sendLoginResponse(ws, true, 'Login successful', {
            studentNumber: rows[0].studentNumber,
            email: rows[0].email,
            firstName: rows[0].firstName,
            lastName: rows[0].lastName,
            section: rows[0].section
          });
        }
      } else {
        sendLoginResponse(ws, false, 'Invalid student number or password');
      }
    } else {
      sendLoginResponse(ws, false, 'Invalid student number or password');
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
const sendLoginResponse = (ws, success, message, data = null) => {
  ws.send(JSON.stringify({
    type: 'loginResponse',
    success,
    message,
    data
  }));
};



// New function to handle assessment creation and validation
const handleNewAssessment = async (wss, ws, assessment) => {
  try {
    // Check if assessment with same ID already exists
    const existingAssessment = activeAssessments.find(a => a.id === assessment.id);

    if (existingAssessment) {
      ws.send(JSON.stringify({
        type: 'assessmentError',
        message: 'An assessment with this ID is already active'
      }));
      return;
    }

    // Check if assessment exists in the database
    const [rows] = await pool.query('SELECT * FROM assessment_results WHERE assessment_id = ?', [assessment.id]);

    if (rows.length > 0) {
      ws.send(JSON.stringify({
        type: 'assessmentError',
        message: 'This assessment has already been completed by some students'
      }));
      return;
    }

    // If all checks pass, add to active assessments and broadcast
    activeAssessments.push(assessment);
    broadcastAssessment(wss, assessment);

    ws.send(JSON.stringify({
      type: 'assessmentConfirmation',
      success: true,
      message: 'Assessment successfully distributed'
    }));
  } catch (error) {
    console.error('Error handling new assessment:', error);
    ws.send(JSON.stringify({
      type: 'assessmentError',
      message: 'Failed to process assessment'
    }));
  }
};

// Updated broadcastAssessment function
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
