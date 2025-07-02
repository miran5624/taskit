# Prisma Studio Guide

Prisma Studio is a visual database browser that allows you to view and edit your data through a user-friendly interface.

## Opening Prisma Studio

### Method 1: Using npm script
\`\`\`bash
npm run db:studio
\`\`\`

### Method 2: Using the setup script
\`\`\`bash
chmod +x scripts/open-studio.sh
./scripts/open-studio.sh
\`\`\`

### Method 3: Direct Prisma command
\`\`\`bash
npx prisma studio
\`\`\`

## Accessing Prisma Studio

Once started, Prisma Studio will be available at:
**http://localhost:5555**

## Features Available in Prisma Studio

### 📊 **Data Browsing**
- View all tables (users, tasks)
- Browse records with pagination
- Search and filter data
- Sort by any column

### ✏️ **Data Editing**
- Add new records
- Edit existing records
- Delete records
- Bulk operations

### 🔗 **Relationships**
- View related data
- Navigate between connected records
- Understand foreign key relationships

### 📈 **Data Analysis**
- View record counts
- Analyze data patterns
- Export data for reporting

## Common Tasks

### 1. View All Users
1. Open Prisma Studio
2. Click on the "User" table
3. Browse all registered users
4. See their teams and creation dates

### 2. Manage Tasks
1. Click on the "Task" table
2. View all tasks with their details
3. See task assignments and creators
4. Filter by status or priority

### 3. Create Test Data
1. Click "Add record" in any table
2. Fill in the required fields
3. Save to create new test data

### 4. Edit Task Status
1. Find a task in the Task table
2. Click on the status field
3. Select new status from dropdown
4. Save changes

### 5. View User's Tasks
1. Go to User table
2. Click on a user record
3. Scroll down to see "assignedTasks" and "createdTasks"
4. Click to view related tasks

## Database Schema Overview

### Users Table
- **id**: Primary key (auto-increment)
- **email**: Unique email address
- **password**: Hashed password
- **teamName**: Team name (default: "My Team")
- **createdAt**: Account creation timestamp
- **updatedAt**: Last update timestamp

### Tasks Table
- **id**: Primary key (auto-increment)
- **title**: Task title
- **description**: Optional task description
- **dueDate**: Task due date
- **priority**: Low, Medium, or High
- **status**: To Do, In Progress, or Done
- **assigneeId**: Foreign key to Users (who is assigned)
- **createdBy**: Foreign key to Users (who created it)
- **createdAt**: Task creation timestamp
- **updatedAt**: Last update timestamp

## Troubleshooting

### Studio Won't Start
1. Check if PostgreSQL is running
2. Verify DATABASE_URL in .env file
3. Run \`npm run db:generate\` first
4. Ensure port 5555 is not in use

### Can't See Data
1. Check if database is properly seeded
2. Run \`npm run db:seed\` to add demo data
3. Verify database connection

### Permission Errors
1. Ensure database user has proper permissions
2. Check if database exists
3. Verify connection string format

## Security Notes

⚠️ **Important**: Prisma Studio should only be used in development environments. Never expose it in production as it provides direct database access.

## Useful Commands

\`\`\`bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Reset database (careful!)
npm run db:reset

# Create migration
npm run db:migrate

# Seed with demo data
npm run db:seed

# Open Studio
npm run db:studio
\`\`\`

## Demo Data

After running \`npm run db:seed\`, you'll have:

### Demo Users
- **john@example.com** (password: password123)
- **jane@example.com** (password: password123)

### Demo Tasks
- Setup project structure (High priority, To Do)
- Design database schema (Medium priority, In Progress)
- Implement authentication (High priority, Done)

## Next Steps

1. **Explore the data**: Browse through users and tasks
2. **Create test data**: Add your own users and tasks
3. **Test relationships**: See how tasks link to users
4. **Modify data**: Practice editing records
5. **Export data**: Use for reporting or backup

Happy data browsing! 🎉
