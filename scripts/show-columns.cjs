const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main(){
  const dbUrl = process.env.DATABASE_URL;
  if(!dbUrl){
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  // parse mysql url
  const url = new URL(dbUrl.trim());
  const user = url.username || 'root';
  const password = url.password || '';
  const host = url.hostname;
  const port = url.port || 3306;
  const database = url.pathname.replace(/^\//, '');

  const conn = await mysql.createConnection({ host, port, user, password, database });
  const [rows] = await conn.execute('SHOW COLUMNS FROM users');
  console.log(rows);
  await conn.end();
}

main().catch(err=>{console.error(err); process.exit(1);});
