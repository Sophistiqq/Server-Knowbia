import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const connection = mysql.createConnection({
  //uri: process.env.URI,
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

// Users table schema
const createUsersTable = `CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_number VARCHAR(255) NOT NULL UNIQUE,
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  hashed_password VARCHAR(255) NOT NULL,
  phone_number VARCHAR(255),
  year_level VARCHAR(255),
  sex VARCHAR(255),
  suffix VARCHAR(255),
  birthday DATE,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;


connection.query(createUsersTable, (err, results, fields) => {
  if (err) {
    console.log(err.message);
  } else {
    console.log('Users table created successfully');
  }
});


export default connection;

