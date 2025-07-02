const { Pool } = require("pg")
const dotenv = require("dotenv")

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
})

const initDatabase = async () => {
  try {
    console.log("🔄 Initializing database...")

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        team_name VARCHAR(255) DEFAULT 'My Team',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE NOT NULL,
        priority VARCHAR(10) CHECK (priority IN ('Low', 'Medium', 'High')) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('To Do', 'In Progress', 'Done')) DEFAULT 'To Do',
        assignee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    `)

    // Create trigger to update updated_at timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)

    await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `)

    await pool.query(`
      DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
      CREATE TRIGGER update_tasks_updated_at 
        BEFORE UPDATE ON tasks 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `)

    console.log("✅ Database initialized successfully!")
    console.log("📋 Tables created:")
    console.log("   - users")
    console.log("   - tasks")
    console.log("🔍 Indexes created for optimal performance")
  } catch (error) {
    console.error("❌ Error initializing database:", error)
  } finally {
    await pool.end()
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
}

module.exports = initDatabase
