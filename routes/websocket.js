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
    console.log('Client connected');

    // Send active assessments to newly connected client
    if (activeAssessments.length > 0) {
      ws.send(JSON.stringify({ type: 'activeAssessments', assessments: activeAssessments }));
    }

    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      console.log('Received:', data);

      // Handle incoming messages
      if (data.type === 'register') {
        handleRegistration(ws, data.data);
      } else if (data.type === 'login') {
        handleLogin(ws, data.data);
      } else if (data.type === 'newAssessment') {
        activeAssessments.push(data.assessment); // Store the new assessment
        broadcastAssessment(wss, data.assessment);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
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
        ws.send(JSON.stringify({
          type: 'loginResponse',
          success: true,
          message: 'Login successful'
        }));
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
  const assessmentData = JSON.stringify({ type: 'newAssessment', assessment });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(assessmentData);
    }
  });
};

export default setupWebSocket;
