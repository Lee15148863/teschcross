const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.DBCon, { dbName: 'techcross' });
  const User = require('./models/inv/User');
  const u = await User.findOne({ username: 'Lee087' }).lean();
  if (!u) { console.log('Lee087 NOT FOUND'); return; }
  console.log('Found:', u.username, 'role:', u.role);

  const tests = ['Lee087_admin_2026', 'O87o9o8555HL', 'admin123', 'root123'];
  for (const pw of tests) {
    const match = await bcrypt.compare(pw, u.password);
    console.log('  Password "' + pw + '":', match ? 'MATCH' : 'no');
  }
  await mongoose.disconnect();
})();
