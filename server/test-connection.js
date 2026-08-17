const config = require('./config');
const pool   = require('./db');

(async () => {
  try {
    const [ver] = await pool.query('SELECT VERSION() AS v');
    console.log('✅ Холбогдлоо — MySQL', ver[0].v);
    console.log(`   Хэрэглэгч: ${config.DB.user}  ·  Сан: ${config.DB.name}`);

    const [grants] = await pool.query('SHOW GRANTS FOR CURRENT_USER()');
    const line = grants.map(r => Object.values(r)[0]).join(' ');
    if (/ALL PRIVILEGES ON \*\.\*/.test(line)) {
      console.log('   ⚠️  Энэ хэрэглэгч бүх эрхтэй байна. db/06_app_user.sql-ийг үзнэ үү.');
    }

    const tables = ['students', 'organizations', 'internship_positions', 'internship_requests'];
    for (const t of tables) {
      const [rows] = await pool.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
      console.log(`   ${t.padEnd(22)} ${rows[0].n} мөр`);
    }

    const [stats] = await pool.query(`
      SELECT o.name, v.title, v.capacity, v.remaining_slots
      FROM v_position_stats v
      JOIN organizations o ON o.organization_id = v.organization_id
      ORDER BY o.name LIMIT 5
    `);
    console.log('\n   Сул орон тоо (эхний 5):');
    console.table(stats);

  } catch (err) {
    console.error('❌ Алдаа:', err.code || '', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → .env доторх DB_USER / DB_PASSWORD-оо шалгана уу.');
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('   → 01_schema.sql-ийг Workbench дээр эхлээд ажиллуулна уу.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('   → MySQL сервер асаагүй байна.');
    }
  } finally {
    await pool.end();
  }
})();