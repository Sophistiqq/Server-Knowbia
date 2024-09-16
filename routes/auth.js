import { Router } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { hashSync, compareSync } from 'bcrypt';
import jwt from 'jsonwebtoken';
import connection from '../dbconfig.js'; // Your database connection
import { config } from 'dotenv';

config();
const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Set up cookie-parser and session middleware
router.use(cookieParser());
router.use(session({
  secret: process.env.SESSION_SECRET || 'mySecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true, // Prevent client-side access to the cookie
    maxAge: 12 * 60 * 60 * 1000 // Session duration: 12 hours
  }
}));

// Register route
router.post('/register', (req, res) => {
  const { student_number, firstname, lastname, middle_name, email, password, phone_number, year_level, sex, suffix, birthday } = req.body;
  const hashed_password = hashSync(password, 10);
  
  const query = `INSERT INTO users (student_number, firstname, lastname, middle_name, email, hashed_password, phone_number, year_level, sex, suffix, birthday, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false)`;

  connection.query(query, [student_number, firstname, lastname, middle_name, email, hashed_password, phone_number, year_level, sex, suffix, birthday], (err, result) => {
    if (err) {
      console.error(err);
      const errorMessage = err.code === 'ER_DUP_ENTRY' ? 'The student number or email already exists.' : 'An error occurred during registration.';
      res.status(500).json({ message: errorMessage });
    } else {
      res.status(201).json({ message: 'Student registered successfully' });
    }
  });
});

// Login route
router.post('/login', (req, res) => {
  const { student_number, password } = req.body;

  const query = `SELECT * FROM students WHERE student_number = ?`;
  connection.query(query, [student_number], (err, result) => {
    if (err) return res.status(500).json({ message: 'An error occurred', error: err });

    if (result.length > 0) {
      const student = result[0];
      if (compareSync(password, student.hashed_password)) {
        const token = jwt.sign({ student_number: student.student_number }, JWT_SECRET, { expiresIn: '12h' });

        // Store the token in the session
        req.session.token = token;
        req.session.student_number = student.student_number;
        res.status(200).json({ message: 'Login successful' });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  });
});

// Session authentication middleware
function authenticateSession(req, res, next) {
  if (!req.session.token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  jwt.verify(req.session.token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Session expired or invalid' });
    }
    req.user = user;
    next();
  });
}

// Protected route using session-based authentication
router.get('/authenticate', authenticateSession, (req, res) => {
  res.status(200).json({ message: 'Token is valid', user: req.user });
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'An error occurred during logout' });
    console.log('Session destroyed');
    res.clearCookie('connect.sid'); // Clear session cookie
    res.status(200).json({ message: 'Logout successful' });
  });
});

router.get('/register', (req, res) => {
  res.render('register.ejs');
});

export default router;
