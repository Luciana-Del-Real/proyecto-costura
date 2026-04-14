const { Client } = require('pg');

(async () => {
  const client = new Client({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'postgres',
    password: process.env.PG_PASSWORD || '1234',
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  });

  try {
    await client.connect();
    const dbName = 'costura_app';
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database ${dbName} created`);
    } else {
      console.log(`ℹ️ Database ${dbName} already exists`);
    }
  } catch (err) {
    console.error('❌ Error creating DB:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
