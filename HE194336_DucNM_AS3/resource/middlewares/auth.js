const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader =
    req.header("Authorization") || req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Token is missing" });
  }

  // Token must follow format: Bearer <token>
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res
      .status(401)
      .json({ message: "Invalid token format. Must be Bearer <token>" });
  }

  const token = parts[1];
  try {
    const secret = process.env.JWT_SECRET || "ma-sinh-vien";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = {
  verifyToken,
  verifyJWT: verifyToken,
};
