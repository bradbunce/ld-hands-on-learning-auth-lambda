// Only use dotenv in development
if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}

const { handleLogin, handleRegister, handlePasswordReset } = require('./authProcessor');

// Ensure exact match with your domain
const ALLOWED_ORIGIN = 'https://weather-app.brad.launchdarklydemos.com';

const createResponse = (statusCode, body, headers = {}) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Credentials': 'true',
        ...headers
    },
    body: JSON.stringify(body)
});

exports.handler = async (event) => {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return createResponse(200, {});
    }

    try {
        const { path, httpMethod, body } = event;
        let requestBody;
        
        try {
            requestBody = body ? JSON.parse(body) : {};
        } catch (e) {
            return createResponse(400, { 
                error: 'Invalid JSON in request body'
            });
        }

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
                return createResponse(404, { 
                    error: 'Not Found' 
                });
        }
    } catch (error) {
        console.error('Error:', error);
        // Send a more specific error message while maintaining security
        return createResponse(500, { 
            error: error.message || 'Internal server error'
        });
    }
};