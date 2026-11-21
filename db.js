// Database layer. PostgreSQL when DATABASE_URL is set (persistent, e.g. Render),
// otherwise a local SQLite file. Queries are written with $1, $2 placeholders for both.
const fs = require("fs");
const path = require("path");

const usePostgres = Boolean(process.env.DATABASE_URL);
let pool;

if (usePostgres) {
  const { Pool } = require("pg");
  const needsSsl = !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) &&
    process.env.DATABASE_SSL !== "false";
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
  });
} else {
  const { DatabaseSync } = require("node:sqlite");
  const file = process.env.SQLITE_FILE || path.join(__dirname, "records.db");
  const sqlite = new DatabaseSync(file);
  pool = {
    async query(sql, params = []) {
      // Convert $1 -> ?1 so SQLite understands the same placeholders.
      const text = sql.replace(/\$(\d+)/g, "?$1");
      const stmt = sqlite.prepare(text);
      if (/^\s*(select|with)/i.test(text) || /\breturning\b/i.test(text)) {
        const rows = stmt.all(...params).map((row) => ({ ...row }));
        return { rows, rowCount: rows.length };
      }
      const info = stmt.run(...params);
      return { rows: [], rowCount: Number(info.changes) };
    },
    exec: (sql) => sqlite.exec(sql),
  };
}

// Create the table and insert the seed records once.
async function init() {
  const schemaFile = usePostgres ? "schema.sql" : "schema.sqlite.sql";
  const schema = fs.readFileSync(path.join(__dirname, schemaFile), "utf8");
  if (usePostgres) await pool.query(schema);
  else pool.exec(schema);

  const count = await pool.query("SELECT COUNT(*) AS n FROM records");
  if (Number(count.rows[0].n) === 0) {
    const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
    if (usePostgres) await pool.query(seed);
    else pool.exec(seed);
    console.log("Seed records inserted.");
  }
}

module.exports = pool;
module.exports.init = init;
module.exports.usePostgres = usePostgres;
