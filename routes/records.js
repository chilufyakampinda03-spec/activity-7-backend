const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const COLUMNS = "id, title, category, description, status";

function parseId(raw) {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id <= 2147483647 ? id : null;
}

// Returns { error } or { value } with trimmed editable fields. Any client-sent id is ignored.
function validate(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }
  const rules = [
    ["title", "Title", 3, 80],
    ["category", "Category", 2, 40],
    ["description", "Description", 5, 300],
  ];
  const value = {};
  for (const [key, label, min, max] of rules) {
    const raw = body[key];
    if (raw === undefined || raw === null) return { error: `${label} is required.` };
    if (typeof raw !== "string") return { error: `${label} must be text.` };
    const text = raw.trim();
    if (text.length === 0) return { error: `${label} cannot be empty.` };
    if (text.length < min || text.length > max) {
      return { error: `${label} must have ${min} to ${max} characters.` };
    }
    value[key] = text;
  }
  const status = body.status;
  if (status === undefined || status === null) return { error: "Status is required." };
  if (typeof status !== "string") return { error: "Status must be text." };
  const cleanStatus = status.trim();
  if (!STATUSES.includes(cleanStatus)) {
    return { error: "Status must be Pending, In progress or Completed." };
  }
  value.status = cleanStatus;
  return { value };
}

function badId(res) {
  return res.status(400).json({ message: "Id must be a positive whole number." });
}
function notFound(res) {
  return res.status(404).json({ message: "Record not found." });
}

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNS} FROM records ORDER BY id`);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return badId(res);
    const result = await pool.query(`SELECT ${COLUMNS} FROM records WHERE id = $1`, [id]);
    if (result.rows.length === 0) return notFound(res);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { error, value } = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    const result = await pool.query(
      "INSERT INTO records (title, category, description, status) " +
        `VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [value.title, value.category, value.description, value.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return badId(res);
    const { error, value } = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    const result = await pool.query(
      "UPDATE records SET title = $1, category = $2, description = $3, status = $4 " +
        `WHERE id = $5 RETURNING ${COLUMNS}`,
      [value.title, value.category, value.description, value.status, id]
    );
    if (result.rows.length === 0) return notFound(res);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return badId(res);
    const result = await pool.query("DELETE FROM records WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return notFound(res);
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
