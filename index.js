// Only use dotenv in development
if (process.env.NODE_ENV === "development") {
  require("dotenv").config();
}
const jwt = require('jsonwebtoken');
const {
  handleLogin,
  handleRegister,
  handlePasswordReset,
  handlePasswordResetConfirm,
  handlePasswordUpdate,
  handleLogout,
  handleValidateResetToken,
  handleProfileUpdate  // Add the new handler
} = require("./authProcessor");
const { createResponse } = require("./utils");

exports.handler = async (event) => {
  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return createResponse(200, {});
  }

  try {
    const { path, httpMethod, body } = event;
    let requestBody;
    try {
      requestBody = body ? JSON.parse(body) : {};
      console.log("Parsed body:", requestBody);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return createResponse(400, {
        error: "Invalid JSON in request body",
      });
    }

    let result;
    const routeKey = `${httpMethod} ${path}`;
    console.log("Route key:", routeKey);

    // Helper function to validate token and get userId
    const validateTokenAndGetUserId = (headers) => {
      const authHeader = headers.Authorization || headers.authorization;
      if (!authHeader) {
        throw new Error("Authorization header required");
      }
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId;
      } catch (error) {
        console.error('Token verification failed:', error);
        throw new Error("Invalid token");
      }
    };

    switch (routeKey) {
      case "POST /login":
        result = await handleLogin(requestBody);
        return result;

      case "POST /register":
        result = await handleRegister(requestBody);
        return result;

      case "POST /reset-password-request":
        result = await handlePasswordReset(requestBody);
        return result;

      case "POST /reset-password-confirm":
        result = await handlePasswordResetConfirm(requestBody);
        return result;

      case "POST /validate-reset-token":
        result = await handleValidateResetToken(requestBody);
        return result;

      case "POST /logout":
        console.log("Processing logout request");
        result = await handleLogout(requestBody, event.headers);
        return result;

      case "POST /update-password":
        try {
          const userId = validateTokenAndGetUserId(event.headers);
          result = await handlePasswordUpdate(requestBody, userId);
          return result;
        } catch (error) {
          return createResponse(401, { error: error.message });
        }

      case "POST /update-profile":
        try {
          const userId = validateTokenAndGetUserId(event.headers);
          result = await handleProfileUpdate(requestBody, userId);
          return result;
        } catch (error) {
          return createResponse(401, { error: error.message });
        }

      default:
        console.log("No matching route found for:", routeKey);
        return createResponse(404, {
          error: "Not Found",
          requestedRoute: routeKey,
        });
    }
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return createResponse(500, {
      error: error.message || "Internal server error",
    });
  }
};