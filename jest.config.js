module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        '*.js',
        '!jest.config.js',
        '!.eslintrc.js'
    ],
    testMatch: ['**/*.test.js'],
    setupFiles: ['./__tests__/setup.js']
};