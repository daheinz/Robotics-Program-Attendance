const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
require('dotenv').config();

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seeding...');
    
    // Create some sample users
    const users = [
      {
        id: uuidv4(),
        firstName: 'John',
        lastName: 'Doe',
        alias: 'jdoe',
        role: 'student',
        pin: '1234',
      },
      {
        id: uuidv4(),
        firstName: 'Jane',
        lastName: 'Smith',
        alias: 'jsmith',
        role: 'student',
        pin: '5678',
      },
      {
        id: uuidv4(),
        firstName: 'Bob',
        lastName: 'Johnson',
        alias: 'bjohnson',
        role: 'mentor',
        pin: '9999',
      },
      {
        id: uuidv4(),
        firstName: 'Alice',
        lastName: 'Williams',
        alias: 'awilliams',
        role: 'coach',
        pin: '0000',
      },
    ];

    // Insert users
    for (const user of users) {
      const pinHash = await bcrypt.hash(user.pin, 10);
      await client.query(`
        INSERT INTO users (id, first_name, last_name, alias, role, pin_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [user.id, user.firstName, user.lastName, user.alias, user.role, pinHash]);
      console.log(`✓ Created user: ${user.alias} (${user.role})`);
    }

    // Add parent contacts for students
    const studentUsers = users.filter(u => u.role === 'student');
    for (const student of studentUsers) {
      await client.query(`
        INSERT INTO parent_contacts (id, user_id, name, phone_number, relationship)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        uuidv4(),
        student.id,
        `${student.firstName}'s Parent`,
        '555-1234',
        'Parent',
      ]);
      console.log(`✓ Added parent contact for ${student.alias}`);
    }

    console.log('\n✅ Database seeding complete!');
    console.log('\nSample login credentials:');
    console.log('Student: jdoe / PIN: 1234');
    console.log('Student: jsmith / PIN: 5678');
    console.log('Mentor: bjohnson / PIN: 9999');
    console.log('Coach: awilliams / PIN: 0000');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
