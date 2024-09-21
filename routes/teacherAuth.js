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
    maxAge: 12 * 60 * 60 * 1000, // Session duration: 12 hours
    sameSite: 'None'
  }
}));

// Register route for teachers
router.post('/register', (req, res) => {
  const { firstname, lastname, middlename, email, password, phone_number, department, birthdate } = req.body;
  const hashed_password = hashSync(password, 10);

  const query = `INSERT INTO teachers (firstname, lastname, middlename, email, hashed_password, phone_number, department, birthdate, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, false)`;

  connection.query(query, [firstname, lastname, middlename, email, hashed_password, phone_number, department, birthdate], (err, result) => {
    if (err) {
      console.error(err);
      const errorMessage = err.code === 'ER_DUP_ENTRY' ? 'The teacher ID or email already exists.' : 'An error occurred during registration.';
      res.status(500).json({ message: errorMessage });
    } else {
      res.status(201).json({ message: 'Teacher registered successfully' });
    }
  });
});

// Login route for teachers
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = `SELECT * FROM teachers WHERE email = ?`;
  connection.query(query, [email], (err, result) => {
    if (err) return res.status(500).json({ message: 'An error occurred', error: err });

    if (result.length > 0) {
      const teacher = result[0];
      console.log(teacher);
      if (compareSync(password, teacher.hashed_password)) {
        const token = jwt.sign({ email: teacher.email }, JWT_SECRET, { expiresIn: '12h' });

        // Store the token in the session
        req.session.token = token;
        req.session.email = teacher.email;
        res.json({
          success: true,
          user: {
            firstname: teacher.firstname,
            lastname: teacher.lastname,
            middlename: teacher.middlename,
            email: teacher.email,
            department: teacher.department,
            phone_number: teacher.phone_number,
          }
        });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      res.status(404).json({ message: 'Teacher not found' });
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