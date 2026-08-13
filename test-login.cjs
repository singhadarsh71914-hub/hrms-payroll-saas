const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'jane.smith@supercorp.com',
      password: 'password123'
    });
    console.log(Object.keys(res.data));
    console.log('Token received:', !!res.data.accessToken);
    console.log('Login successful');
  } catch (err) {
    if (err.response) {
      console.log('HTTP Status:', err.response.status);
      console.log('Response Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Error:', err.message);
    }
  }
}

testLogin();
