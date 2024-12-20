import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
const app = express();

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true // Allow cookies and credentials
}));

// allow external access to the server
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data:; connect-src *"
  );
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (if needed)
app.use(express.static('public'));

// Routes
//import student from './routes/studentAuth.js'; // Unused now
//app.use('/student', student);
import teacher from './routes/teacherAuth.js'; // Your admin routes
app.use('/teacher', teacher);
import assessments from './routes/assessments.js';
app.use('/assessments', assessments);
import distribution from './routes/distribution.js';
app.use('/distribution', distribution);


export default app;
