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
    return await mysql.createConnection(config);
};

const getUserByUsername = async (username) => {
    const connection = await createConnection('read');
    try {
        const [rows] = await connection.execute(queries.getUserByUsername, [username]);
        return rows[0];
    } finally {
        await connection.end();
    }
};

const createUser = async (userData) => {
    const connection = await createConnection('write');
    try {
        const [result] = await connection.execute(queries.createUser, [
            userData.username,
            userData.passwordHash,
            userData.email,
            userData.city,
            userData.state,
            userData.countryCode,
            userData.latitude,
            userData.longitude
        ]);
        return result.insertId;
    } finally {
        await connection.end();
    }
};

module.exports = {
    createConnection,
    getUserByUsername,
    createUser
};