import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Lead } from '../src/models/Lead.js';
import { Customer } from '../src/models/Customer.js';
import { User } from '../src/models/User.js';
import { convertLeadToCustomer } from '../src/services/customer.service.js';

dotenv.config();

async function syncLeadsToCustomers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thinkcrm';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const adminUser = await User.findOne({ role: { $in: ['Owner', 'Admin'] } });
    if (!adminUser) {
      throw new Error('No Admin/Owner user found for performing conversion.');
    }
    console.log(`Using admin user: ${adminUser.email} (${adminUser._id})`);

    const initialCustomersCount = await Customer.countDocuments({ deletedAt: null });
    console.log(`Initial total active customers: ${initialCustomersCount}`);

    // Query leads with status: 'won', 'qualified', or 'converted'
    const targetLeads = await Lead.find({
      status: { $in: ['won', 'qualified', 'converted'] },
      isDeleted: { $ne: true }
    }).sort({ createdAt: 1 });

    console.log(`Found ${targetLeads.length} leads with status 'won', 'qualified', or 'converted' to sync.`);

    let convertedCount = 0;
    let linkedCount = 0;
    let errorCount = 0;

    for (const lead of targetLeads) {
      try {
        const hadCustomerBefore = Boolean(lead.customerId);
        const customer = await convertLeadToCustomer(lead._id, adminUser._id);
        if (hadCustomerBefore) {
          linkedCount++;
        } else {
          convertedCount++;
        }
      } catch (err) {
        console.error(`Failed to convert lead ${lead.fullName} (${lead.leadId}):`, err.message);
        errorCount++;
      }
    }

    const finalCustomersCount = await Customer.countDocuments({ deletedAt: null });
    console.log('\n--- Sync Summary ---');
    console.log(`New customers created: ${convertedCount}`);
    console.log(`Existing customers linked: ${linkedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Final total active customers in Customer tab: ${finalCustomersCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}

syncLeadsToCustomers();
