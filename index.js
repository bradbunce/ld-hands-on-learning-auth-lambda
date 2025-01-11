// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { handleLogin, handleRegister, handlePasswordReset } = require('./authProcessor');

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://weather-app.brad.launchdarklydemos.com',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Credentials': true
};

exports.handler = async (event) => {
    // Handle OPTIONS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    try {
        const { path, httpMethod, body } = event;
        const requestBody = JSON.parse(body);

        let response;
        switch (`${httpMethod} ${path}`) {
            case 'POST /login':
                response = await handleLogin(requestBody);
                break;
            case 'POST /register':
                response = await handleRegister(requestBody);
                break;
            case 'POST /reset-password':
                response = await handlePasswordReset(requestBody);
                break;
            default:
                response = {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Not Found' })
                };
        }

        // Add CORS headers to successful response
        return {
            ...response,
            headers: {
                ...corsHeaders,
                ...(response.headers || {})
            }
        };

    } catch (error) {
        console.error('Error:', error);
        // Add CORS headers to error response
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
            headers: corsHeaders
        };
    }
};