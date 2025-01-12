// utils.js

// Require allowed origin from environment variable
const ALLOWED_ORIGIN = process.env.REACT_APP_ALLOWED_ORIGIN;

// Throw error if environment variable is not set
if (!ALLOWED_ORIGIN) {
    throw new Error('REACT_APP_ALLOWED_ORIGIN environment variable must be set');
}

const createResponse = (statusCode, body, headers = {}) => {
    // For preflight requests, we want to return specific headers
    const isPreflightRequest = statusCode === 204;

    const corsHeaders = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
    };

    return {
        statusCode,
        headers: {
            'Content-Type': isPreflightRequest ? undefined : 'application/json',
            ...corsHeaders,
            ...headers
        },
        body: isPreflightRequest ? '' : JSON.stringify(body)
    };
};

// Helper function to handle OPTIONS requests
const handleOptions = () => createResponse(204, null);

module.exports = { 
    createResponse, 
    handleOptions,
    ALLOWED_ORIGIN 
};