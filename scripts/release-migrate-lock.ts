import "dotenv/config";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  const selfPid = (await client.query<{ pid: number }>("SELECT pg_backend_pid() AS pid"))
    .rows[0].pid;

  const { rows } = await client.query<{
    pid: number;
    objid: number;
    state: string;
    query: string;
  }>(`
    SELECT l.pid, l.objid, a.state, left(a.query, 80) AS query
    FROM pg_locks l
    JOIN pg_stat_activity a ON l.pid = a.pid
    WHERE l.locktype = 'advisory' AND l.pid <> $1
  `, [selfPid]);

  console.log("advisory locks (excluding self):", rows);

  for (const row of rows) {
    await client.query("SELECT pg_terminate_backend($1)", [row.pid]);
    console.log("terminated", row.pid);
  }
}

main()
  .then(() => client.end())
  .catch(async (error) => {
    console.error(error);
    await client.end();
    process.exit(1);
  });
