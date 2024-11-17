import { Router } from 'express'
const router = Router();



// Array to store users who pressed Home or Recent apps
let usersWhoPressedHomeOrRecent = [];

let restrictedUsers = [];
// Endpoint to receive activity
router.post('/detected', (req, res) => {
  const { activity, user } = req.body;

  if (activity === "home_or_recent_apps_pressed") {
    // Log the user who pressed the Home or Recent apps button
    console.log(`User ${user.name} (ID: ${user.id}) pressed Home or Recent Apps`);

    // Check if the user is already in the array
    const userExists = usersWhoPressedHomeOrRecent.some(u => u.id === user.id);

    // If the user is not in the array, add them
    if (!userExists) {
      usersWhoPressedHomeOrRecent.push(user);
    }

    // Optionally, log the current list of users who pressed Home/Recent
    console.log("Users who pressed Home or Recent Apps:", usersWhoPressedHomeOrRecent);
  }

  if (activity === "restrictUser") {
    // console log the restricted user
    console.log(`User ${user.name} (ID: ${user.id}) has been restricted`);
    // Check if the user is already in the Array
    const userExists = restrictedUsers.some(u => u.id === user.id);
    // If the user is not in the array, add them
    if (!userExists) {
      restrictedUsers.push(user);
    }
    // Optionally, log the current list of restricted users
    console.log("Restricted Users:", restrictedUsers);

  }
  res.json({ message: 'Activity received' });
});

// Endpoint to get all the restricted users
router.get('/restrictedUsers', (req, res) => {
  res.json(restrictedUsers);
});

export default router;
