import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { User } from '../src/models/User.js';

dotenv.config();

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Clearing existing users...');
    await User.deleteMany({});

    console.log('Seeding initial roles and users...');
    
    // Development-only credentials as per the requirement
    const passwordHash = await bcrypt.hash('password123', 12);

    const users = [
      {
        firstName: 'System',
        lastName: 'Owner',
        email: 'owner@thinkcrm.local', // dev credential
        passwordHash,
        role: 'Owner',
        status: 'active',
        permissions: ['all'],
      },
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@thinkcrm.local', // dev credential
        passwordHash,
        role: 'Admin',
        status: 'active',
        permissions: ['all'],
      },
      {
        firstName: 'Sales',
        lastName: 'Manager',
        email: 'manager@thinkcrm.local', // dev credential
        passwordHash,
        role: 'Sales Manager',
        status: 'active',
        permissions: ['leads.view', 'leads.create', 'leads.update', 'leads.assign', 'measurements.view', 'measurements.create', 'quotations.view', 'quotations.create', 'quotations.send', 'reports.view'],
      },
      {
        firstName: 'Sales',
        lastName: 'Executive',
        email: 'executive@thinkcrm.local', // dev credential
        passwordHash,
        role: 'Sales Executive',
        status: 'active',
        permissions: ['leads.view', 'leads.update', 'measurements.view', 'quotations.view'],
      },
      {
        firstName: 'Support',
        lastName: 'Staff',
        email: 'staff@thinkcrm.local', // dev credential
        passwordHash,
        role: 'Staff',
        status: 'active',
        permissions: ['leads.view'],
      },
      {
        firstName: 'Think',
        lastName: 'Admin',
        email: 'thinkcrm@gmail.com', // Frontend default
        passwordHash: await bcrypt.hash('thinkcrm', 12),
        role: 'Owner',
        status: 'active',
        permissions: ['all'],
      }
    ];

    const insertedUsers = await User.insertMany(users);
    console.log('Seed completed successfully. Users created:');
    users.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));

    // Create dummy leads
    console.log('Creating dummy leads...');
    const { Lead } = await import('../src/models/Lead.js');
    await Lead.deleteMany({});
    const dummyLeads = [
      {
        fullName: 'Alice Johnson',
        phone: '1234567890',
        email: 'alice@example.com',
        projectType: 'Kitchen',
        budget: 50000,
        status: 'new',
        leadSource: 'Website',
        assignedTo: insertedUsers[0]._id, // Assigned to thinkcrm@gmail.com
      },
      {
        fullName: 'Bob Smith',
        phone: '0987654321',
        email: 'bob@example.com',
        projectType: 'Wardrobe',
        budget: 15000,
        status: 'contacted',
        leadSource: 'Meta',
        assignedTo: insertedUsers[0]._id,
      },
      {
        fullName: 'Charlie Davis',
        phone: '1112223333',
        projectType: 'Full Home',
        budget: 120000,
        status: 'won',
        leadSource: 'Referral',
        assignedTo: insertedUsers[0]._id,
      }
    ];
    
    const insertedLeads = [];
    for (const data of dummyLeads) {
      const lead = new Lead(data);
      await lead.save();
      insertedLeads.push(lead);
    }
    console.log(`Created ${insertedLeads.length} dummy leads.`);

    // Create dummy customers from the 'won' lead
    console.log('Creating dummy customers...');
    const { Customer } = await import('../src/models/Customer.js');
    await Customer.deleteMany({});
    
    const dummyCustomers = [
      {
        fullName: 'Charlie Davis',
        phone: '1112223333',
        sourceLeadId: insertedLeads[2]._id, // The 'won' lead
      }
    ];
    
    const insertedCustomers = [];
    for (const data of dummyCustomers) {
      const customer = new Customer(data);
      await customer.save();
      insertedCustomers.push(customer);
    }
    console.log(`Created ${insertedCustomers.length} dummy customers.`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
