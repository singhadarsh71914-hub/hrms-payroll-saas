const axios = require('axios');

async function testRegistration() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/register', {
      companyName: 'Test Corp',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@testcorp.com',
      password: 'password123'
    });
    console.log(res.data);
  } catch (err) {
    if (err.response) {
      console.log('HTTP Status:', err.response.status);
      console.log('Response Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Error:', err.message);
    }
  }
}

testRegistration();
