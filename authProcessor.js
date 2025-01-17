const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { 
    getUserByUsername,
    getUserByEmail, 
    createUser, 
    createConnection, 
    getUserById, 
    updateUserPassword 
} = require('./database');
const { queries } = require('./queries');
const { sendPasswordResetEmail } = require('./emailService');
const { createResponse } = require('./utils');

const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable must be set');
    }
    if (!process.env.JWT_EXPIRATION) {
        throw new Error('JWT_EXPIRATION environment variable must be set');
    }

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
    console.log('Login attempt started');
    
    const { username, password } = requestBody;

    if (!username || !password) {
        console.log('Login failed: Missing credentials');
        return createResponse(400, { error: 'Username and password are required' });
    }

    try {
        console.log('Attempting database connection and user lookup');
        const user = await getUserByUsername(username);
        console.log('Database response received:', {
            userFound: !!user,
            timestamp: new Date().toISOString()
        });

        if (!user) {
            console.log('Login failed: User not found');
            return createResponse(401, { error: 'Invalid credentials' });
        }

        console.log('Attempting password validation');
        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('Password validation completed:', {
            isValid: validPassword,
            timestamp: new Date().toISOString()
        });

        if (!validPassword) {
            console.log('Login failed: Invalid password');
            return createResponse(401, { error: 'Invalid credentials' });
        }

        console.log('Generating JWT token');
        const token = generateToken(user);
        const response = {
            token,
            user: {
                username: user.username,
                email: user.email,
                city: user.city,
                state: user.state,
                countryCode: user.country_code
            }
        };
        
        console.log('Login successful');
        return createResponse(200, response);
    } catch (error) {
        console.error('Login error details:', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
        });

        if (error.code === 'ECONNREFUSED') {
            console.error('Database connection failed');
            return createResponse(503, { error: 'Database connection failed' });
        }

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Database access denied');
            return createResponse(503, { error: 'Database access error' });
        }

        return createResponse(500, { 
            error: 'Internal server error during login',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const handleRegister = async (requestBody) => {
    console.log('Registration attempt started');

    const { username, email, password } = requestBody;

    if (!username || !password || !email) {
        console.log('Registration failed: Missing required fields');
        return createResponse(400, { 
            error: 'Username, email, and password are required' 
        });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('Registration failed: Invalid email format');
        return createResponse(400, { 
            error: 'Invalid email format' 
        });
    }

    const connection = await createConnection('write');
    try {
        await connection.beginTransaction();

        // Check for existing username
        const [existingUsers] = await connection.execute(
            queries.getUserByUsername,
            [username]
        );

        if (existingUsers.length > 0) {
            console.log('Registration failed: Username exists');
            return createResponse(409, { 
                error: 'Username already exists' 
            });
        }

        // Check for existing email
        const [existingEmails] = await connection.execute(
            queries.getUserByEmail,
            [email]
        );

        if (existingEmails.length > 0) {
            console.log('Registration failed: Email exists');
            return createResponse(409, { 
                error: 'Email address already registered' 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create new user
        const [result] = await connection.execute(
            queries.createUser,
            [username, email, passwordHash]
        );

        await connection.commit();
        
        console.log('Registration successful');
        return createResponse(201, { 
            message: 'User created successfully',
            userId: result.insertId 
        });
    } catch (error) {
        console.error('Registration error:', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
        });

        await connection.rollback();
        return createResponse(500, { 
            error: 'Internal server error during registration',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        await connection.end();
    }
};

const handleLogout = async (requestBody, headers) => {
    try {
        const authHeader = headers.Authorization || headers.authorization;
        if (!authHeader) {
            console.log('Logout failed: No authorization header');
            return createResponse(400, { error: 'No authorization token provided' });
        }

        const token = authHeader.replace('Bearer ', '');
        
        try {
            // Verify the token is valid before processing logout
            jwt.verify(token, process.env.JWT_SECRET);
            
            console.log('Logout successful');
            return createResponse(200, { 
                message: 'Logged out successfully' 
            });
        } catch (error) {
            console.log('Logout failed: Invalid token');
            return createResponse(401, { 
                error: 'Invalid token' 
            });
        }
    } catch (error) {
        console.error('Logout error:', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
        });

        return createResponse(500, { 
            error: 'Internal server error during logout',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const handleValidateResetToken = async (requestBody) => {
    console.log('Reset token validation started');
    const { resetToken } = requestBody;

    if (!resetToken) {
        console.log('Token validation failed: Missing token');
        return createResponse(400, { error: 'Reset token is required' });
    }

    const connection = await createConnection('write');
    try {
        // Check if reset token is valid and not expired
        const [resets] = await connection.execute(
            queries.getValidPasswordReset,
            [resetToken, new Date()]
        );

        if (resets.length === 0) {
            console.log('Token validation failed: Invalid or expired token');
            return createResponse(400, {
                error: 'Invalid or expired reset token'
            });
        }

        console.log('Token validation successful');
        return createResponse(200, {
            message: 'Token is valid'
        });
    } catch (error) {
        console.error('Token validation error:', error);
        return createResponse(500, {
            error: 'Internal server error during token validation'
        });
    } finally {
        await connection.end();
    }
};

const handlePasswordReset = async (requestBody) => {
    console.log('Password reset request started');
    const { email } = requestBody;

    if (!email) {
        console.log('Password reset request failed: Missing email');
        return createResponse(400, { error: 'Email is required' });
    }

    const connection = await createConnection('write');
    try {
        await connection.beginTransaction();

        // Retrieve user by email
        const [users] = await connection.execute(
            queries.getUserByEmail,
            [email]
        );

        if (users.length === 0) {
            console.log('Password reset request failed: Email not found');
            return createResponse(404, {
                error: 'No account associated with this email'
            });
        }

        const user = users[0];
        const resetToken = generateResetToken();
        
        console.log('Password reset email would be sent to:', email);
        console.log('Reset token:', resetToken);
        console.log('Username:', user.username);  // This will now correctly show the username

        // Store reset token
        await connection.execute(
            queries.createPasswordReset,
            [user.user_id, resetToken]
        );

        // Send password reset email
        await sendPasswordResetEmail(email, resetToken, user.username);  // Pass username to email service

        await connection.commit();
        console.log('Password reset request successful');
        return createResponse(200, {
            message: 'Password reset link sent to your email'
        });
    } catch (error) {
        console.error('Password reset request error:', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
        });

        await connection.rollback();
        return createResponse(500, {
            error: 'Internal server error during password reset request',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        await connection.end();
    }
};

const handlePasswordUpdate = async (requestBody, userId) => {
    console.log('Password update attempt started');
    const { currentPassword, newPassword } = requestBody;

    if (!currentPassword || !newPassword) {
        console.log('Password update failed: Missing required fields');
        return createResponse(400, { error: 'Current password and new password are required' });
    }

    try {
        const user = await getUserById(userId);
        if (!user) {
            console.log('Password update failed: User not found');
            return createResponse(404, { error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            console.log('Password update failed: Invalid current password');
            return createResponse(401, { error: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await updateUserPassword(userId, passwordHash);

        console.log('Password update successful');
        return createResponse(200, {
            message: 'Password has been successfully updated'
        });
    } catch (error) {
        console.error('Password update error:', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
        });

        return createResponse(500, {
            error: 'Internal server error during password update',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const handlePasswordResetConfirm = async (requestBody) => {
    console.log('Password reset confirmation started');
    const { resetToken, newPassword } = requestBody;

    if (!resetToken || !newPassword) {
        console.log('Password reset confirmation failed: Missing required fields');
        return createResponse(400, { error: 'Reset token and new password are required' });
    }

    const connection = await createConnection('write');
    try {
        await connection.beginTransaction();

        // Check if reset token is valid and not expired
        const [resets] = await connection.execute(
            queries.getValidPasswordReset,
            [resetToken, new Date()]
        );

        if (resets.length === 0) {
            console.log('Password reset confirmation failed: Invalid or expired token');
            return createResponse(400, {
                error: 'Invalid or expired reset token'
            });
        }

        const reset = resets[0];
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update user password
        await connection.execute(
            queries.updateUserPassword,
            [passwordHash, reset.user_id]
        );

        // Mark reset token as used
        await connection.execute(
            queries.markResetTokenUsed,
            [resetToken]
        );

        await connection.commit();
        console.log('Password reset confirmation successful');
        return createResponse(200, {
            message: 'Password has been successfully reset'
        });
    } catch (error) {
        console.error('Password reset confirmation error:', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
        });

        await connection.rollback();
        return createResponse(500, {
            error: 'Internal server error during password reset confirmation',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        await connection.end();
    }
};

module.exports = {
    handleLogin,
    handleRegister,
    handlePasswordReset,
    handlePasswordResetConfirm,
    handlePasswordUpdate,
    handleLogout,
    handleValidateResetToken
};