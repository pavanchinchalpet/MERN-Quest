const { Pool } = require('pg');
require('dotenv').config();

// Direct connection for SQL execution engine
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
