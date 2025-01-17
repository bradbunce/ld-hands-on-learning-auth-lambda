const AWS = require('aws-sdk');

// Configure AWS Lambda
const lambda = new AWS.Lambda({
    region: process.env.REGION
});

const sendPasswordResetEmail = async (email, resetToken, username) => {
    console.log('Initiating password reset email send to:', email);
    
    try {
        const params = {
            FunctionName: process.env.SES_LAMBDA_NAME, // Name or ARN of your SES Lambda
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({
                email: email,
                resetToken: resetToken,
                username: username // In case you want to personalize the email
            })
        };

        const result = await lambda.invoke(params).promise();
        const response = JSON.parse(result.Payload);
        
        console.log('SES Lambda response:', response);
        
        if (result.FunctionError) {
            throw new Error(`SES Lambda error: ${result.FunctionError}`);
        }

        if (response.statusCode !== 200) {
            throw new Error(`Email sending failed: ${response.body}`);
        }

        console.log('Password reset email sent successfully');
        return {
            success: true,
            messageId: JSON.parse(response.body).messageId
        };
    } catch (error) {
        console.error('Error sending password reset email:', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        throw error; // Let the calling function handle the error
    }
};

module.exports = {
    sendPasswordResetEmail
};