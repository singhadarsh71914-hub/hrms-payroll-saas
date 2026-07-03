import http from 'http';
import app from './src/index.ts';

const server = http.createServer(app);
server.listen(3335, async () => {
    console.log('Server started on 3335');
    try {
        console.log('--- TESTING VALIDATION ---');
        // Test invalid login
        let req = await fetch('http://localhost:3335/api/auth/login', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'not-an-email', password: '' })
        });
        console.log('LOGIN STATUS:', req.status);
        console.log('LOGIN BODY:', await req.text());

        // Test invalid leave
        req = await fetch('http://localhost:3335/api/self-service/leaves', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake-token' },
            body: JSON.stringify({ leaveType: 'NOT_A_TYPE' }) // missing dates
        });
        console.log('LEAVE STATUS:', req.status);
        console.log('LEAVE BODY:', await req.text());
        
    } catch (e) {
        console.error(e);
    } finally {
        server.close();
        process.exit(0);
    }
});
