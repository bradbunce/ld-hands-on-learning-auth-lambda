const mysql = require('mysql2/promise');
const { queries } = require('./queries');

// Validate required environment variables
const requiredEnvVars = [
    'DB_PRIMARY_HOST',
    'DB_READ_REPLICA_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        throw new Error(`Required environment variable ${varName} is not set`);
    }
});

const dbConfig = {
    primary: {
        host: process.env.DB_PRIMARY_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectTimeout: 10000, // 10 seconds
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    },
    replica: {
        host: process.env.DB_READ_REPLICA_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectTimeout: 10000, // 10 seconds
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    }
};

const createConnection = async (operation = 'read') => {
    const config = operation === 'read' ? dbConfig.replica : dbConfig.primary;
    let connection;
    
    try {
        console.log(`Attempting to connect to ${operation} database at ${config.host}`);
        connection = await mysql.createConnection(config);
        
        // Test the connection
        console.log('Testing database connection...');
        await connection.query('SELECT 1');
        console.log('Database connection successful');
        
        return connection;
    } catch (error) {
        console.error('Database connection error:', {
            error: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage,
            config: {
                host: config.host,
                user: config.user,
                database: config.database
            },
            timestamp: new Date().toISOString()
        });
        
        // Enhance error message based on error code
        if (error.code === 'ECONNREFUSED') {
            throw new Error(`Database connection refused at ${config.host}`);
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            throw new Error('Database access denied - invalid credentials');
        } else if (error.code === 'ETIMEDOUT') {
            throw new Error(`Database connection timed out at ${config.host}`);
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            throw new Error(`Database ${config.database} does not exist`);
        }
        
        throw error;
    }
};

const getUserByUsername = async (username) => {
    let connection;
    try {
        console.log(`Getting user by username: ${username}`);
        connection = await createConnection('read');
        
        const [rows] = await connection.execute(
            queries.getUserByUsername,
            [username]
        );
        
        console.log(`User lookup result: ${rows.length ? 'Found' : 'Not found'}`);
        return rows[0];
    } catch (error) {
        console.error('Error getting user by username:', {
            error: error.message,
            username,
            timestamp: new Date().toISOString()
        });
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (error) {
                console.error('Error closing connection:', error);
            }
        }
    }
};

const getUserById = async (userId) => {
    let connection;
    try {
        console.log(`Getting user by ID: ${userId}`);
        connection = await createConnection('read');
        
        // Fixed: Use correct query for getting user by ID
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE user_id = ?',
            [userId]
        );
        
        console.log(`User lookup result: ${rows.length ? 'Found' : 'Not found'}`);
        return rows[0];
    } catch (error) {
        console.error('Error getting user by ID:', {
            error: error.message,
            userId,
            timestamp: new Date().toISOString()
        });
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (error) {
                console.error('Error closing connection:', error);
            }
        }
    }
};

const createUser = async ({ username, passwordHash }) => {
    let connection;
    try {
        console.log(`Creating new user: ${username}`);
        connection = await createConnection('write');
        
        const [result] = await connection.execute(
            queries.createUser,
            [username, passwordHash]
        );
        
        console.log(`User created with ID: ${result.insertId}`);
        return result.insertId;
    } catch (error) {
        console.error('Error creating user:', {
            error: error.message,
            username,
            timestamp: new Date().toISOString()
        });
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (error) {
                console.error('Error closing connection:', error);
            }
        }
    }
};

const updateUserPassword = async (userId, passwordHash) => {
    let connection;
    try {
        console.log(`Updating password for user ID: ${userId}`);
        connection = await createConnection('write');
        
        await connection.execute(
            queries.updateUserPassword,
            [passwordHash, userId]
        );
        
        console.log('Password update successful');
    } catch (error) {
        console.error('Error updating user password:', {
            error: error.message,
            userId,
            timestamp: new Date().toISOString()
        });
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (error) {
                console.error('Error closing connection:', error);
            }
        }
    }
};

module.exports = {
    createConnection,
    getUserByUsername,
    getUserById,
    createUser,
    updateUserPassword
};