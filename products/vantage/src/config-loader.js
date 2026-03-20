const fs = require('fs');
const path = require('path');

const USERS_DIR = path.join(__dirname, '..', 'configs', 'users');

function loadUsers() {
  if (!fs.existsSync(USERS_DIR)) return [];
  const files = fs.readdirSync(USERS_DIR).filter((f) => f.endsWith('.json'));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(USERS_DIR, f), 'utf8')));
}

module.exports = { loadUsers };
