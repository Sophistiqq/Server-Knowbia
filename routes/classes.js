import express from 'express';
import connection from '../dbconfig.js'; // Adjust the path based on your structure

const router = express.Router();

// Route to create a new class
router.post('/create', (req, res) => {
  const { className, section } = req.body;

  // Validate input
  if (!className || !section) {
    return res.status(400).json({ message: 'Class name and section are required.' });
  }

  // SQL query to insert a new class
  const sql = `INSERT INTO classes (className, section) VALUES (?, ?)`;

  connection.query(sql, [className, section], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error creating class.' });
    }

    res.status(201).json({ message: 'Class created successfully!', classId: results.insertId });
  });
});

export default router;
