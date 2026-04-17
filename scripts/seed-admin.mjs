/**
 * Create the first admin user.
 * Usage: node scripts/seed-admin.mjs <email> <password>
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually (no dotenv dependency)
try {
  const env = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  for (const line of env.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
} catch {
  // .env not found — rely on existing environment variables
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/seed-admin.mjs <email> <password>');
  process.exit(1);
}

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/artist-website';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
});

const User = mongoose.models.User ?? mongoose.model('User', UserSchema);

try {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`User ${email} already exists. Updating password...`);
    existing.password = await bcrypt.hash(password, 12);
    await existing.save();
    console.log('Password updated.');
  } else {
    const hashed = await bcrypt.hash(password, 12);
    await User.create({ email: email.toLowerCase(), password: hashed });
    console.log(`Admin user created: ${email}`);
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await mongoose.disconnect();
}
