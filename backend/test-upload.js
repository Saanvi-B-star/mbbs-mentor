const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found in DB to test with.');
      process.exit(1);
    }
    
    console.log(`Testing with user ${user.id}`);
    
    // Create token
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET || 'dev_jwt_secret_change_me_2025_ABCDEFGHIJKLMNOPQRSTUVWXYZ', 
      { expiresIn: '1h' }
    );
    
    const form = new FormData();
    form.append('file', Buffer.from('test pdf content'), {filename: 'test.pdf'});
    form.append('title', 'Test Note');
    
    const response = await fetch('http://localhost:5000/api/v1/notes/upload', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    fs.writeFileSync('error.json', JSON.stringify(data, null, 2));
    console.log('Saved error payload to error.json');
    
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpload();
