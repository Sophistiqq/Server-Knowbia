
import { Router } from 'express';
const router = Router();
import { createConnection } from 'mysql2';
import { config } from 'dotenv';
import { hashSync, compareSync } from 'bcrypt';
config();

const connection = createConnection({
  uri: process.env.URI,
});

//CREATE TABLE students (
//    student_id INT AUTO_INCREMENT PRIMARY KEY,
//    firstname VARCHAR(255) NOT NULL,
//    lastname VARCHAR(255) NOT NULL,
//    email VARCHAR(255) UNIQUE NOT NULL,
//    hashed_password VARCHAR(255) NOT NULL,
//    verified BOOLEAN DEFAULT FALSE,
//    phone_number VARCHAR(15),
//    year_level INT,
//    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//);


router.post('/register', (req, res) => {
  const { firstname, lastname, email, password, phone_number, year_level } = req.body;

  const hashed_password = hashSync(password, 10);

  const query = 'INSERT INTO students (firstname, lastname, email, hashed_password, phone_number, year_level) VALUES (?, ?, ?, ?, ?, ?)';

  connection.query(query, [firstname, lastname, email, hashed_password, phone_number, year_level], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: 'An error occurred', error: err });
    } else {
      console.log(result);
      res.status(201).json({ message: 'Student registered', student_id: result.insertId });
    }
  });

})


router.post('/login', (req, res) => {
  const { email, password } = req.body;

  connection.query('SELECT * FROM students WHERE email = ?', [email], (err, result) => {
    if (err) {
      res.status(500).json({ message: 'An error occurred', error: err });
    } else {
      if (result.length > 0) {
        const student = result[0];
        const isPasswordValid = compareSync(password, student.hashed_password);

        if (isPasswordValid) {
          res.status(200).json({ message: 'Login successful', student });
        } else {
          res.status(401).json({ message: 'Invalid email or password' });
        }
      } else {
        res.status(404).json({ message: 'Student not found' });
      }
    }
  });
});


// router to test the registration of a student

router.get('/register', (req, res) => {
  res.render('register.ejs');
});



export default router;
