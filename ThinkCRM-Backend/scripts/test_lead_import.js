import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Lead } from '../src/models/Lead.js';
import { Customer } from '../src/models/Customer.js';
import { User } from '../src/models/User.js';
import { importLeads } from '../src/services/lead.service.js';

async function runTest() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thinkcrm';
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    const adminUser = await User.findOne({ role: { $in: ['Owner', 'Admin'] } });
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    // Pre-cleanup
    await Lead.deleteMany({ phone: { $in: ['+91 91234 56789', '+91 91234 56790', '+91 99999 11111', '+91 98888 77777'] } });
    await Customer.deleteMany({ phone: '+91 98888 77777' });

    console.log('\n--- 1. Testing Valid Lead Import ---');
    const validLeads = [
      {
        fullName: 'Test Import Lead 1',
        phone: '+91 91234 56789',
        email: 'test.import1@example.com',
        projectType: 'Modular Kitchen',
        leadSource: 'Website',
        status: 'new',
        budget: 450000,
        city: 'Mumbai',
        location: 'Andheri West',
        notes: 'Imported test lead'
      },
      {
        fullName: 'Test Import Lead 2',
        phone: '+91 91234 56790',
        email: 'test.import2@example.com',
        projectType: 'Wardrobe Design',
        leadSource: 'Instagram',
        status: 'contacted',
        budget: 250000,
        city: 'Pune',
        location: 'Kothrud',
        notes: 'Looking for 3 sliding door wardrobes'
      }
    ];

    const res1 = await importLeads(validLeads, adminUser._id);
    console.log('Import Result 1:', res1);
    if (res1.imported !== 2) throw new Error(`Expected 2 imported, got ${res1.imported}`);

    console.log('\n--- 2. Testing Duplicate Detection & Validation Errors ---');
    const duplicateAndInvalidLeads = [
      {
        fullName: 'Test Duplicate Lead',
        phone: '+91 91234 56789', // Existing phone from test 1
        email: 'different@example.com',
        projectType: 'Living Room',
      },
      {
        fullName: '', // Missing name
        phone: '+91 98765 00001',
      },
      {
        fullName: 'Missing Phone Lead',
        phone: '', // Missing phone
      },
      {
        fullName: 'In-File Dup 1',
        phone: '+91 99999 11111',
      },
      {
        fullName: 'In-File Dup 2',
        phone: '+91 99999 11111', // Same phone in same batch
      }
    ];

    const res2 = await importLeads(duplicateAndInvalidLeads, adminUser._id);
    console.log('Import Result 2:', res2);
    // 1 imported (In-File Dup 1), 2 skipped (1 db dup, 1 in-file dup), 2 failed (missing name, missing phone)
    console.log(`Imported: ${res2.imported}, Skipped: ${res2.skipped}, Failed: ${res2.failed}, Errors count: ${res2.errors.length}`);
    if (res2.imported !== 1 || res2.skipped !== 2 || res2.failed !== 2) {
      throw new Error(`Unexpected counts in result 2: ${JSON.stringify(res2)}`);
    }

    console.log('\n--- 3. Testing Customer Linkage on Import ---');
    // Create a customer with a specific phone
    const testCustPhone = '+91 98888 77777';
    let customer = await Customer.create({
      fullName: 'Customer For Lead Link',
      phone: testCustPhone,
      email: 'link.test@example.com',
      status: 'active',
      city: 'Delhi'
    });

    const leadForExistingCustomer = [
      {
        fullName: 'Customer For Lead Link (New Lead)',
        phone: testCustPhone,
        email: 'link.test@example.com',
        projectType: 'Office Interior',
        requirement: 'Office space renovation'
      }
    ];

    const res3 = await importLeads(leadForExistingCustomer, adminUser._id);
    console.log('Import Result 3:', res3);
    const createdLead = await Lead.findOne({ phone: testCustPhone });
    console.log('Created Lead customerId:', createdLead?.customerId, 'Expected:', customer._id);
    if (!createdLead || String(createdLead.customerId) !== String(customer._id)) {
      throw new Error('Lead was not linked to existing customer!');
    }

    // Check customer.leads array
    const updatedCust = await Customer.findById(customer._id);
    console.log('Customer leads array contains leadId:', updatedCust.leads.some(l => String(l) === String(createdLead._id)));
    if (!updatedCust.leads.some(l => String(l) === String(createdLead._id))) {
      throw new Error('Customer leads array missing new lead!');
    }

    console.log('\n--- 4. Cleaning Up Test Data ---');
    await Lead.deleteMany({ phone: { $in: ['+91 91234 56789', '+91 91234 56790', '+91 99999 11111', testCustPhone] } });
    await Customer.deleteMany({ _id: customer._id });
    console.log('Cleaned up test records');

    console.log('\nALL BACKEND LEAD IMPORT TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runTest();
