import pg from 'pg';
import jwt from 'jsonwebtoken';
import http from 'http';
import fs from 'fs';

const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });

async function runTest() {
  await client.connect();

  const res = await client.query(`
    SELECT u.id, u.email, u.role, u.company_id, e.id as employee_id 
    FROM "User" u 
    LEFT JOIN "Employee" e ON u.id = e.user_id 
    WHERE u.role = 'ADMIN' 
    LIMIT 1
  `);
  
  if (res.rows.length === 0) {
    console.error("No admin user found in DB.");
    process.exit(1);
  }
  const admin = res.rows[0];

  const empRes = await client.query(`
    SELECT id FROM "Employee" WHERE company_id = $1 LIMIT 1
  `, [admin.company_id]);
  const validEmpId = empRes.rows[0].id;

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role, company_id: admin.company_id, employee_id: admin.employee_id },
    'your_super_secret_jwt_key_change_this_in_production',
    { expiresIn: '1h' }
  );

  async function req(method, path, boundary, fields, sendFile) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api${path}`,
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        }
      };
      const request = http.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve({ status: response.statusCode, data }));
      });
      request.on('error', (err) => resolve({ status: 500, data: err.message }));
      
      let body = '';
      for (const [key, value] of Object.entries(fields)) {
        body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
      }
      if (sendFile) {
        body += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\nFake PDF Content\r\n`;
      }
      body += `--${boundary}--\r\n`;
      request.write(body);
      request.end();
    });
  }

  const boundary = '----WebKitFormBoundaryTEST';

  console.log("A. Valid Upload");
  const resA = await req('POST', '/documents', boundary, {
    employee_id: validEmpId, document_type: 'ID_PROOF', document_name: 'Test Doc A'
  }, true);
  console.log(`STATUS: ${resA.status} RESULT: ${resA.data.substring(0, 100)}`);

  console.log("\nB. Missing employee_id");
  const resB = await req('POST', '/documents', boundary, {
    document_type: 'ID_PROOF', document_name: 'Test Doc B'
  }, true);
  console.log(`STATUS: ${resB.status} RESULT: ${resB.data.substring(0, 100)}`);

  console.log("\nC. Missing file");
  const resC = await req('POST', '/documents', boundary, {
    employee_id: validEmpId, document_type: 'ID_PROOF', document_name: 'Test Doc C'
  }, false);
  console.log(`STATUS: ${resC.status} RESULT: ${resC.data.substring(0, 100)}`);

  console.log("\nD. Invalid employee_id");
  const resD = await req('POST', '/documents', boundary, {
    employee_id: '12345678-1234-1234-1234-123456789012', document_type: 'ID_PROOF', document_name: 'Test Doc D'
  }, true);
  console.log(`STATUS: ${resD.status} RESULT: ${resD.data.substring(0, 100)}`);

  console.log("\nE. Invalid document_type");
  const resE = await req('POST', '/documents', boundary, {
    employee_id: validEmpId, document_type: 'AADHAAR', document_name: 'Test Doc E'
  }, true);
  console.log(`STATUS: ${resE.status} RESULT: ${resE.data.substring(0, 100)}`);

  console.log("\nF. Upload invalid EXE");
  const resF = await new Promise((resolve) => {
    const options = { hostname: 'localhost', port: 3000, path: `/api/documents`, method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` } };
    const request = http.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve({ status: response.statusCode, data }));
    });
    let body = `--${boundary}\r\nContent-Disposition: form-data; name="employee_id"\r\n\r\n${validEmpId}\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="document_type"\r\n\r\nID_PROOF\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="document_name"\r\n\r\nTest Doc F\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.exe"\r\nContent-Type: application/x-msdownload\r\n\r\nFake EXE Content\r\n`;
    body += `--${boundary}--\r\n`;
    request.write(body);
    request.end();
  });
  console.log(`STATUS: ${resF.status} RESULT: ${resF.data.substring(0, 100)}`);

  console.log("\nG. Upload oversized file (6MB)");
  const resG = await new Promise((resolve) => {
    const options = { hostname: 'localhost', port: 3000, path: `/api/documents`, method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` } };
    const request = http.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve({ status: response.statusCode, data }));
    });
    let body = `--${boundary}\r\nContent-Disposition: form-data; name="employee_id"\r\n\r\n${validEmpId}\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="document_type"\r\n\r\nID_PROOF\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="document_name"\r\n\r\nTest Doc G\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="large.pdf"\r\nContent-Type: application/pdf\r\n\r\n`;
    request.write(body);
    const largeChunk = Buffer.alloc(1024 * 1024, 'A'); // 1MB chunk
    for(let i = 0; i < 6; i++) {
        request.write(largeChunk);
    }
    request.write(`\r\n--${boundary}--\r\n`);
    request.end();
  });
  console.log(`STATUS: ${resG.status} RESULT: ${resG.data.substring(0, 100)}`);

  // Document workflow
  let docId = 'invalid';
  if (resA.status === 200 || resA.status === 201) docId = JSON.parse(resA.data).id;
  
  console.log("\n--- PHASE 5 — FULL DOCUMENT WORKFLOW ---");
  console.log(`1. Upload Document: ${resA.status}`);
  const resDl = await new Promise((resolve) => {
    http.get(`http://localhost:3000/api/documents/${docId}/download`, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
      resolve(res.statusCode);
    });
  });
  console.log(`2. Download Document: ${resDl}`);
  
  const resDel = await new Promise((resolve) => {
    const r = http.request({ hostname: 'localhost', port: 3000, path: `/api/documents/${docId}`, method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
      resolve(res.statusCode);
    });
    r.end();
  });
  console.log(`3. Delete Document: ${resDel}`);

  await client.end();
}

runTest();
