import { sql } from '@vercel/postgres';

// Initialize database schema
export async function initSchema() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        provider VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `;
    
    // Create user_api_keys table
    await sql`
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        encrypted_key TEXT NOT NULL,
        key_hash VARCHAR(255),
        iv VARCHAR(255),
        auth_tag VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create trades table
    await sql`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        layer INTEGER,
        category VARCHAR(100),
        ticker VARCHAR(100),
        side VARCHAR(10),
        market_price DECIMAL(10, 4),
        estimated_prob DECIMAL(10, 4),
        signal_strength DECIMAL(10, 4),
        execution_price DECIMAL(10, 4),
        close_time TIMESTAMP,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
}

// User operations
export async function createUser(email, name, provider) {
  try {
    const result = await sql`
      INSERT INTO users (email, name, provider, last_login)
      VALUES (${email}, ${name}, ${provider}, CURRENT_TIMESTAMP)
      RETURNING id, email, name, provider
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByEmail(email) {
  try {
    const result = await sql`
      SELECT id, email, name, provider, created_at, last_login
      FROM users
      WHERE email = ${email}
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export async function updateUserLogin(email) {
  try {
    await sql`
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE email = ${email}
    `;
  } catch (error) {
    console.error('Error updating user login:', error);
    throw error;
  }
}

// API Key operations
export async function saveApiKey(userId, encryptedKey, keyHash, iv, authTag) {
  try {
    const result = await sql`
      INSERT INTO user_api_keys (user_id, encrypted_key, key_hash, iv, auth_tag)
      VALUES (${userId}, ${encryptedKey}, ${keyHash}, ${iv}, ${authTag})
      RETURNING id, created_at
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error saving API key:', error);
    throw error;
  }
}

export async function getUserApiKey(userId) {
  try {
    const result = await sql`
      SELECT id, encrypted_key, key_hash, iv, auth_tag, created_at
      FROM user_api_keys
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user API key:', error);
    throw error;
  }
}

// Trade operations
export async function saveTrade(userId, tradeData) {
  try {
    const result = await sql`
      INSERT INTO trades (user_id, layer, category, ticker, side, market_price, estimated_prob, signal_strength, execution_price, close_time, status)
      VALUES (${userId}, ${tradeData.layer}, ${tradeData.category}, ${tradeData.ticker}, ${tradeData.side}, ${tradeData.marketPrice}, ${tradeData.estimatedProb}, ${tradeData.signalStrength}, ${tradeData.executionPrice}, ${tradeData.closeTime}, ${'pending'})
      RETURNING id, created_at
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error saving trade:', error);
    throw error;
  }
}

export async function getUserTrades(userId, limit = 20) {
  try {
    const result = await sql`
      SELECT id, layer, category, ticker, side, market_price, estimated_prob, signal_strength, execution_price, close_time, status, created_at
      FROM trades
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  } catch (error) {
    console.error('Error fetching user trades:', error);
    throw error;
  }
}

// Stats operations
export async function getUserStats(userId) {
  try {
    const result = await sql`
      SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN status = 'win' THEN 1 ELSE 0 END) as winning_trades,
        AVG(signal_strength) as avg_signal_strength
      FROM trades
      WHERE user_id = ${userId}
    `;
    
    const stats = result.rows[0];
    const winRate = stats.total_trades > 0 ? (stats.winning_trades / stats.total_trades) * 100 : 0;
    
    return {
      totalTrades: parseInt(stats.total_trades) || 0,
      winningTrades: parseInt(stats.winning_trades) || 0,
      winRate: winRate.toFixed(2),
      avgSignalStrength: stats.avg_signal_strength ? parseFloat(stats.avg_signal_strength).toFixed(2) : '0.00'
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
}

export { sql };