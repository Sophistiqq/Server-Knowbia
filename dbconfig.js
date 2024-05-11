import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const connection = mysql.createConnection({
  uri: process.env.URI,
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


export default connection;

