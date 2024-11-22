import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

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

// Teachers table schema
const createTeachersTable = `CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  middlename VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  hashed_password VARCHAR(255) NOT NULL,
  phone_number VARCHAR(255),
  department VARCHAR(255),
  sex VARCHAR(255),
  suffix VARCHAR(255),
  birthdate DATE,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

// Classes table schema
const createClassesTable = `CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  className VARCHAR(255) NOT NULL,
  section VARCHAR(50) NOT NULL,
  enrolledStudents INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;


const createStudentsTable = `
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentNumber VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  password VARCHAR(100) NOT NULL,
  firstName VARCHAR(50),
  lastName VARCHAR(50),
  section VARCHAR(50)
);
`

// Assessment results table schema
const createAssessments = `
CREATE TABLE IF NOT EXISTS assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  questions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`


const createAssessment_results = `
CREATE TABLE IF NOT EXISTS assessment_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_number VARCHAR(255),
  assessment_id INT,
  score INT,
  answers TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`


// Create tables
const createTables = () => {
  pool.query(createTeachersTable, (err, results) => {
    if (err) {
      console.log(err.message);
    }
  });

  pool.query(createClassesTable, (err, results) => {
    if (err) {
      console.log(err.message);
    }
  });

  pool.query(createStudentsTable, (err, results) => {
    if (err) {
      console.log(err.message);
    }
  });

  pool.query(createAssessment_results, (err, results) => {
    if (err) {
      console.log(err.message);
    }
  });

  pool.query(createAssessments, (err, results) => {
    if (err) {
      console.log(err.message);
    }
  });
};

// Call the function to create the tables
createTables();

export default pool;
