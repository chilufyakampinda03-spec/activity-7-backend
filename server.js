require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const guide = require("./guide");

const app = express();
const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",").map((value) => value.trim()).filter(Boolean);
// If CLIENT_ORIGINS is empty, any origin may read the API (handy while testing).
app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json());

app.get("/", (req, res) => {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  res.status(200).type("html").send(guide(`${proto}://${req.get("host")}`));
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "error", message: "Database is not responding." });
  }
});

app.use("/api/records", require("./routes/records"));

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Error handler (four parameters)
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed" || error instanceof SyntaxError) {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }
  if (error.type === "entity.too.large") {
    return res.status(400).json({ message: "Request body is too large." });
  }
  console.error("Unexpected error:", error);
  res.status(500).json({ message: "Something went wrong on the server." });
});

const port = process.env.PORT || 3000;
pool.init()
  .then(() => {
    app.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
  })
  .catch((error) => {
    console.error("Database setup failed:", error);
    process.exit(1);
  });
