import 'dotenv/config';
import mongoose from 'mongoose';
import { Lead } from '../src/models/Lead.js';
import { Customer } from '../src/models/Customer.js';
import { Quotation } from '../src/models/Quotation.js';
import { FollowUp } from '../src/models/FollowUp.js';
import { normalizePhone, normalizeEmail } from '../src/utils/normalize.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  // 1. Get all active leads
  const leads = await Lead.find({ isDeleted: false }).sort({ createdAt: 1, leadId: 1 });
  console.log(`Total active leads in system: ${leads.length}`);

  // Create lead lookup maps
  const leadPhoneSet = new Set();
  const leadEmailSet = new Set();
  for (const l of leads) {
    const { canonical: p } = normalizePhone(l.phone);
    if (p) leadPhoneSet.add(p);
    const e = normalizeEmail(l.email);
    if (e) leadEmailSet.add(e);
  }

  // 2. Identify and remove unlinked / extra customers (seed records not present in leads)
  const allCustomers = await Customer.find({ deletedAt: null });
  console.log(`Total existing customers before cleanup: ${allCustomers.length}`);

  const customersToDelete = [];
  for (const c of allCustomers) {
    const { canonical: p } = normalizePhone(c.phone);
    const e = normalizeEmail(c.email);

    const matchesLead =
      (p && leadPhoneSet.has(p)) ||
      (e && leadEmailSet.has(e)) ||
      (c.sourceLeadId && leads.some((l) => l._id.toString() === c.sourceLeadId.toString())) ||
      leads.some((l) => l.customerId && l.customerId.toString() === c._id.toString());

    if (!matchesLead) {
      customersToDelete.push(c);
    }
  }

  console.log(`Found ${customersToDelete.length} unlinked/extra customers to remove.`);
  if (customersToDelete.length > 0) {
    const idsToDelete = customersToDelete.map((c) => c._id);
    const delResult = await Customer.deleteMany({ _id: { $in: idsToDelete } });
    console.log(`Removed ${delResult.deletedCount} extra customers successfully.`);
  }

  // 3. For every single active lead, ensure a 1-to-1 Customer record exists
  let createdCount = 0;
  let updatedCount = 0;

  for (let idx = 0; idx < leads.length; idx++) {
    const lead = leads[idx];
    const { canonical: leadPhoneDigits } = normalizePhone(lead.phone);
    const leadEmailNorm = normalizeEmail(lead.email);

    // Find if a customer already exists for this lead
    let customer = null;
    if (lead.customerId) {
      customer = await Customer.findOne({ _id: lead.customerId, deletedAt: null });
    }
    if (!customer) {
      customer = await Customer.findOne({
        deletedAt: null,
        $or: [
          { sourceLeadId: lead._id },
          { leads: lead._id },
          ...(leadPhoneDigits && leadPhoneDigits.length === 10 ? [{ phone: { $regex: leadPhoneDigits } }] : []),
          ...(leadEmailNorm ? [{ email: leadEmailNorm }] : []),
        ],
      });
    }

    const projects = [
      {
        projectName: `${lead.projectType || 'Interior'} Project`,
        projectType: lead.projectType || 'Interior',
        description: lead.projectDescription || lead.requirement || '',
        budget: Number(lead.budget) || 0,
        status: 'active',
        assignedStaff: lead.assignedTo || null,
        leadId: lead._id,
        startDate: lead.createdAt || new Date(),
      },
    ];

    if (!customer) {
      // Create new customer record for this lead
      customer = await Customer.create({
        fullName: lead.fullName,
        phone: lead.phone,
        alternatePhone: lead.alternatePhone || undefined,
        email: lead.email || undefined,
        address: lead.address || undefined,
        location: lead.location || [lead.city, lead.state].filter(Boolean).join(', ') || undefined,
        city: lead.city || undefined,
        state: lead.state || undefined,
        pincode: lead.pincode || undefined,
        source: lead.leadSource || 'Website',
        assignedStaff: lead.assignedTo || null,
        projectType: lead.projectType || 'Interior',
        totalValue: Number(lead.budget) || 0,
        projects,
        sourceLeadId: lead._id,
        leads: [lead._id],
        status: 'active',
      });
      createdCount++;
    } else {
      // Update existing customer to ensure lead._id and projects are present
      if (!customer.leads) customer.leads = [];
      if (!customer.leads.some((lId) => lId.toString() === lead._id.toString())) {
        customer.leads.push(lead._id);
      }
      if (!customer.sourceLeadId) {
        customer.sourceLeadId = lead._id;
      }
      if (!customer.projects || customer.projects.length === 0) {
        customer.projects = projects;
        customer.totalValue = Number(lead.budget) || 0;
      }
      await customer.save();
      updatedCount++;
    }

    // Link customerId on lead WITHOUT modifying lead.status!
    if (!lead.customerId || lead.customerId.toString() !== customer._id.toString()) {
      lead.customerId = customer._id;
      await lead.save();
    }

    // Re-link quotations and follow-ups
    await Quotation.updateMany({ leadId: lead._id }, { customerId: customer._id });
    await FollowUp.updateMany({ leadId: lead._id }, { customerId: customer._id });
  }

  console.log(`\n--- Customer Sync Results ---`);
  console.log(`Newly created customers: ${createdCount}`);
  console.log(`Updated / verified customers: ${updatedCount}`);

  // 4. Ensure customerIds are clean sequential CUS-2026-00001 through CUS-2026-00254
  const finalCustomers = await Customer.find({ deletedAt: null }).sort({ createdAt: 1, _id: 1 });
  console.log(`Final total active customers in DB: ${finalCustomers.length}`);

  for (let i = 0; i < finalCustomers.length; i++) {
    const expectedId = `CUS-2026-${String(i + 1).padStart(5, '0')}`;
    if (finalCustomers[i].customerId !== expectedId) {
      await Customer.updateOne({ _id: finalCustomers[i]._id }, { customerId: expectedId });
    }
  }

  // 5. Verify Client 226 specifically
  const client226Cust = await Customer.findOne({ fullName: /Client 226/i });
  const client226Lead = await Lead.findOne({ fullName: /Client 226/i });
  console.log('\n--- Client 226 Verification ---');
  console.log('Customer:', client226Cust ? {
    customerId: client226Cust.customerId,
    fullName: client226Cust.fullName,
    phone: client226Cust.phone,
    projects: client226Cust.projects?.length,
  } : 'NOT FOUND');
  console.log('Lead:', client226Lead ? {
    leadId: client226Lead.leadId,
    fullName: client226Lead.fullName,
    status: client226Lead.status,
    customerId: client226Lead.customerId,
  } : 'NOT FOUND');

  await mongoose.disconnect();
  console.log('\nSync finished successfully.');
}

main().catch(console.error);
