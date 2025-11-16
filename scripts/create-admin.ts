#!/usr/bin/env bun
/**
 * Create a test admin user with Better Auth
 * This properly creates a user with hashed password
 */

async function createAdminUser() {
  console.log('Creating admin user with Better Auth...');
  
  const email = 'admin@demo.com';
  const password = 'admin123'; // Change this to whatever you want
  const name = 'Admin User';
  
  try {
    // This uses Better Auth's internal methods to create a user properly
    const result = await fetch('http://localhost:3000/api/auth/sign-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });
    
    const data = await result.json();
    
    if (result.ok) {
      console.log('✅ Admin user created successfully!');
      console.log(`\nLogin credentials:`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`\nVisit: http://localhost:3000/login`);
    } else {
      console.error('❌ Failed to create user:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAdminUser();
