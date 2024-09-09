import express from 'express';
const app = express();
import connection from './dbconfig.js'
import path from 'path'
import bcrypt from 'bcryptjs'

app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index.ejs')
})

app.post('/register', (req,res)=> {
  const { fullname, username, email, password, role } = req.body;
  
  // Check if the user already exists using email or username
  const checkUser = `SELECT * FROM users WHERE email = ? OR username = ?`; 
  connection.query(checkUser, [email, username], async (err, results) => {
    if (err) {
      console.log(err);
    }
    if (results.length > 0) {
      res.json({ message: 'User already exists' });
    }
    let hashedPassword = await bcrypt.hash(password, 8);
    const createUser = `INSERT INTO users SET ?`;
    connection.query(createUser, { fullname, username, email, password: hashedPassword, role }, (err, results) => {
      if (err) {
        res.json({ message: err.message });
      } else {
        res.json({ message: 'User registered successfully' });
      }
    });
  });
})


// Login using username or email
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const checkUser = `SELECT * FROM users WHERE username = ? OR email = ?`;
  connection.query(checkUser, [username, username], async (err, results) => {
    if (err) {
      console.log(err);
    }
    if (results.length > 0) {
      const comparePassword = await bcrypt.compare(password, results[0].password);
      if (comparePassword) {
        res.json({ message: 'Login successful' });
      } else {
        res.json({ message: 'Invalid login details' });
      }
    } else {
      res.json({ message: 'User does not exist' });
    }
  });
});

app.get('/page', (req, res) => {
  res.render('page.ejs');
})

import router from './routes/auth.js'
app.use('/auth', router);

export default app;
