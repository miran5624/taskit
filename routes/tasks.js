const express = require("express")
const { body, validationResult } = require("express-validator")
const { authenticateToken } = require("../middleware/auth")
const prisma = require("../lib/prisma")

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get all tasks for the user
router.get("/", async (req, res) => {
  try {
    const { filter } = req.query
    const userId = req.user.id

    // Find all tasks where user is an assignee or creator
    const assignments = await prisma.taskAssignment.findMany({
      where: { userId },
      select: { taskId: true },
    })
    const assignedTaskIds = assignments.map(a => a.taskId)

    const whereClause = {
      OR: [
        { id: { in: assignedTaskIds } },
        { createdBy: userId },
      ],
    }

    // Apply filters
    if (filter) {
      switch (filter) {
        case "todo":
          whereClause.status = "TO_DO"
          break
        case "in-progress":
          whereClause.status = "IN_PROGRESS"
          break
        case "completed":
          whereClause.status = "DONE"
          break
        case "deadline-approaching":
          const threeDaysFromNow = new Date()
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
          whereClause.dueDate = {
            lte: threeDaysFromNow,
          }
          whereClause.status = {
            not: "DONE",
          }
          break
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignedUsers: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedTasks = tasks.map((task) => ({
      id: task.id.toString(),
      title: task.title,
      description: task.description,
      dueDate: task.dueDate.toISOString(),
      priority: task.priority,
      status: task.status === "TO_DO" ? "To Do" : task.status === "IN_PROGRESS" ? "In Progress" : "Done",
      assignees: task.assignedUsers.map(au => ({ id: au.user.id, email: au.user.email })),
      createdBy: task.createdBy,
      createdByEmail: task.creator.email,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }))

    res.json({ tasks: formattedTasks })
  } catch (error) {
    console.error("Get tasks error:", error)
    res.status(500).json({ message: "Server error fetching tasks" })
  }
})

// Create new task
router.post(
  "/",
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("Title is required and must be less than 255 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("dueDate").isISO8601().toDate().withMessage("Please provide a valid due date"),
    body("priority").isIn(["Low", "Medium", "High"]).withMessage("Priority must be Low, Medium, or High"),
    body("assigneeIds").optional().isArray().withMessage("assigneeIds must be an array of user IDs"),
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

      const { title, description, dueDate, priority, assigneeIds } = req.body
      const userId = req.user.id

      // Validate assignees
      let assignees = []
      if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
        assignees = await prisma.user.findMany({
          where: { id: { in: assigneeIds.map(Number) } },
          select: { id: true, email: true },
        })
        if (assignees.length !== assigneeIds.length) {
          return res.status(400).json({ message: "One or more assignees are invalid" })
        }
      }

      // Check if due date is not in the past
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(dueDate)
      if (selectedDate < today) {
        return res.status(400).json({ message: "Due date cannot be in the past" })
      }

      // Create task
      const task = await prisma.task.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          dueDate: new Date(dueDate),
          priority,
          createdBy: userId,
          assignedUsers: {
            create: assignees.map(a => ({ userId: a.id })),
          },
        },
        include: {
          assignedUsers: { include: { user: { select: { id: true, email: true } } } },
          creator: { select: { email: true } },
        },
      })

      // Always create chat for the task
      await prisma.chat.create({
        data: {
          taskId: task.id,
          users: {
            create: [
              { userId: userId }, // creator
              ...assignees.map(a => ({ userId: a.id })),
            ],
          },
        },
      })

      res.status(201).json({
        message: "Task created successfully",
        task: {
          id: task.id.toString(),
          title: task.title,
          description: task.description,
          dueDate: task.dueDate.toISOString(),
          priority: task.priority,
          status: "To Do",
          assignees: task.assignedUsers.map(au => ({ id: au.user.id, email: au.user.email })),
          createdBy: task.createdBy,
          createdByEmail: task.creator.email,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        },
      })
    } catch (error) {
      console.error("Create task error:", error)
      res.status(500).json({ message: "Server error creating task" })
    }
  },
)

// Update task
router.put(
  "/:id",
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("Title must be between 1 and 255 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("dueDate").optional().isISO8601().toDate().withMessage("Please provide a valid due date"),
    body("priority").optional().isIn(["Low", "Medium", "High"]).withMessage("Priority must be Low, Medium, or High"),
    body("status")
      .optional()
      .isIn(["To Do", "In Progress", "Done"])
      .withMessage("Status must be To Do, In Progress, or Done"),
    body("assigneeIds").optional().isArray().withMessage("assigneeIds must be an array of user IDs"),
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

      const taskId = Number.parseInt(req.params.id)
      const userId = req.user.id

      // Check if task exists and user has permission
      const existingTask = await prisma.task.findFirst({
        where: {
          id: taskId,
          OR: [{ createdBy: userId }],
        },
      })

      if (!existingTask) {
        return res.status(404).json({ message: "Task not found or access denied" })
      }

      // Prepare update data
      const updateData = {}

      if (req.body.title !== undefined) {
        updateData.title = req.body.title.trim()
      }

      if (req.body.description !== undefined) {
        updateData.description = req.body.description?.trim() || null
      }

      if (req.body.dueDate !== undefined) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const selectedDate = new Date(req.body.dueDate)

        if (selectedDate < today) {
          return res.status(400).json({ message: "Due date cannot be in the past" })
        }
        updateData.dueDate = new Date(req.body.dueDate)
      }

      if (req.body.priority !== undefined) {
        updateData.priority = req.body.priority
      }

      if (req.body.status !== undefined) {
        const statusMap = {
          "To Do": "TO_DO",
          "In Progress": "IN_PROGRESS",
          Done: "DONE",
        }
        updateData.status = statusMap[req.body.status]
      }

      if (req.body.assigneeIds !== undefined) {
        const newAssignees = await prisma.user.findMany({
          where: { id: { in: req.body.assigneeIds.map(Number) } },
        })
        if (newAssignees.length !== req.body.assigneeIds.length) {
          return res.status(400).json({ message: "One or more assignees are invalid" })
        }
        updateData.assignedUsers = {
          deleteMany: {
            taskId: taskId,
            userId: { notIn: req.body.assigneeIds.map(Number) },
          },
          create: newAssignees.map(a => ({ userId: a.id })),
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" })
      }

      // Update task
      const task = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          assignedUsers: {
            include: {
              user: { select: { id: true, email: true } },
            },
          },
          creator: {
            select: {
              email: true,
            },
          },
        },
      })

      res.json({
        message: "Task updated successfully",
        task: {
          id: task.id.toString(),
          title: task.title,
          description: task.description,
          dueDate: task.dueDate.toISOString(),
          priority: task.priority,
          status: task.status === "TO_DO" ? "To Do" : task.status === "IN_PROGRESS" ? "In Progress" : "Done",
          assignees: task.assignedUsers.map(au => ({ id: au.user.id, email: au.user.email })),
          createdBy: task.createdBy,
          createdByEmail: task.creator.email,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        },
      })
    } catch (error) {
      console.error("Update task error:", error)
      res.status(500).json({ message: "Server error updating task" })
    }
  },
)

// Delete task
router.delete("/:id", async (req, res) => {
  try {
    const taskId = Number.parseInt(req.params.id)
    const userId = req.user.id

    // Check if task exists and user is the creator (only creator can delete)
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        createdBy: userId,
      },
    })

    if (!task) {
      return res.status(404).json({
        message: "Task not found or you don't have permission to delete this task",
      })
    }

    await prisma.task.delete({
      where: { id: taskId },
    })

    res.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Delete task error:", error)
    res.status(500).json({ message: "Server error deleting task" })
  }
})

// Assign a task to users by email(s)
router.post("/:id/assign", async (req, res) => {
  try {
    const taskId = Number.parseInt(req.params.id);
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails) || emails.length === 0) return res.status(400).json({ message: "Emails are required" });

    // Find users by email
    const users = await prisma.user.findMany({ where: { email: { in: emails } } });
    if (users.length !== emails.length) return res.status(404).json({ message: "One or more users not found" });

    // Remove all previous assignees and add new ones
    await prisma.taskAssignment.deleteMany({ where: { taskId } });
    await prisma.taskAssignment.createMany({ data: users.map(u => ({ taskId, userId: u.id })) });

    // Update chat users
    const chat = await prisma.chat.findUnique({ where: { taskId } });
    if (chat) {
      // Remove all previous chat users except creator
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      await prisma.chatUser.deleteMany({ where: { chatId: chat.id, userId: { not: task.createdBy } } });
      // Add new assignees to chat
      for (const user of users) {
        const exists = await prisma.chatUser.findFirst({ where: { chatId: chat.id, userId: user.id } });
        if (!exists) {
          await prisma.chatUser.create({ data: { chatId: chat.id, userId: user.id } });
        }
      }
    }

    // Return updated task
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedUsers: { include: { user: { select: { id: true, email: true } } } },
        creator: { select: { email: true } },
      },
    });

    res.json({
      message: "Task assigned successfully",
      task: {
        id: updatedTask.id.toString(),
        title: updatedTask.title,
        description: updatedTask.description,
        dueDate: updatedTask.dueDate.toISOString(),
        priority: updatedTask.priority,
        status: updatedTask.status === "TO_DO" ? "To Do" : updatedTask.status === "IN_PROGRESS" ? "In Progress" : "Done",
        assignees: updatedTask.assignedUsers.map(au => ({ id: au.user.id, email: au.user.email })),
        createdBy: updatedTask.createdBy,
        createdByEmail: updatedTask.creator.email,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Assign task error:", error);
    res.status(500).json({ message: "Server error assigning task" });
  }
});

module.exports = router
