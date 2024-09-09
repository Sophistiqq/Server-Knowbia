import express from 'express';
const app = express();
import path from 'path';


app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.get('/', (req, res) => {
  res.render('index.ejs')
})

app.get('/page', (req, res) => {
  res.render('page.ejs');
})

// use the auth/ route
import auth from './routes/auth.js'
app.use('/auth', auth)

export default app;
