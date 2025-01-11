const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getUserByUsername, createUser, createConnection, getUserById, updateUserPassword } = require('./database');
const { queries } = require('./queries');
const { sendPasswordResetEmail } = require('./emailService');

const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user.user_id, 
            username: user.username 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
    );
};

const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const handleLogin = async (requestBody) => {
    console.log('Login attempt for username:', requestBody.username);
    
    const { username, password } = requestBody;

    // Validate input
    if (!username || !password) {
        console.log('Login failed: Missing username or password');
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Username and password are required' })
        };
    }

    try {
        const user = await getUserByUsername(username);
        console.log('User lookup result:', user ? 'User found' : 'User not found');

        if (!user) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid credentials' })
            };
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('Password validation result:', validPassword ? 'Valid' : 'Invalid');

        if (!validPassword) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid credentials' })
            };
        }

        const token = generateToken(user);

        return {
            statusCode: 200,
            body: JSON.stringify({
                token,
                user: {
                    username: user.username,
                    email: user.email,
                    city: user.city,
                    state: user.state,
                    countryCode: user.country_code
                }
            })
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error during login' })
        };
    }
};

const handleRegister = async (requestBody) => {
    console.log('Registration request body:', requestBody); // Debug log

    const { username, password } = requestBody;

    // Validate required fields
    if (!username || !password) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Username and password are required' })
        };
    }

    // Check if user exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
        return {
            statusCode: 409,
            body: JSON.stringify({ message: 'Username already exists' })
        };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userId = await createUser({
        username,
        passwordHash
    });

    return {
        statusCode: 201,
        body: JSON.stringify({ 
            message: 'User created successfully',
            userId
        })
    };
};

const initiatePasswordReset = async (requestBody) => {
    const { email } = requestBody;
    
    // Get user by email
    const connection = await createConnection('read');
    try {
        const [users] = await connection.execute(
            'SELECT user_id, username, email FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return {
                statusCode: 200, // Return 200 even if email not found for security
                body: JSON.stringify({
                    message: 'If your email is registered, you will receive password reset instructions.'
                })
            };
        }

        const user = users[0];
        const resetToken = generateResetToken();
        
        // Store reset token
        const writeConnection = await createConnection('write');
        try {
            await writeConnection.execute(
                queries.createPasswordReset,
                [user.user_id, resetToken]
            );
            
            // Send reset email
            await sendPasswordResetEmail(user.email, resetToken, user.username);
            
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Password reset instructions have been sent to your email.'
                })
            };
        } finally {
            await writeConnection.end();
        }
    } finally {
        await connection.end();
    }
};

const handlePasswordReset = async (requestBody) => {
    const { token, newPassword } = requestBody;

    const connection = await createConnection('write');
    try {
        await connection.beginTransaction();

        // Verify reset token
        const [resets] = await connection.execute(
            queries.getPasswordReset,
            [token]
        );

        if (resets.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Invalid or expired reset token'
                })
            };
        }

        const reset = resets[0];

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await connection.execute(
            queries.updateUserPassword,
            [passwordHash, reset.user_id]
        );

        // Mark reset token as used
        await connection.execute(
            queries.markResetTokenUsed,
            [token]
        );

        await connection.commit();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Password has been successfully reset'
            })
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        await connection.end();
    }
};

const handlePasswordUpdate = async (requestBody, userId) => {
    const { currentPassword, newPassword } = requestBody;

    // Get user
    const user = await getUserById(userId);
    if (!user) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: 'User not found'
            })
        };
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                message: 'Current password is incorrect'
            })
        };
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await updateUserPassword(userId, passwordHash);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Password has been successfully updated'
        })
    };
};

module.exports = {
    handleLogin,
    handleRegister,
    handlePasswordReset,
    initiatePasswordReset,
    handlePasswordUpdate
};