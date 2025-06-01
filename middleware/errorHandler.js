// Place at the end of all routes in your main app (app.js or server.js)
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
}

module.exports = errorHandler;
