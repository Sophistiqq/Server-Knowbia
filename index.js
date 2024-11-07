import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
const app = express();

import setupWebSocket from './routes/websocket.js';
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
import detection from './routes/detection.js';
app.use('/detection', detection);


app.get('/', (req, res) => {
  res.render('index.ejs');
});

app.get('/page', (req, res) => {
  res.render('page.ejs');
});

// Here we can setup the websocket
// Create the HTTP server and pass it to WebSocket setup
const server = http.createServer(app);
const wsPort = 8080; // You can still keep this variable
// Listen on the same server instance without needing to call listen again
server.listen(wsPort, () => {
  console.log(`HTTP server is running on port ${wsPort}`);
});




// Call WebSocket setup with the HTTP server
setupWebSocket(server)



export default app;
