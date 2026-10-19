import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { User } from '../src/models/User.js';
import * as userService from '../src/services/user.service.js';
import app from '../src/app.js';
import request from 'supertest';
import { generateTokens } from '../src/utils/token.js';

dotenv.config();

const runTests = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thinkcrm');
    console.log('Connected.');

    // 1. Test generateTempPassword()
    console.log('\n--- 1. Testing generateTempPassword() ---');
    const pwd1 = userService.generateTempPassword();
    const pwd2 = userService.generateTempPassword();
    console.log('Sample 1:', pwd1);
    console.log('Sample 2:', pwd2);
    if (!pwd1.startsWith('Think#') || pwd1.length < 8) {
      throw new Error(`Invalid generated password: ${pwd1}`);
    }
    console.log('✔ generateTempPassword generated valid passwords.');

    // 2. Find or create a test staff user
    console.log('\n--- 2. Finding or creating test staff user ---');
    let testStaff = await User.findOne({ email: 'test_staff_reset@thinkcrm.local' });
    if (!testStaff) {
      testStaff = await User.create({
        firstName: 'Test',
        lastName: 'Staff',
        email: 'test_staff_reset@thinkcrm.local',
        passwordHash: 'InitialPass123!',
        role: 'Staff',
        status: 'active',
      });
    }

    // 3. Test userService.resetPassword() directly
    console.log('\n--- 3. Testing userService.resetPassword() directly ---');
    const resetResult = await userService.resetPassword(testStaff._id.toString());
    console.log('Reset result tempPassword:', resetResult.tempPassword);
    
    // Verify password was hashed and can be verified
    const updatedUser = await User.findById(testStaff._id).select('+passwordHash');
    const isMatch = await bcrypt.compare(resetResult.tempPassword, updatedUser.passwordHash);
    if (!isMatch) {
      throw new Error('Password was not properly hashed with bcrypt!');
    }
    console.log('✔ Password was successfully set and verified with bcrypt.');

    // 4. Test HTTP POST /api/v1/staff/:id/reset-password via Express route
    console.log('\n--- 4. Testing HTTP endpoint POST /api/v1/staff/:id/reset-password ---');
    
    // Find admin/owner user for auth token
    let adminUser = await User.findOne({ role: { $in: ['Owner', 'Admin'] }, status: 'active' });
    if (!adminUser) {
      adminUser = await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: 'temp_admin@thinkcrm.local',
        passwordHash: 'AdminPass123!',
        role: 'Admin',
        status: 'active',
      });
    }

    const { accessToken: token } = generateTokens(adminUser._id);

    const res = await request(app)
      .post(`/api/v1/staff/${testStaff._id}/reset-password`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    console.log('HTTP Status:', res.status);
    console.log('HTTP Response Body:', res.body);

    if (res.status !== 200) {
      throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    }

    if (!res.body.success || !res.body.data.tempPassword) {
      throw new Error(`Response missing tempPassword: ${JSON.stringify(res.body)}`);
    }
    console.log('✔ HTTP endpoint works properly and returns tempPassword.');

    // 5. Test 404 on invalid ID
    console.log('\n--- 5. Testing 404 on non-existent staff ID ---');
    const fakeId = new mongoose.Types.ObjectId();
    const res404 = await request(app)
      .post(`/api/v1/staff/${fakeId}/reset-password`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    console.log('HTTP Status for non-existent ID:', res404.status);
    if (res404.status !== 404) {
      throw new Error(`Expected 404 for non-existent ID, got ${res404.status}`);
    }
    console.log('✔ Non-existent ID returns 404 as expected.');

    console.log('\n======================================');
    console.log('ALL RESET PASSWORD TESTS PASSED (5/5)!');
    console.log('======================================');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
};

runTests();
