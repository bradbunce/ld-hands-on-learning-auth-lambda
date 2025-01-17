// Only use dotenv in development
if (process.env.NODE_ENV === "development") {
  require("dotenv").config();
}

const jwt = require('jsonwebtoken');
const {
  handleLogin,
  handleRegister,
  handlePasswordReset,
  handlePasswordUpdate,
  handleLogout
  } = require("./authProcessor");
const { createResponse } = require("./utils"); // Import from utils

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

    switch (routeKey) {
      case "POST /login":
        result = await handleLogin(requestBody);
        return result;
      case "POST /register":
        result = await handleRegister(requestBody);
        return result;
      case "POST /reset-password":
        result = await handlePasswordReset(requestBody);
        return result;
      case "POST /logout":
        console.log("Processing logout request");
        result = await handleLogout(requestBody, event.headers);
        return result;
        case "POST /update-password":
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
  handleLogout
} = require("./authProcessor");
const { createResponse } = require("./utils"); // Import from utils

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
      case "POST /logout":
        console.log("Processing logout request");
        result = await handleLogout(requestBody, event.headers);
        return result;
      case "POST /update-password":
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!authHeader) {
          return createResponse(401, { error: "Authorization header required" });
        }
        // Extract token from Bearer header
        const token = authHeader.replace('Bearer ', '');
        try {
          // Verify and decode the token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          result = await handlePasswordUpdate(requestBody, decoded.userId);
          return result;
        } catch (error) {
          console.error('Token verification failed:', error);
          return createResponse(401, { error: "Invalid token" });
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
};          if (!authHeader) {
            return createResponse(401, { error: "Authorization header required" });
          }
          
          // Extract token from Bearer header
          const token = authHeader.replace('Bearer ', '');
          
          try {
            // Verify and decode the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            result = await handlePasswordUpdate(requestBody, decoded.userId);
            return result;
          } catch (error) {
            console.error('Token verification failed:', error);
            return createResponse(401, { error: "Invalid token" });
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
