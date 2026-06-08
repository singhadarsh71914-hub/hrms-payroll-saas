import http from 'http';
import app from './src/index.ts';

const server = http.createServer(app);
server.listen(3335, async () => {
    console.log('Server started on 3335');
    try {
        const req = await fetch('http://localhost:3335/api/employees/123/restore', { method: 'POST' });
        console.log('STATUS:', req.status);
        console.log('BODY:', await req.text());
    } catch (e) {
        console.error(e);
    } finally {
        server.close();
        process.exit(0);
    }
});
