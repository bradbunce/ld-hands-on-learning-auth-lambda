const mysql = require('mysql2/promise');
const { queries } = require('./queries');

const dbConfig = {
    primary: {
        host: process.env.DB_PRIMARY_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },
    replica: {
        host: process.env.DB_READ_REPLICA_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    }
};

const createConnection = async (operation = 'read') => {
    const config = operation === 'read' ? dbConfig.replica : dbConfig.primary;
    try {
        const connection = await mysql.createConnection(config);
        // Test the connection and ensure database is selected
        await connection.query('SELECT 1');
        return connection;
    } catch (error) {
        console.error('Database connection error:', {
            error: error.message,
            code: error.code,
            config: {
                host: config.host,
                user: config.user,
                database: config.database
            }
        });
        throw error;
    }
};

const getUserByUsername = async (username) => {
    let connection;
    try {
        connection = await createConnection('read');
        const [rows] = await connection.execute(
            queries.getUserByUsername,
            [username]
        );
        return rows[0];
    } catch (error) {
        console.error('Error getting user by username:', {
            error: error.message,
            username
        });
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const getUserById = async (userId) => {
    let connection;
    try {
        connection = await createConnection('read');
        const [rows] = await connection.execute(
            queries.getUserByUsername, // You might want to create a specific query for this
            [userId]
        );
        return rows[0];
    } catch (error) {
        console.error('Error getting user by ID:', {
            error: error.message,
            userId
        });
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const createUser = async ({ username, passwordHash, email, city, state, countryCode, latitude, longitude }) => {
    let connection;
    try {
        connection = await createConnection('write');
        const [result] = await connection.execute(
            queries.createUser,
            [username, passwordHash, email, city, state, countryCode, latitude, longitude]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating user:', {
            error: error.message,
            username
        });
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const updateUserPassword = async (userId, passwordHash) => {
    let connection;
    try {
        connection = await createConnection('write');
        await connection.execute(
            queries.updateUserPassword,
            [passwordHash, userId]
        );
    } catch (error) {
        console.error('Error updating user password:', {
            error: error.message,
            userId
        });
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const getLocationsForUser = async (userId) => {
    let connection;
    try {
        connection = await createConnection('read');
        const [rows] = await connection.execute(queries.getUserLocations, [userId]);
        return rows;
    } catch (error) {
        console.error('Error getting user locations:', {
            error: error.message,
            userId
        });
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

module.exports = {
    createConnection,
    getLocationsForUser,
    getUserByUsername,
    getUserById,
    createUser,
    updateUserPassword
};