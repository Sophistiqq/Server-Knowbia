import { Router } from 'express';
const router = Router();
import { createConnection } from 'mysql2';
import { config } from 'dotenv';
import { hashSync, compareSync } from 'bcrypt';
config();
import connection from '../dbconfig.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;


router.post('/register', (req, res) => {
  const {
    student_number,
    firstname,
    lastname,
    middle_name,
    email,
    password,
    phone_number,
    year_level,
    sex,
    suffix,
    birthday,
    verified = false // default to false if not provided
  } = req.body;

  const hashed_password = hashSync(password, 10);

  const query = `INSERT INTO students (student_number, firstname, lastname, middle_name, email, hashed_password, phone_number, year_level, sex, suffix, birthday, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  connection.query(query, [student_number, firstname, lastname, middle_name, email, hashed_password, phone_number, year_level, sex, suffix, birthday, verified], (err, result) => {
    if (err) {
      console.error("Database insertion error:", err);
      let errorMessage = "An error occurred during registration.";

      // Provide more specific error messages based on the type of error
      if (err.code === 'ER_DUP_ENTRY') {
        errorMessage = 'The student number or email already exists.';
      } else if (err.code === 'ER_BAD_FIELD_ERROR') {
        errorMessage = 'Invalid field specified.';
      }

      res.status(500).json({ message: errorMessage, error: err });
    } else {
      console.log(result);
      res.status(201).json({ message: 'Student registered' });
    }
  });
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (token == null) return res.sendStatus(401); // No token provided

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  });
}

// Validate token route
router.get('/auth/validate', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Token is valid', user: req.user });
});


router.post('/login', (req, res) => {
  const { student_number, password } = req.body;

  console.log('Received Student Number:', student_number); // Log received student number
  console.log('Received Password:', password); // Log received password

  const query = `SELECT * FROM students WHERE student_number = ?`;
  connection.query(query, [student_number], (err, result) => {
    if (err) {
      console.log('Database Error:', err);
      res.status(500).json({ message: 'An error occurred', error: err });
    } else {
      console.log('Query Result:', result); // Log the result of the query

      if (result.length > 0) {
        const student = result[0];
        console.log('Student Found:', student); // Log the student details

        const passwordMatch = compareSync(password, student.hashed_password);
        console.log('Password Match:', passwordMatch); // Log whether passwords match

        if (passwordMatch) {
          const token = jwt.sign(
            { student_number: student.student_number },
            JWT_SECRET,
            { expiresIn: '12h' }
          );
          res.status(200).json({ message: 'Login successful', token });
        } else {
          res.status(401).json({ message: 'Invalid credentials' });
        }
      } else {
        res.status(404).json({ message: 'Student not found' });
      }
    }
  });
});
// Middleware to authenticate requests
// router to test the registration of a student

router.get('/register', (req, res) => {
  res.render('register.ejs');
});




export default router;
