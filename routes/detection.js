import { Router } from 'express'
const router = Router();



// Array to store users who pressed Home or Recent apps
let usersWhoPressedHomeOrRecent = [];

// Endpoint to receive activity
router.post('/detected', (req, res) => {
  const { activity, user } = req.body;

  if (activity === "home_or_recent_apps_pressed") {
    // Log the user who pressed the Home or Recent apps button
    console.log(`User ${user.name} (ID: ${user.id}) pressed Home or Recent Apps`);

    // Store the user info in the array
    usersWhoPressedHomeOrRecent.push(user);

    // Optionally, log the current list of users who pressed Home/Recent
    console.log("Users who pressed Home or Recent Apps:", usersWhoPressedHomeOrRecent);
  }

  // Send a response back to the client
  res.json({ message: 'You have sinned' });
});

export default router;
