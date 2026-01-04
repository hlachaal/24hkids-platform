import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '123456789',
  database: 'postgres' // connect to default database
});

async function createDatabase() {
  try {
    await client.connect();
    await client.query('CREATE DATABASE "24hkids_platform"');
    console.log('Database created');
  } catch (err) {
    console.log('Database may already exist:', err.message);
  } finally {
    await client.end();
  }
}

createDatabase();