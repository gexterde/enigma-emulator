async function run() {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'exterde@gmail.com', password: 'EnigmaAdmin123!' })
  });
  console.log('Login:', res.status);
  const cookie = res.headers.get('set-cookie');
  console.log('Cookie:', cookie);
  
  const res2 = await fetch('http://localhost:3000/api/auth/admin/users', {
    headers: { 'Cookie': cookie.split(';')[0] }
  });
  console.log('Admin Users:', res2.status);
  console.log(await res2.json());
}
run();
