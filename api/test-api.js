const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('REGISTER:', res.statusCode, data));
});

req.on('error', console.error);
req.write(JSON.stringify({ username: 'fake_user_test1', email: 'fake_test1@example.com', password: 'password123'}));
req.end();

setTimeout(() => {
  const req2 = http.request({
    ...options,
    path: '/api/auth/request-otp'
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('OTP REQUEST:', res.statusCode, data));
  });
  req2.on('error', console.error);
  req2.write(JSON.stringify({ email: 'fake_test1@example.com' }));
  req2.end();
}, 1000);
