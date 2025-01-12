// utils.js
const ALLOWED_ORIGIN = process.env.REACT_APP_ALLOWED_ORIGIN;

if (!ALLOWED_ORIGIN) {
    throw new Error('REACT_APP_ALLOWED_ORIGIN environment variable must be set');
}

const createResponse = (statusCode, body, headers = {}) => {
    // For preflight requests, we want to return specific headers
    const isPreflightRequest = statusCode === 204;

    // Ensure body is properly stringified
    let stringifiedBody;
    try {
        stringifiedBody = isPreflightRequest ? '' : JSON.stringify(body);
    } catch (error) {
        console.error('Error stringifying response body:', error);
        stringifiedBody = JSON.stringify({ error: 'Internal server error' });
        statusCode = 500;
    }

    const corsHeaders = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
        'Vary': 'Origin'  // Important for proxies
    };

    // Log the response being sent
    console.log('Sending response:', {
        statusCode,
        headers: { ...corsHeaders, ...headers },
        bodyLength: stringifiedBody.length
    });

    return {
        statusCode,
        headers: {
            'Content-Type': isPreflightRequest ? undefined : 'application/json',
            ...corsHeaders,
            ...headers
        },
        body: stringifiedBody
    };
};

// Helper function to handle OPTIONS requests
const handleOptions = () => createResponse(204, null);

module.exports = { 
    createResponse, 
    handleOptions,
    ALLOWED_ORIGIN 
};