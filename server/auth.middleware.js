// server/auth.middleware.js
const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Authorization header format" });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret"
    );

    req.user = {
      userId: payload.userId,
      roles: payload.roles || []
    };

    next();
  } catch (err) {
    console.error("authRequired error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(roleName) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.includes(roleName)) {
      return res.status(403).json({ error: "Forbidden: insufficient rights" });
    }
    next();
  };
}

module.exports = {
  authRequired,
  requireRole
};
