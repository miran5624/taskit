const jwt = require("jsonwebtoken")
const prisma = require("../lib/prisma")

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        teamName: true,
      },
    })

    if (!user) {
      return res.status(401).json({ message: "Invalid token" })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(403).json({ message: "Invalid or expired token" })
  }
}

module.exports = { authenticateToken }
