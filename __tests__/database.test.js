const { createConnection, getUserByUsername, createUser, updateUserPassword } = require('../database');
const mysql = require('mysql2/promise');

jest.mock('mysql2/promise');

describe('Database Operations', () => {
    const mockConnection = {
        execute: jest.fn(),
        end: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mysql.createConnection.mockResolvedValue(mockConnection);
    });

    describe('getUserByUsername', () => {
        it('should return user data when found', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            mockConnection.execute.mockResolvedValue([[mockUser]]);

            const result = await getUserByUsername('testuser');

            expect(result).toEqual(mockUser);
            expect(mockConnection.execute).toHaveBeenCalled();
            expect(mockConnection.end).toHaveBeenCalled();
        });

        it('should return null when user not found', async () => {
            mockConnection.execute.mockResolvedValue([[]]);

            const result = await getUserByUsername('nonexistent');

            expect(result).toBeUndefined();
            expect(mockConnection.execute).toHaveBeenCalled();
            expect(mockConnection.end).toHaveBeenCalled();
        });
    });
});