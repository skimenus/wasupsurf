// db.js
require('dotenv').config();

// Принудительно выбирать IPv4 (Node ≥17.3)
const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => console.log('Connected to Supabase Postgres'))
  .catch(err => console.error('Postgres connection error', err));

module.exports = client;
