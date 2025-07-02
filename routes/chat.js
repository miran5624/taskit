const express = require("express")
const router = express.Router()
const prisma = require("../lib/prisma")
const { authenticateToken } = require("../middleware/auth")

// Get chat for a specific task
router.get("/task/:taskId", authenticateToken, async (req, res) => {
  try {
    const taskId = Number(req.params.taskId)
    const chat = await prisma.chat.findUnique({
      where: { taskId },
      include: {
        users: { include: { user: { select: { id: true, email: true } } } },
        task: { select: { title: true } },
      },
    })
    if (!chat) return res.status(404).json({ message: "Chat not found for this task" })
    // Add chat name as the task title
    const chatWithName = { ...chat, name: chat.task.title }
    res.json({ chat: chatWithName })
  } catch (error) {
    console.error("Get chat for task error:", error)
    res.status(500).json({ message: "Server error fetching chat" })
  }
})

// Get messages for a chat
router.get("/:chatId/messages", authenticateToken, async (req, res) => {
  try {
    const chatId = Number(req.params.chatId)
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, email: true } } },
    })
    res.json({ messages })
  } catch (error) {
    console.error("Get chat messages error:", error)
    res.status(500).json({ message: "Server error fetching messages" })
  }
})

// Post a new message to a chat
router.post("/:chatId/messages", authenticateToken, async (req, res) => {
  try {
    const chatId = Number(req.params.chatId)
    const { content } = req.body
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content required" })
    }
    // Check if user is a member of the chat
    const chatUser = await prisma.chatUser.findFirst({
      where: { chatId, userId: req.user.id },
    })
    if (!chatUser) {
      return res.status(403).json({ message: "You are not a member of this chat" })
    }
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: req.user.id,
        content: content.trim(),
      },
      include: { sender: { select: { id: true, email: true } } },
    })
    res.status(201).json({ message })
  } catch (error) {
    console.error("Post chat message error:", error)
    res.status(500).json({ message: "Server error posting message" })
  }
})

module.exports = router 