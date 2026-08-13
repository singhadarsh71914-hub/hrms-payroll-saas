import axios from 'axios';

async function test() {
  try {
    // login
    const res1 = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@e2e.com',
      password: 'password123'
    });
    const cookie = res1.headers['set-cookie'];
    console.log("Login successful");
    
    // create rule
    const res2 = await axios.post('http://localhost:3000/api/compliance/rules', {
        state_code: 'GLOBAL',
        financial_year: 2026,
        rule_type: 'PT',
        configuration: { slabs: [] },
        effective_from: '2026-04-01T00:00:00Z',
        effective_to: '2027-03-31T23:59:59Z'
    }, {
      headers: {
        Cookie: cookie
      }
    });
    console.log("Create successful", res2.data);
  } catch(e) {
    console.error(e.response?.data || e.message);
  }
}

test();
