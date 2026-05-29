import mysql from 'mysql2/promise'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

// Load .env from parent directory if present (monorepo root setup)
const parentEnvPath = join(process.cwd(), '../.env')
if (existsSync(parentEnvPath)) {
  const envContent = readFileSync(parentEnvPath, 'utf8')
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=')
      if (index > -1) {
        const key = trimmed.substring(0, index).trim()
        const val = trimmed.substring(index + 1).trim()
        if (key && val) {
          process.env[key] = val
        }
      }
    }
  })
}

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'web3job_user',
  password: process.env.DB_PASSWORD || 'web3job_secure_password',
  database: process.env.DB_NAME || 'remoteweb3Jobs',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

console.log(`🔌 Initializing MySQL Pool connecting to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)

export const pool = mysql.createPool(dbConfig)

// Helper to check and initialize tables if needed in development
export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Database connected successfully!')
    
    // Create the jobs table skeleton if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        tags VARCHAR(255),
        salary VARCHAR(100),
        description TEXT,
        apply_url VARCHAR(512),
        is_featured BOOLEAN DEFAULT FALSE,
        source VARCHAR(100) DEFAULT 'manual',
        is_approved BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    
    // Ensure 'source', 'is_approved' and 'sort_order' columns exist (if table was created before without them)
    const [columns]: any = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jobs'
    `, [dbConfig.database])

    const columnNames = columns.map((col: any) => col.COLUMN_NAME.toLowerCase())

    if (columnNames.length > 0) {
      if (!columnNames.includes('source')) {
        console.log('🔄 Adding "source" column to "jobs" table...')
        await connection.query(`ALTER TABLE jobs ADD COLUMN source VARCHAR(100) DEFAULT 'manual'`)
      }
      if (!columnNames.includes('is_approved')) {
        console.log('🔄 Adding "is_approved" column to "jobs" table...')
        await connection.query(`ALTER TABLE jobs ADD COLUMN is_approved BOOLEAN DEFAULT TRUE`)
      }
      if (!columnNames.includes('sort_order')) {
        console.log('🔄 Adding "sort_order" column to "jobs" table...')
        await connection.query(`ALTER TABLE jobs ADD COLUMN sort_order INT DEFAULT 0`)
      }
    }

    // Ensure 'idx_source' index exists on 'source' column
    const [indexes]: any = await connection.query(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jobs' AND INDEX_NAME = 'idx_source'
    `, [dbConfig.database])
    if (indexes.length === 0) {
      console.log('🔄 Adding "idx_source" index to "jobs" table...')
      await connection.query(`ALTER TABLE jobs ADD INDEX idx_source (source)`)
    }

    // Ensure 'idx_is_approved' index exists on 'is_approved' column
    const [approvedIndexes]: any = await connection.query(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jobs' AND INDEX_NAME = 'idx_is_approved'
    `, [dbConfig.database])
    if (approvedIndexes.length === 0) {
      console.log('🔄 Adding "idx_is_approved" index to "jobs" table...')
      await connection.query(`ALTER TABLE jobs ADD INDEX idx_is_approved (is_approved)`)
    }

    // Ensure 'idx_sort_order' index exists on 'sort_order' column
    const [sortIndexes]: any = await connection.query(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jobs' AND INDEX_NAME = 'idx_sort_order'
    `, [dbConfig.database])
    if (sortIndexes.length === 0) {
      console.log('🔄 Adding "idx_sort_order" index to "jobs" table...')
      await connection.query(`ALTER TABLE jobs ADD INDEX idx_sort_order (sort_order)`)
    }

    // Create the crawl_records table skeleton if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS crawl_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        url VARCHAR(512) NOT NULL,
        status VARCHAR(50) NOT NULL,
        extracted_count INT DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Create the tags table skeleton if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        is_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    
    console.log('✅ Base jobs and crawl_records schema initialized.')
    connection.release()
  } catch (err) {
    console.error('❌ Failed to connect/initialize database:', err)
  }
}

// In Bun, we can call it on module load if in development, or defer
initializeDatabase()

