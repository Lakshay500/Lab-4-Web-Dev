require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function main() {
  const email = process.argv[2];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: npm run promote-admin -- account@example.com');
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required in .env');
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { $set: { role: 'admin' } },
    { new: true, runValidators: true }
  ).select('username email role');
  if (!user) throw new Error(`No account exists for ${email}. Sign up normally before promoting it.`);
  console.log(`Administrator role granted to ${user.email}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
