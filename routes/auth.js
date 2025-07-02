const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
const { authenticateToken } = require("../middleware/auth")
const prisma = require("../lib/prisma")

const router = express.Router()

// Register
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Please provide a valid email address"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    body("teamName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Team name must be between 1 and 100 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { email, password, teamName } = req.body

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return res.status(400).json({
          message: "User already exists with this email address",
        })
      }

      // Hash password
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          teamName: teamName || "My Team",
        },
        select: {
          id: true,
          email: true,
          teamName: true,
          createdAt: true,
        },
      })

      // Generate JWT
      const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      })

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          teamName: user.teamName,
        },
      })
    } catch (error) {
      console.error("Register error:", error)
      res.status(500).json({
        message: "Server error during registration. Please try again.",
      })
    }
  },
)

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { email, password } = req.body

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        })
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({
          message: "Invalid email or password",
        })
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      })

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          teamName: user.teamName,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        message: "Server error during login. Please try again.",
      })
    }
  },
)

// Get current user
router.get("/me", authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      teamName: req.user.teamName,
    },
  })
})

// Logout (client-side token removal)
router.post("/logout", authenticateToken, (req, res) => {
  res.json({
    message: "Logout successful",
  })
})

module.exports = router
