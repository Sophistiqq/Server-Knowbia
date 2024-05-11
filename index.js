import express from 'express';
const app = express();
import connection from './dbconfig.js'

app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index')
})




export default app;
