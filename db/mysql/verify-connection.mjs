/** Read-only MySQL staging readiness check; never prints credentials. */
const required=['person','user_account','sps_batch','role_assignment','enrollment','learning_session','attendance','auth_session','zoom_evidence_inbox','zoom_webhook_receipt'];
for (const key of ['DB_HOST','DB_NAME','DB_USER','DB_PASSWORD']) {
  if (!process.env[key]) { console.error('BLOCKED: missing '+key); process.exit(2); }
}
let conn;
try {
  const {default:mysql}=await import('mysql2/promise');
  conn=await mysql.createConnection({
    host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),
    user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,
    connectTimeout:10000,dateStrings:true,timezone:'Z',ssl:process.env.DB_SSL==='true'?{}:undefined
  });
  const [[v]]=await conn.query('SELECT VERSION() AS version');
  const [rows]=await conn.query('SHOW TABLES');
  const found=new Set(rows.map(x=>Object.values(x)[0]));
  const missing=required.filter(x=>!found.has(x));
  console.log(JSON.stringify({mysqlConnected:true,version:v.version,tablesPresent:found.size,requiredMissing:missing}));
  if (missing.length) process.exitCode=1;
} catch(err) {
  console.error('FAIL: MySQL connection/schema check failed ('+(err.code||'UNKNOWN')+')');
  process.exitCode=1;
} finally { if(conn) await conn.end(); }
