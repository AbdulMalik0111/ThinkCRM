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
      }
    ];

    await User.insertMany(users);
    console.log('Seed completed successfully. Users created:');
    users.forEach(u => console.log(`- ${u.email} (Role: ${u.role}) - Password: password123`));

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
