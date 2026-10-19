import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thinkcrm');
  const db = mongoose.connection.db;

  const totalLeads = await db.collection('leads').countDocuments();
  const totalCustomers = await db.collection('customers').countDocuments();
  console.log('Total Leads in DB:', totalLeads);
  console.log('Total Customers in DB:', totalCustomers);

  const actTypes = await db.collection('activities').aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]).toArray();
  console.log('Activity types:', actTypes);
  const sample = await db.collection('leads').find().limit(5).toArray();
  console.log('Sample leads:', sample.map(s => ({
    fullName: s.fullName,
    phone: s.phone,
    email: s.email,
    status: s.status,
    createdAt: s.createdAt,
    leadSource: s.leadSource
  })));

  process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
