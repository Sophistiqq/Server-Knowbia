import express from 'express';
const app = express();
import './dbconfig.js'
const path = require('path');

app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'));

app.get('/', (req, res) => {
  res.render('index.ejs')
})




export default app;
