const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create demo users
  const hashedPassword = await bcrypt.hash("password123", 12)

  const user1 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      password: hashedPassword,
      teamName: "Development Team",
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      email: "jane@example.com",
      password: hashedPassword,
      teamName: "Development Team",
    },
  })

  // Create demo tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Setup project structure",
        description: "Initialize the project with proper folder structure and dependencies",
        dueDate: new Date("2024-02-15"),
        priority: "High",
        status: "TO_DO",
        assigneeId: user1.id,
        createdBy: user2.id,
      },
      {
        title: "Design database schema",
        description: "Create the database schema for users and tasks",
        dueDate: new Date("2024-02-20"),
        priority: "Medium",
        status: "IN_PROGRESS",
        assigneeId: user2.id,
        createdBy: user1.id,
      },
      {
        title: "Implement authentication",
        description: "Add user registration and login functionality",
        dueDate: new Date("2024-02-10"),
        priority: "High",
        status: "DONE",
        assigneeId: user1.id,
        createdBy: user1.id,
      },
    ],
  })

  console.log("✅ Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
