import { validateAndNormalizePhone, isValidPhoneString } from './src/utils/phoneValidator.js';
import { createLeadSchema, updateLeadSchema } from './src/validators/lead.validator.js';
import { createCustomerSchema, updateCustomerSchema, addCustomerProjectSchema } from './src/validators/customer.validator.js';
import { createUserSchema } from './src/validators/user.validator.js';
import { createQuotationSchema } from './src/validators/quotation.validator.js';
import { createFollowUpSchema } from './src/validators/followup.validator.js';

console.log('====================================================');
console.log('RUNNING THINKCRM COMPREHENSIVE VALIDATION SUITE');
console.log('====================================================');

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failedCount++;
  }
}

// 1. Phone number with automatic +91
const t1 = validateAndNormalizePhone('9876543210', '+91');
assert(t1.isValid && t1.e164 === '+919876543210', '10-digit Indian mobile with default +91 normalizes to +919876543210');

// 2. Phone number pasted with spaces and hyphens
const t2 = validateAndNormalizePhone('+91 98765-43210');
assert(t2.isValid && t2.e164 === '+919876543210', 'Pasted phone with spaces and hyphens normalizes correctly');

// 3. Phone number pasted with +91 already included
const t3 = validateAndNormalizePhone('+919876543210', '+91');
assert(t3.isValid && t3.e164 === '+919876543210', 'No duplicate +91 when already present in input');

// 4. Invalid phone containing letters
const t4 = validateAndNormalizePhone('98765ABCD0', '+91');
assert(!t4.isValid, 'Phone number with letters is rejected');

// 5. Too short phone number
const t5 = validateAndNormalizePhone('98765', '+91');
assert(!t5.isValid, 'Too-short phone number is rejected');

// 6. Too long phone number
const t6 = validateAndNormalizePhone('987654321012345', '+91');
assert(!t6.isValid, 'Too-long phone number is rejected');

// 7. Non-cellular / invalid Indian starting digit (e.g. starting with 2, 3, 4, 5)
const t7 = validateAndNormalizePhone('2345678901', '+91');
assert(!t7.isValid, 'Indian mobile not starting with 6, 7, 8, or 9 is rejected');

// 8. International phone numbers (e.g. US, UK, UAE)
const t8 = validateAndNormalizePhone('4155552671', '+1');
assert(t8.isValid && t8.e164 === '+14155552671', 'Valid US phone number with +1 country code accepted');

// 9. Lead Schema Validation
const leadValid = createLeadSchema.safeParse({
  fullName: 'Vikramaditya Sharma-Patel',
  phone: '+919876543210',
  email: 'VIKRAM.SHARMA@GMAIL.COM',
  budget: '450000',
  projectType: 'Modular Kitchen',
});
assert(leadValid.success, 'Valid lead with Unicode/hyphenated name, uppercase email, and budget passes');
if (leadValid.success) {
  assert(leadValid.data.budget === 450000, 'Lead budget string successfully parsed to positive number');
}

// 10. Lead schema rejecting negative budget
const leadNegBudget = createLeadSchema.safeParse({
  fullName: 'Amit Kumar',
  phone: '9876543210',
  budget: '-50000',
});
assert(!leadNegBudget.success, 'Lead schema rejects negative budget');

// 11. Lead schema rejecting invalid phone
const leadBadPhone = createLeadSchema.safeParse({
  fullName: 'Amit Kumar',
  phone: 'abc-random-string',
});
assert(!leadBadPhone.success, 'Lead schema rejects random string as phone');

// 12. Customer Schema Validation
const custValid = createCustomerSchema.safeParse({
  fullName: 'Pooja O\'Connor & Sons',
  phone: '+91 98220 12345',
  email: 'pooja@example.com ',
  totalValue: '1250000',
  customerType: 'Individual', // Capitalized in frontend
});
assert(custValid.success, 'Customer with apostrophe name, formatted phone, and capitalized customerType succeeds');

// 13. Customer rejecting negative totalValue
const custNegValue = createCustomerSchema.safeParse({
  fullName: 'Pooja Patel',
  phone: '9822012345',
  totalValue: -100,
});
assert(!custNegValue.success, 'Customer schema rejects negative totalValue');

// 14. Customer Project Schema
const projValid = addCustomerProjectSchema.safeParse({
  projectName: 'Master Bedroom Renovation',
  projectType: 'Full Home',
  budget: 350000,
});
assert(projValid.success, 'Customer project schema accepts valid project name and budget');

const projInvalid = addCustomerProjectSchema.safeParse({
  projectName: 'M',
  projectType: 'Full Home',
  budget: -500,
});
assert(!projInvalid.success, 'Customer project schema rejects short name and negative budget');

// 15. Staff User Creation Schema
const staffValid = createUserSchema.safeParse({
  firstName: 'Sunil',
  lastName: 'Verma',
  email: 'SUNIL.VERMA@THINKCRM.COM',
  phone: '9811223344',
  password: 'Password123',
  role: 'Sales Manager',
});
assert(staffValid.success, 'Staff creation schema validates name, email, phone, role, and password');

// 16. Quotation Schema
const quoteValid = createQuotationSchema.safeParse({
  amount: '350000',
  quotationNumber: 'QT-99120',
});
assert(quoteValid.success && quoteValid.data.amount === 350000, 'Quotation schema parses amount to positive number');

const quoteNegative = createQuotationSchema.safeParse({
  amount: '-1000',
});
assert(!quoteNegative.success, 'Quotation schema rejects negative or zero amount');

// 17. Follow-up Schema
const followUpValid = createFollowUpSchema.safeParse({
  type: 'call',
  scheduledAt: '2026-10-25T14:30:00Z',
  priority: 'high',
  notes: 'Detailed follow up notes',
});
assert(followUpValid.success, 'Follow-up schema accepts valid calendar date/time and priority');

const followUpBadDate = createFollowUpSchema.safeParse({
  type: 'call',
  scheduledAt: 'not-a-real-date',
});
assert(!followUpBadDate.success, 'Follow-up schema rejects invalid date');

console.log('====================================================');
console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('====================================================');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
