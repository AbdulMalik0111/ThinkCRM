import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../src/models/User.js';
import { Lead } from '../src/models/Lead.js';
import { generateTokens } from '../src/utils/token.js';

async function testEndpoint() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thinkcrm';
    await mongoose.connect(mongoUri);

    const adminUser = await User.findOne({ role: { $in: ['Owner', 'Admin'] } });
    if (!adminUser) throw new Error('Admin user not found');

    const { accessToken: token } = generateTokens(adminUser._id);

    const testLead = {
      fullName: 'API Import Test Lead',
      phone: '+91 97777 66666',
      email: 'api.import@example.com',
      projectType: 'Modular Kitchen',
      leadSource: 'Meta Ads',
      status: 'new',
      budget: '600000',
      city: 'Bangalore'
    };

    console.log('Testing POST /api/v1/leads/import ...');
    const res = await fetch('http://localhost:5050/api/v1/leads/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        leads: [testLead]
      })
    });

    const json = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Body:', json);

    if (!json.success || json.data.imported !== 1) {
      throw new Error('API Import did not return expected success response');
    }

    const createdInDb = await Lead.findOne({ phone: '+91 97777 66666' });
    console.log('Found created lead in DB:', createdInDb?.leadId, createdInDb?.fullName);
    if (!createdInDb) throw new Error('Lead not found in DB after API import');

    // Clean up
    await Lead.deleteOne({ _id: createdInDb._id });
    console.log('Cleaned up test record.');

    console.log('\nEND-TO-END API IMPORT TEST PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('API Test failed:', err);
    process.exit(1);
  }
}

testEndpoint();
