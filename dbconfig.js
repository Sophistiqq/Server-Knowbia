import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const connection = mysql.createConnection({
  host: "localhost",
  user: "roi",
  port: 3306,
  database: "knowbia",
  password: "123",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

try {
  connection.connect((err) => {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    console.log('connected as id ' + connection.threadId);
  });
} catch (error) {
  console.log('error connecting: ' + error.stack);
}

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
  connection.query(createTeachersTable, (err, results) => {
    if (err) {
      console.log(err.message);
    } else {
      console.log('Teachers table created successfully');
    }
  });

  connection.query(createClassesTable, (err, results) => {
    if (err) {
      console.log(err.message);
    } else {
      console.log('Classes table created successfully');
    }
  });

  connection.query(createStudentsTable, (err, results) => {
    if (err) {
      console.log(err.message);
    } else {
      console.log('Students table created successfully');
    }
  });

  connection.query(createAssessment_results, (err, results) => {
    if (err) {
      console.log(err.message);
    } else {
      console.log('Assessment results table created successfully');
    }
  });

};

// Call the function to create the tables
createTables();

export default connection;
