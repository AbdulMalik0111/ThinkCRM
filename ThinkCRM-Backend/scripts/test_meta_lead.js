import axios from 'axios';

async function test() {
  try {
    const port = process.env.PORT || 5000;
    const res = await axios.post(`http://127.0.0.1:${port}/api/v1/integrations/meta/simulate-test-lead`, {
      fullName: 'Vikram Malhotra',
      phone: '+91 99887 76655',
      email: 'vikram.m@example.com',
      city: 'Bangalore',
      projectType: 'Modular Kitchen',
      budgetRange: '8L - 12L',
      campaignName: 'Diwali Mega Sale 2026',
      adName: 'Luxury Kitchen Video Ad',
      formName: 'Bangalore Lead Form',
      platform: 'Instagram',
      customQuestions: {
        'What type of kitchen layout do you prefer?': 'L-Shape Modular Kitchen',
        'When do you plan to start?': 'Within 15 days',
      },
    });
    console.log('STATUS:', res.status);
    console.log('SUCCESS:', res.data.success);
    console.log('LEAD ID:', res.data.data.lead.leadId);
    console.log('LEAD NAME:', res.data.data.lead.fullName);
    console.log('LEAD SOURCE:', res.data.data.lead.leadSource);
    console.log('TAGS:', res.data.data.lead.tags);
    console.log('NOTES:', res.data.data.lead.notes);
  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}

test();
