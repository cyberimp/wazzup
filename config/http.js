var process = require("process");

module.exports = {
  production: {
    port: process.env.PORT || 3010,
    authURL: "https://auth.wazzup24.com",
    authInnerURL: "http://auth-private:33000",
    backendURL: "http://" + (process.env.IS_DEV ? "dev-": "") + "backend.wazzup24.com",
    frontendURL: "http://" + (process.env.IS_DEV ? "dev-": "") + "app.wazzup24.com",
    requestTimeout: 10000
  },
  development: {
    port: process.env.PORT || 3010,
    authURL: "http://localhost:3000",
    authInnerURL: "http://localhost:33000",
    backendURL: "http://" + (process.env.IS_DEV ? "dev-": "") + "backend.wazzup24.com",
    frontendURL: "http://" + (process.env.IS_DEV ? "dev-": "") + "app.wazzup24.com",
    requestTimeout: 10000
  },
  test: {
    port: process.env.PORT || 3010,
    authURL: process.env.AUTH_URL || "http://localhost:3000",
    authInnerURL: process.env.AUTH_INNER_URL || "http://localhost:33000",
    backendURL: "http://" + (process.env.IS_DEV ? "dev-": "") + "backend.wazzup24.com",
    frontendURL: "http://" + (process.env.IS_DEV ? "dev-": "") + "app.wazzup24.com",
    requestTimeout: 10000
  }
}