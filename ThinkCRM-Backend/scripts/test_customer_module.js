import 'dotenv/config';
import mongoose from 'mongoose';
import { Customer } from '../src/models/Customer.js';
import { Lead } from '../src/models/Lead.js';
import { User } from '../src/models/User.js';
import * as customerService from '../src/services/customer.service.js';
import * as quotationService from '../src/services/quotation.service.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const user = await User.findOne();
  if (!user) throw new Error('No user found');

  const testPhone = '+91 99887 76655';
  const testEmail = 'rahul.dedup.test@example.com';
  const customerName = 'Rahul Sharma (Test Deduplication)';

  console.log('\n--- 1. Testing Multi-Lead Deduplication ---');
  // Clean up any previous test records
  await Lead.deleteMany({ phone: testPhone });
  await Customer.deleteMany({ phone: testPhone });

  // Create Lead 1: Modular Kitchen
  const lead1 = await Lead.create({
    fullName: customerName,
    phone: testPhone,
    email: testEmail,
    projectType: 'Modular Kitchen',
    projectDescription: 'L-shaped acrylic kitchen',
    budget: 250000,
    status: 'new',
    createdBy: user._id,
  });
  console.log('Created Lead 1:', lead1.leadId, lead1.projectType);

  // Convert Lead 1 to customer
  const cust1 = await customerService.convertLeadToCustomer(lead1._id, user._id);
  console.log('Converted Lead 1 -> Customer:', cust1.customerId, cust1.fullName);

  // Create Lead 2: Wardrobe Design (Same phone, same person)
  const lead2 = await Lead.create({
    fullName: customerName,
    phone: testPhone,
    email: testEmail,
    projectType: 'Wardrobe Design',
    projectDescription: 'Master bedroom 3-door wardrobe',
    budget: 180000,
    status: 'new',
    createdBy: user._id,
  });
  console.log('Created Lead 2 (same person):', lead2.leadId, lead2.projectType);

  // Convert Lead 2 - MUST link to existing customer cust1 without creating a new customer!
  const cust2 = await customerService.convertLeadToCustomer(lead2._id, user._id);
  console.log('Converted Lead 2 -> Customer:', cust2.customerId, cust2.fullName);

  if (cust1._id.toString() !== cust2._id.toString()) {
    throw new Error('DEDUPLICATION FAILED! Duplicate customer created!');
  }
  console.log('SUCCESS: Lead 2 linked to existing customer record!');

  // Verify customer details
  const custDetails = await customerService.getCustomerById(cust1._id);
  console.log('Customer linked leads count:', custDetails.leads.length);
  console.log('Customer projects count:', custDetails.customer.projects.length);
  console.log('Customer total value:', custDetails.customer.totalValue);

  if (custDetails.leads.length !== 2) {
    throw new Error(`Expected 2 linked leads, got ${custDetails.leads.length}`);
  }
  if (custDetails.customer.projects.length !== 2) {
    throw new Error(`Expected 2 projects, got ${custDetails.customer.projects.length}`);
  }

  console.log('\n--- 2. Testing Customer Quotation Upload & Retrieve ---');
  const minimalPdfBuffer = Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n' +
    'xref\n' +
    '0 4\n' +
    '0000000000 65535 f \n' +
    '0000000009 00000 n \n' +
    '0000000052 00000 n \n' +
    '0000000101 00000 n \n' +
    'trailer<</Size 4/Root 1 0 R>>\n' +
    'startxref\n' +
    '178\n' +
    '%%EOF\n'
  );
  const dummyQuotationPdf = {
    buffer: minimalPdfBuffer,
    originalname: 'customer-quote.pdf',
    mimetype: 'application/pdf',
  };
  const quote = await quotationService.createCustomerQuotation(
    cust1._id,
    { amount: 430000, message: 'Combined project quote', leadId: lead1._id },
    dummyQuotationPdf,
    user._id
  );
  console.log('Created quotation on customer:', quote.quotationNumber, 'Amount:', quote.amount);

  const updatedCustDetails = await customerService.getCustomerById(cust1._id);
  console.log('Quotations accessible under customer:', updatedCustDetails.quotations.length);
  if (updatedCustDetails.quotations.length === 0) {
    throw new Error('Quotation not found under customer!');
  }

  console.log('\n--- 3. Testing Customer Follow-up Scheduling ---');
  const followUp = await customerService.createCustomerFollowUp(
    cust1._id,
    {
      type: 'call',
      scheduledAt: new Date(Date.now() + 86400000),
      notes: 'Discuss kitchen design revisions',
      leadId: lead1._id,
    },
    user._id
  );
  console.log('Created follow-up on customer:', followUp._id, 'Type:', followUp.type);

  // Update follow-up
  const updatedFollowUp = await customerService.updateCustomerFollowUp(
    cust1._id,
    followUp._id,
    { status: 'completed', outcome: 'interested' },
    user._id
  );
  console.log('Updated follow-up status:', updatedFollowUp.status, 'Outcome:', updatedFollowUp.outcome);

  console.log('\n--- 4. Testing Call and WhatsApp Logging ---');
  const callActivity = await customerService.logCustomerCall(
    cust1._id,
    { duration: 180, outcome: 'connected', notes: 'Client confirmed Saturday meeting' },
    user._id
  );
  console.log('Logged call activity:', callActivity.description);

  const waActivity = await customerService.logCustomerWhatsApp(
    cust1._id,
    { message: 'Hi Rahul, sharing the 3D render preview' },
    user._id
  );
  console.log('Logged WhatsApp activity:', waActivity.description);

  console.log('\n--- 5. Testing Customer Listing with Counts ---');
  const list = await customerService.getCustomers({ search: 'Rahul' });
  const foundCust = list.customers.find((c) => c._id.toString() === cust1._id.toString());
  console.log('Customer in listing:', foundCust?.fullName, 'leadsCount:', foundCust?.leadsCount, 'projectsCount:', foundCust?.projectsCount);

  console.log('\n--- 6. Cleaning Up Test Data ---');
  await quotationService.deleteQuotation(cust1._id, quote._id, user._id);
  await Lead.deleteMany({ _id: { $in: [lead1._id, lead2._id] } });
  await Customer.deleteOne({ _id: cust1._id });
  console.log('Cleaned up test data!');

  await mongoose.disconnect();
  console.log('\nALL BACKEND AUDIT TESTS PASSED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
