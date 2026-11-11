const jwt = require("jsonwebtoken");

// Checks the "Bearer <token>" header and puts the user id on req.userId
module.exports = function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Please log in" });

  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch {
    res.status(401).json({ message: "Session expired, please log in again" });
  }
};
