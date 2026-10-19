import 'dotenv/config';
import mongoose from 'mongoose';
import { Customer } from '../src/models/Customer.js';
import { Lead } from '../src/models/Lead.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const customers = await Customer.find({ deletedAt: null }).select('customerId fullName phone email sourceLeadId createdAt');
  console.log('Total active customers:', customers.length);

  const phoneMap = {};
  const emailMap = {};
  for (const c of customers) {
    const p = (c.phone || '').replace(/\D/g, '').slice(-10);
    const e = (c.email || '').toLowerCase().trim();
    if (p) {
      phoneMap[p] = (phoneMap[p] || []).concat(c);
    }
    if (e) {
      emailMap[e] = (emailMap[e] || []).concat(c);
    }
  }

  const dupPhones = Object.entries(phoneMap).filter(([k, v]) => v.length > 1);
  const dupEmails = Object.entries(emailMap).filter(([k, v]) => v.length > 1);
  console.log('Duplicate customers by 10-digit phone:', dupPhones.length);
  for (const [p, list] of dupPhones) {
    console.log(` Phone ${p}:`, list.map(c => `${c.customerId} - ${c.fullName} (${c._id})`));
  }
  console.log('Duplicate customers by email:', dupEmails.length);
  for (const [e, list] of dupEmails) {
    console.log(` Email ${e}:`, list.map(c => `${c.customerId} - ${c.fullName} (${c._id})`));
  }

  // Check leads with matching phone or email
  const leadsWithMatch = [];
  for (const c of customers) {
    const p = (c.phone || '').replace(/\D/g, '').slice(-10);
    const e = (c.email || '').toLowerCase().trim();
    const query = [];
    if (p) query.push({ phone: { $regex: p } });
    if (e) query.push({ email: e });
    if (c.sourceLeadId) query.push({ _id: c.sourceLeadId });

    const matchingLeads = await Lead.find({ $or: query, isDeleted: false }).select('leadId fullName phone email status');
    if (matchingLeads.length > 0) {
      leadsWithMatch.push({
        customer: `${c.customerId} ${c.fullName}`,
        phone: c.phone,
        matchingLeads: matchingLeads.map(l => `${l.leadId}: ${l.fullName} (${l.phone}) [${l.status}]`)
      });
    }
  }

  console.log('\n--- Customers with matching leads ---');
  console.log(`Found ${leadsWithMatch.length} customers with matching leads`);
  console.log(JSON.stringify(leadsWithMatch.slice(0, 5), null, 2));

  // Check how many leads have multiple leads with identical phone
  const allLeads = await Lead.find({ isDeleted: false }).select('leadId fullName phone email status');
  const leadPhoneMap = {};
  for (const l of allLeads) {
    const p = (l.phone || '').replace(/\D/g, '').slice(-10);
    if (p) {
      leadPhoneMap[p] = (leadPhoneMap[p] || []).concat(l);
    }
  }
  const multiLeadPhones = Object.entries(leadPhoneMap).filter(([k, v]) => v.length > 1);
  console.log(`\nFound ${multiLeadPhones.length} phone numbers that belong to MULTIPLE leads!`);
  for (const [p, list] of multiLeadPhones.slice(0, 5)) {
    console.log(` Phone ${p}:`, list.map(l => `${l.leadId} - ${l.fullName} (${l.status})`));
  }

  await mongoose.disconnect();
}

main().catch(console.error);
