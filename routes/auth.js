
import { Router } from 'express';
const router = Router();
import { createConnection } from 'mysql2';
import { config } from 'dotenv';
import { hashSync, compareSync } from 'bcrypt';
config();
import connection from '../dbconfig.js';


//| students | CREATE TABLE "students" (
//  "student_id" varchar(50) NOT NULL,
//  "firstname" varchar(255) NOT NULL,
//  "lastname" varchar(255) NOT NULL,
//  "email" varchar(255) NOT NULL,
//  "hashed_password" varchar(255) NOT NULL,
//  "verified" tinyint(1) DEFAULT '0',
//  "phone_number" varchar(15) DEFAULT NULL,
//  "year_level" int DEFAULT NULL,
//  "sex" enum('Male','Female','Other') NOT NULL,
//  "suffix" varchar(10) DEFAULT NULL,
//  "birthday" date DEFAULT NULL,
//  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
//  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//  PRIMARY KEY ("student_id"),
//  UNIQUE KEY "email" ("email")
//) |


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


router.post('/login', (req, res) => {
  // logging in using student id and password
  const { student_id, password } = req.body;

  const query = `SELECT * FROM students WHERE student_id = ?`;
  connection.query(query, [student_id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: 'An error occurred', error: err });
    } else {
      if (result.length > 0) {
        const student = result[0];
        const passwordMatch = compareSync(password, student.hashed_password);
        if (passwordMatch) {
          res.status(200).json({ message: 'Login successful', student });
        } else {
          res.status(401).json({ message: 'Invalid credentials' });
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
