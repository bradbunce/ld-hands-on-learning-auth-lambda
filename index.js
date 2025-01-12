// Only use dotenv in development
if (process.env.NODE_ENV === "development") {
  require("dotenv").config();
}

const {
  handleLogin,
  handleRegister,
  handlePasswordReset,
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
