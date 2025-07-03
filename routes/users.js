const express = require("express")
const { authenticateToken } = require("../middleware/auth")
const prisma = require("../lib/prisma")

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get team members (all users for now - in production you'd want proper team management)
router.get("/team-members", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        teamName: true,
      },
      orderBy: {
        email: "asc",
      },
    })

    const teamMembers = users.map((user) => ({
      id: user.id,
      email: user.email,
      teamName: user.teamName,
    }))

    res.json({ teamMembers })
  } catch (error) {
    console.error("Get team members error:", error)
    res.status(500).json({ message: "Server error fetching team members" })
  }
})

// Get all chats for the current user
router.get("/me/chats", async (req, res) => {
  try {
    const userId = req.user.id;
    const chatUsers = await prisma.chatUser.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            task: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { chat: { createdAt: "desc" } },
    });
    const chats = chatUsers.map((cu) => ({
      id: cu.chat.id,
      taskId: cu.chat.task.id,
      taskTitle: cu.chat.task.title,
      createdAt: cu.chat.createdAt,
    }));
    res.json({ chats });
  } catch (error) {
    console.error("Get user chats error:", error);
    res.status(500).json({ message: "Server error fetching chats" });
  }
});

// Create a new team
router.post("/teams", async (req, res) => {
  try {
    const { name, members } = req.body; // members: array of emails
    if (!name || !Array.isArray(members)) {
      return res.status(400).json({ message: "Team name and members are required" });
    }
    // Create team with current user as owner
    const team = await prisma.team.create({
      data: {
        name,
        ownerId: req.user.id,
      },
    });
    // Add owner as member
    await prisma.teamMember.create({ data: { teamId: team.id, userId: req.user.id } });
    // Add other members by email
    for (const email of members) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && user.id !== req.user.id) {
        await prisma.teamMember.create({ data: { teamId: team.id, userId: user.id } });
      }
    }
    res.status(201).json({ message: "Team created", teamId: team.id });
  } catch (error) {
    console.error("Create team error:", error);
    res.status(500).json({ message: "Server error creating team" });
  }
});

// Add a member to a team by email
router.post("/teams/:id/add-member", async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });
    // Only allow owner to add
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team || team.ownerId !== req.user.id) return res.status(403).json({ message: "Not allowed" });
    // Add member if not already
    const exists = await prisma.teamMember.findFirst({ where: { teamId, userId: user.id } });
    if (!exists) {
      await prisma.teamMember.create({ data: { teamId, userId: user.id } });
    }
    res.json({ message: "Member added" });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ message: "Server error adding member" });
  }
});

// Get all teams for current user
router.get("/teams", async (req, res) => {
  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId: req.user.id },
      include: { team: true },
    });
    const teams = memberships.map((m) => ({ id: m.team.id, name: m.team.name, ownerId: m.team.ownerId }));
    res.json({ teams });
  } catch (error) {
    console.error("Get teams error:", error);
    res.status(500).json({ message: "Server error fetching teams" });
  }
});

// Get all members of a team
router.get("/teams/:id/members", async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: { select: { id: true, email: true } } },
    });
    res.json({ members: members.map((m) => ({ id: m.user.id, email: m.user.email })) });
  } catch (error) {
    console.error("Get team members error:", error);
    res.status(500).json({ message: "Server error fetching team members" });
  }
});

// Remove a member from a team by userId
router.post("/teams/:id/remove-member", async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });
    // Only allow owner to remove
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team || team.ownerId !== req.user.id) return res.status(403).json({ message: "Not allowed" });
    // Remove member
    await prisma.teamMember.deleteMany({ where: { teamId, userId } });
    res.json({ message: "Member removed" });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ message: "Server error removing member" });
  }
});

module.exports = router
