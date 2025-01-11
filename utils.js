// utils.js
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

module.exports = { createResponse, ALLOWED_ORIGIN };