const User = require('../models/User');

module.exports = async function(req, res, next) {
  // If user is properly authenticated via session, proceed
  if (req.isAuthenticated()) {
    return next();
  }

  // For development: if not authenticated, find and log in the default user
  if (process.env.NODE_ENV !== 'production') {
    try {
      const defaultUser = await User.findOne({ email: 'user@example.com' });
      if (defaultUser) {
        // Use req.login() to establish a persistent session
        req.login(defaultUser, (err) => {
          if (err) {
            console.error("Error logging in default user:", err);
            return res.status(500).send('Server Error during default user login');
          }
          return next();
        });
      } else {
        // This can happen if seeding hasn't run yet
        return res.status(401).json({ msg: 'Authorization denied: Default user not found.' });
      }
    } catch (error) {
      console.error("Error finding default user:", error);
      return res.status(500).send('Server Error during auth middleware');
    }
  } else {
    // In production, if there's no session, deny access
    return res.status(401).json({ msg: 'Authorization denied' });
  }
};