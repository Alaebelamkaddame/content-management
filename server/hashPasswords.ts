import bcrypt from 'bcryptjs';

const users = [
  { username: 'admin1', password: 'admin123' },
  { username: 'lead1', password: 'lead123' },
  { username: 'member1', password: 'member123' },
];

async function hashPasswords() {
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`${user.username}: ${hash}`);
  }
}

hashPasswords();
