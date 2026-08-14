const fs = require('fs');
const file = 'data/users/c424adf7-d139-40b2-9ae3-96a9c7ce4012.json';
const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
data.callSign = 'ADMIN';
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('updated admin user');
