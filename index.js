import express from 'express';
const app = express();
import connection from './dbconfig'

app.use(express.urlencoded({ extended: true }))
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World'})
})


console.log("Hello")

export default app;
