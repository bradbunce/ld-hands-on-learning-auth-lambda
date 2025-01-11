const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { handleLogin, handleRegister, handlePasswordReset, handlePasswordUpdate } = require('../authProcessor');
const { getUserByUsername, createUser, updateUserPassword } = require('../database');

// Mock the database module
jest.mock('../database');

describe('Authentication Processor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('handleLogin', () => {
        it('should return a token for valid credentials', async () => {
            const mockUser = {
                user_id: 1,
                username: 'testuser',
                password_hash: await bcrypt.hash('password123', 10),
                email: 'test@example.com'
            };

            getUserByUsername.mockResolvedValue(mockUser);

            const result = await handleLogin({
                username: 'testuser',
                password: 'password123'
            });

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body).toHaveProperty('token');
            expect(jwt.verify(body.token, process.env.JWT_SECRET)).toBeTruthy();
        });

        it('should return 401 for invalid password', async () => {
            const mockUser = {
                user_id: 1,
                username: 'testuser',
                password_hash: await bcrypt.hash('password123', 10)
            };

            getUserByUsername.mockResolvedValue(mockUser);

            const result = await handleLogin({
                username: 'testuser',
                password: 'wrongpassword'
            });

            expect(result.statusCode).toBe(401);
            expect(JSON.parse(result.body)).toEqual({
                message: 'Invalid credentials'
            });
        });
    });

    describe('handleRegister', () => {
        it('should create a new user successfully', async () => {
            getUserByUsername.mockResolvedValue(null);
            createUser.mockResolvedValue(1);

            const result = await handleRegister({
                username: 'newuser',
                password: 'password123',
                email: 'new@example.com',
                city: 'New York',
                state: 'NY',
                countryCode: 'US',
                latitude: 40.7128,
                longitude: -74.0060
            });

            expect(result.statusCode).toBe(201);
            expect(JSON.parse(result.body)).toEqual({
                message: 'User created successfully',
                userId: 1
            });
        });

        it('should return 409 for existing username', async () => {
            getUserByUsername.mockResolvedValue({ username: 'existinguser' });

            const result = await handleRegister({
                username: 'existinguser',
                password: 'password123'
            });

            expect(result.statusCode).toBe(409);
            expect(JSON.parse(result.body)).toEqual({
                message: 'Username already exists'
            });
        });
    });
});