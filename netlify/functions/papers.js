const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const page = parseInt(params.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const filters = [];
  const values = [];
  let i = 1;

  if (params.year_from) { filters.push(`year >= $${i++}`); values.push(parseInt(params.year_from)); }
  if (params.year_to)   { filters.push(`year <= $${i++}`); values.push(parseInt(params.year_to)); }
  if (params.institution) { filters.push(`institution = $${i++}`); values.push(params.institution); }
  if (params.first_author_gender) { filters.push(`first_author_gender = $${i++}`); values.push(params.first_author_gender); }
  if (params.last_author_gender)  { filters.push(`last_author_gender = $${i++}`);  values.push(params.last_author_gender); }
  if (params.combo)  { filters.push(`combo = $${i++}`);  values.push(params.combo); }
  if (params.search) { filters.push(`title ILIKE $${i++}`); values.push(`%${params.search}%`); }

  const where = filters.length ? "WHERE " + filters.join(" AND ") : "";

  try {
    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT doi, title, year, journal, cited_by_count, cite_pct,
                first_author_name, last_author_name, author_count,
                open_access, institution, first_author_gender,
                last_author_gender, combo
         FROM papers ${where}
         ORDER BY year DESC, cited_by_count DESC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...values, limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM papers ${where}`, values),
    ]);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        papers: rows.rows,
        total: parseInt(count.rows[0].count),
        page,
        pages: Math.ceil(parseInt(count.rows[0].count) / limit),
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
