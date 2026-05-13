/**
 * Backfill Deployment.storeId from Store records.
 *
 * Matches deployments to stores by storeName (case-insensitive).
 * Dry-run mode by default: --apply to write.
 *
 * Usage:
 *   node scripts/backfill-deployment-store-id.js          # dry-run
 *   node scripts/backfill-deployment-store-id.js --apply   # write
 */
const mongoose = require('mongoose');

async function main() {
  const apply = process.argv.includes('--apply');
  const dbCon = process.env.DBCon || process.env.MONGO_URI;
  if (!dbCon) {
    console.error('FATAL: DBCon or MONGO_URI env var required');
    process.exit(1);
  }

  await mongoose.connect(dbCon);
  console.log('Connected to MongoDB');

  const Deployment = mongoose.model('SaaDeployment', new mongoose.Schema({}, { strict: false, collection: 'saadeployments' }));
  const Store = mongoose.model('SaaStore', new mongoose.Schema({}, { strict: false, collection: 'saastores' }));

  const deps = await Deployment.find({ storeId: { $exists: false } }).lean();
  console.log('Deployments missing storeId:', deps.length);

  if (deps.length === 0) {
    console.log('Nothing to backfill.');
    await mongoose.disconnect();
    return;
  }

  const stores = await Store.find({}).lean();
  const storeByName = {};
  for (const s of stores) {
    storeByName[s.name.toLowerCase()] = s._id;
  }

  let matched = 0;
  let skipped = 0;

  for (const dep of deps) {
    const key = (dep.storeName || '').toLowerCase();
    const storeId = storeByName[key];
    if (!storeId) {
      console.log('  SKIP: no store match for "' + dep.storeName + '" (id=' + dep._id + ')');
      skipped++;
      continue;
    }

    if (apply) {
      await Deployment.updateOne({ _id: dep._id }, { $set: { storeId: storeId } });
      console.log('  SET:   "' + dep.storeName + '" -> storeId=' + storeId);
    } else {
      console.log('  WOULD: "' + dep.storeName + '" -> storeId=' + storeId);
    }
    matched++;
  }

  console.log('');
  console.log('Summary:');
  console.log('  Total missing storeId: ' + deps.length);
  console.log('  Matched:              ' + matched);
  console.log('  Skipped (no store):   ' + skipped);
  console.log('  Mode:                 ' + (apply ? 'APPLIED' : 'DRY-RUN'));

  if (!apply) {
    console.log('');
    console.log('Run with --apply to write changes.');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
