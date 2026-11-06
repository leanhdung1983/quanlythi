import { query } from '../api/core.js';

const columnsToAdd = [
  { name: 'phone', type: 'VARCHAR(20)' },
  { name: 'parent_phone', type: 'VARCHAR(20)' },
  { name: 'date_of_birth', type: 'DATE' },
  { name: 'gender', type: 'VARCHAR(10)' },
  { name: 'class_name', type: 'VARCHAR(50)' },
  { name: 'student_code', type: 'VARCHAR(50)' },
  { name: 'address', type: 'VARCHAR(255)' },
  { name: 'reset_password_otp', type: 'VARCHAR(255)' },
  { name: 'reset_password_expires', type: 'DATETIME' }
];

async function migrate() {
  try {
    const existingCols = (await query('DESCRIBE users')).map(c => c.Field);
    console.log('Existing columns:', existingCols);
    for (const col of columnsToAdd) {
      if (!existingCols.includes(col.name)) {
        console.log('Adding column:', col.name);
        await query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log('✅ Added', col.name);
      } else {
        console.log('Column already exists:', col.name);
      }
    }
    const finalCols = (await query('DESCRIBE users')).map(c => c.Field);
    console.log('Final columns:', finalCols);
  } catch (e) {
    console.error('Migration error:', e.message);
  }
  process.exit(0);
}
migrate();
