// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { handleLogin, handleRegister, handlePasswordReset } = require('./authProcessor');

// Ensure exact match with your domain
const ALLOWED_ORIGIN = 'https://weather-app.brad.launchdarklydemos.com';

const createResponse = (statusCode, body, headers = {}) => ({
    statusCode,
    body: JSON.stringify(body),
    headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Credentials': 'true',
        ...headers
    }
});

exports.handler = async (event) => {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return createResponse(200, {});
    }

    try {
        const { path, httpMethod, body } = event;
        const requestBody = JSON.parse(body);

        let result;
        switch (`${httpMethod} ${path}`) {
            case 'POST /login':
                result = await handleLogin(requestBody);
                return createResponse(200, result);
            case 'POST /register':
                result = await handleRegister(requestBody);
                return createResponse(200, result);
            case 'POST /reset-password':
                result = await handlePasswordReset(requestBody);
                return createResponse(200, result);
            default:
                return createResponse(404, { message: 'Not Found' });
        }
    } catch (error) {
        console.error('Error:', error);
        return createResponse(500, { message: 'Internal server error' });
    }
};