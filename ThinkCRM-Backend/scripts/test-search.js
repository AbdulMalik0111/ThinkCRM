import dotenv from 'dotenv';
dotenv.config();

async function runComprehensiveSuite() {
  console.log('=== STARTING THINKCRM GLOBAL SEARCH TEST SUITE ===');

  // Step 1: Admin/Owner Login
  const loginRes = await fetch('http://localhost:5050/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@thinkcrm.local', password: 'password123' })
  });
  const { data: { accessToken: ownerToken } } = await loginRes.json();
  console.log('Owner logged in successfully.');

  // Test helper
  async function search(q, token = ownerToken, entity = '') {
    const url = new URL('http://localhost:5050/api/v1/search');
    if (q) url.searchParams.set('q', q);
    if (entity) url.searchParams.set('entity', entity);
    const res = await fetch(url.toString(), {
      headers: { Authorization: 'Bearer ' + token }
    });
    return await res.json();
  }

  const tests = [
    {
      name: '1. Exact customer name',
      query: 'Rahul Sharma',
      validate: (res) => res.data.counts.customers >= 1 && res.data.results.customers[0].fullName === 'Rahul Sharma'
    },
    {
      name: '2. Partial customer name',
      query: 'Rahul',
      validate: (res) => res.data.counts.customers >= 1
    },
    {
      name: '3. Misspelled customer name (typo tolerance)',
      query: 'Rhaul Sharma',
      validate: (res) => res.data.suggestion === 'Rahul Sharma'
    },
    {
      name: '4. Phone with country code',
      query: '+91 98765 43210',
      validate: (res) => res.data.counts.customers >= 1 && res.data.results.customers[0].phone.includes('98765')
    },
    {
      name: '5. Phone without spaces or country code',
      query: '9876543210',
      validate: (res) => res.data.counts.customers >= 1
    },
    {
      name: '6. Email with different letter casing',
      query: 'RAHUL@EXAMPLE.COM',
      validate: (res) => res.data.counts.customers >= 1 && res.data.results.customers[0].email === 'rahul@example.com'
    },
    {
      name: '7. Quotation number',
      query: 'QT-477417',
      validate: (res) => res.data.counts.quotations >= 1 && res.data.results.quotations[0].quotationNumber === 'QT-477417'
    },
    {
      name: '8. Partial Quotation number with space',
      query: 'QT 477',
      validate: (res) => res.data.counts.quotations >= 1
    },
    {
      name: '9. Project name search',
      query: 'Modular Kitchen',
      validate: (res) => res.data.counts.projects >= 1
    },
    {
      name: '10. Multiple consecutive spaces',
      query: 'Rahul      Sharma',
      validate: (res) => res.data.counts.customers >= 1 && res.data.normalizedQuery === 'Rahul Sharma'
    },
    {
      name: '11. Leading and trailing spaces',
      query: '   Rahul Sharma   ',
      validate: (res) => res.data.counts.customers >= 1 && res.data.normalizedQuery === 'Rahul Sharma'
    },
    {
      name: '12. Empty query handling',
      query: '',
      validate: (res) => res.data.totalCount === 0 && res.success === true
    },
    {
      name: '13. Typo: quation -> quotation',
      query: 'quation',
      validate: (res) => res.data.suggestion === 'quotation'
    },
    {
      name: '14. Typo: moduler kitchen -> modular kitchen',
      query: 'moduler kitchen',
      validate: (res) => res.data.suggestion === 'modular kitchen'
    },
    {
      name: '15. Typo: customr -> customer',
      query: 'customr',
      validate: (res) => res.data.suggestion === 'customer'
    },
    {
      name: '16. Multiple entities matching',
      query: 'Client',
      validate: (res) => res.data.totalCount > 1
    },
    {
      name: '17. No results found state',
      query: 'nonexistentfoobar999',
      validate: (res) => res.data.totalCount === 0 && res.success === true
    }
  ];

  let passed = 0;
  for (const t of tests) {
    try {
      const res = await search(t.query);
      const isOk = t.validate(res);
      if (isOk) {
        console.log('✅ PASS: ' + t.name);
        passed++;
      } else {
        console.error('❌ FAIL: ' + t.name, 'Result:', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('❌ ERROR: ' + t.name, err.message);
    }
  }

  console.log('\n=== ROLE & PERMISSIONS SECURITY TEST ===');
  // Login as restricted staff (Sales Executive who doesn't have staff.view or customers.view)
  const execLogin = await fetch('http://localhost:5050/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'executive@thinkcrm.local', password: 'password123' })
  });
  const execData = await execLogin.json();
  const execToken = execData.data?.accessToken;
  if (execToken) {
    const execRes = await search('System', execToken);
    // Sales executive has permissions: ['leads.view', 'leads.update', 'measurements.view', 'quotations.view']
    // Therefore, staff results should NOT be returned!
    const staffReturned = execRes.data?.results?.staff?.length || 0;
    if (staffReturned === 0) {
      console.log('✅ PASS: Permission isolation enforced: Restricted staff cannot view staff records');
      passed++;
    } else {
      console.error('❌ FAIL: Restricted staff received staff records:', staffReturned);
    }
  }

  console.log('\n=== RESULTS: ' + passed + ' / ' + (tests.length + 1) + ' TESTS PASSED ===');
}

runComprehensiveSuite();
