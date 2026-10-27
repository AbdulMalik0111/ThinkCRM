import express from 'express';
import axios from 'axios';
import { logger } from '../../utils/logger.js';
import { createLead } from '../../services/lead.service.js';
import { Setting } from '../../models/Setting.js';
import { Lead } from '../../models/Lead.js';
import { User } from '../../models/User.js';

export const metaWebhookRoute = express.Router();

metaWebhookRoute.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      logger.info('Meta webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

metaWebhookRoute.post('/webhook', async (req, res) => {
  const { object, entry } = req.body;

  if (object !== 'page') {
    return res.sendStatus(404);
  }

  // Acknowledge receipt immediately
  res.status(200).send('EVENT_RECEIVED');

  try {
    for (const pageEntry of entry) {
      for (const messagingEvent of pageEntry.changes) {
        if (messagingEvent.field === 'leadgen') {
          const leadId = messagingEvent.value.leadgen_id;
          await processMetaLead(leadId);
        }
      }
    }
  } catch (error) {
    logger.error(`Error processing meta webhook: ${error.message}`);
  }
});

// Test simulation endpoint (for testing lead creation without needing live Meta API call)
metaWebhookRoute.post('/simulate-test-lead', async (req, res) => {
  try {
    const {
      fullName = 'Rohit Sharma (Meta Test)',
      email = 'rohit.sharma@example.com',
      phone = '+91 98765 43210',
      city = 'Mumbai',
      projectType = 'Modular Kitchen',
      budgetRange = '₹5L - ₹10L',
      campaignName = 'Festive Offer Ad Campaign',
      adName = 'Modern Kitchen Design Video',
      formName = 'Instant Quote Form',
      platform = 'Instagram',
      customQuestions = {
        'What type of kitchen layout do you prefer?': 'L-Shape Modular Kitchen',
        'When do you plan to start?': 'Within 15 days',
      },
    } = req.body || {};

    const dummyMetaLeadId = `test_meta_${Date.now()}`;

    const notesParts = [
      '--- Meta Lead Ads Info (Test Simulation) ---',
      `Platform: ${platform}`,
      `Campaign: ${campaignName}`,
      `Ad: ${adName}`,
      `Form: ${formName}`,
      '\n--- Form Questions & Answers ---',
      ...Object.entries(customQuestions).map(([q, a]) => `• ${q}: ${a}`),
    ];

    const settings = await Setting.findOne();
    let assignedTo = settings?.defaultAssignmentSettings?.metaLeadAssignee || null;
    let adminUser = null;
    if (!assignedTo) {
      adminUser = await User.findOne({ role: { $in: ['Owner', 'Admin'] }, status: 'active' });
      if (adminUser) assignedTo = adminUser._id;
    }

    const createdLead = await createLead(
      {
        fullName,
        email,
        phone,
        city,
        leadSource: 'Meta Ads',
        metaLeadId: dummyMetaLeadId,
        projectType,
        budgetRange,
        requirement: Object.entries(customQuestions).map(([q, a]) => `${q}: ${a}`).join('; '),
        notes: notesParts.join('\n'),
        assignedTo: assignedTo || undefined,
        tags: ['Meta Ads', platform, 'Test Simulation'],
      },
      adminUser?._id || assignedTo || null
    );

    return res.status(201).json({
      success: true,
      message: 'Simulated Meta lead created successfully in ThinkCRM!',
      data: {
        lead: createdLead,
      },
    });
  } catch (error) {
    logger.error(`Simulated meta lead failed: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
});

const processMetaLead = async (metaLeadId) => {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('META_ACCESS_TOKEN is not configured');
    }

    // Check if this Meta lead was already imported to prevent duplicates
    const existing = await Lead.findOne({ metaLeadId });
    if (existing) {
      logger.info(`Meta lead ${metaLeadId} already exists in CRM (ID: ${existing.leadId}). Skipping duplicate import.`);
      return;
    }

    // Fetch complete lead details from Meta Graph API
    const response = await axios.get(`https://graph.facebook.com/v19.0/${metaLeadId}`, {
      params: { 
        access_token: accessToken,
        fields: 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,form_name,platform,field_data'
      },
    });

    const leadData = response.data;
    
    // Parse field_data to standard CRM format
    // Meta returns an array of { name: 'email', values: ['test@test.com'] }
    let firstName = '';
    let lastName = '';
    let fullName = '';
    let email = '';
    let phone = '';
    let city = '';
    let state = '';
    let address = '';
    let pincode = '';
    let projectType = 'Full Home';
    let budgetRange = '';
    let customAnswers = [];

    for (const field of leadData.field_data || []) {
      const val = (field.values && field.values.length > 0) ? String(field.values[0]).trim() : '';
      if (!val) continue;

      const key = (field.name || '').toLowerCase();

      if (key === 'full_name') {
        fullName = val;
      } else if (key === 'first_name') {
        firstName = val;
      } else if (key === 'last_name') {
        lastName = val;
      } else if (key === 'email') {
        email = val.toLowerCase();
      } else if (key === 'phone_number' || key === 'phone' || key.includes('phone') || key.includes('mobile') || key.includes('contact')) {
        phone = val;
      } else if (key === 'city') {
        city = val;
      } else if (key === 'state') {
        state = val;
      } else if (key === 'street_address' || key === 'address') {
        address = val;
      } else if (key === 'post_code' || key === 'zip_code' || key === 'pincode') {
        pincode = val;
      } else if (key.includes('project') || key.includes('service') || key.includes('requirement') || key.includes('type')) {
        const lowerVal = val.toLowerCase();
        if (lowerVal.includes('kitchen')) projectType = 'Modular Kitchen';
        else if (lowerVal.includes('wardrobe')) projectType = 'Wardrobe';
        else if (lowerVal.includes('bedroom')) projectType = 'Bedroom';
        else if (lowerVal.includes('living')) projectType = 'Living Room';
        else if (lowerVal.includes('office')) projectType = 'Office';
        else if (lowerVal.includes('commercial')) projectType = 'Commercial';
        else if (lowerVal.includes('home') || lowerVal.includes('flat') || lowerVal.includes('villa') || lowerVal.includes('apartment') || lowerVal.includes('interior')) projectType = 'Full Home';
        else projectType = 'Other';
        customAnswers.push(`${field.name}: ${val}`);
      } else if (key.includes('budget')) {
        budgetRange = val;
        customAnswers.push(`${field.name}: ${val}`);
      } else {
        customAnswers.push(`${field.name}: ${val}`);
      }
    }

    if (!fullName) {
      fullName = `${firstName} ${lastName}`.trim() || 'Meta Lead';
    }

    // Build comprehensive notes including Ad Campaign info and all custom answers
    const notesParts = [];
    if (leadData.campaign_name || leadData.ad_name || leadData.form_name || leadData.platform) {
      notesParts.push('--- Meta Lead Ads Info ---');
      if (leadData.platform) notesParts.push(`Platform: ${leadData.platform.toUpperCase()}`);
      if (leadData.campaign_name) notesParts.push(`Campaign: ${leadData.campaign_name}`);
      if (leadData.adset_name) notesParts.push(`AdSet: ${leadData.adset_name}`);
      if (leadData.ad_name) notesParts.push(`Ad: ${leadData.ad_name}`);
      if (leadData.form_name) notesParts.push(`Form: ${leadData.form_name}`);
    }

    if (customAnswers.length > 0) {
      notesParts.push('\n--- Form Questions & Answers ---');
      notesParts.push(...customAnswers.map((ans) => `• ${ans}`));
    }

    const compiledNotes = notesParts.join('\n');

    // Default assignment from settings or active admin
    const settings = await Setting.findOne();
    let assignedTo = settings?.defaultAssignmentSettings?.metaLeadAssignee || null;

    let adminUser = null;
    if (!assignedTo) {
      adminUser = await User.findOne({ role: { $in: ['Owner', 'Admin'] }, status: 'active' });
      if (adminUser) {
        assignedTo = adminUser._id;
      }
    }

    // Determine platform tag
    const sourcePlatform = leadData.platform === 'ig' ? 'Instagram' : 'Facebook';

    // Create lead payload
    const crmLeadData = {
      fullName,
      email: email || undefined,
      phone: phone || '0000000000',
      city: city || undefined,
      state: state || undefined,
      address: address || undefined,
      pincode: pincode || undefined,
      leadSource: 'Meta Ads',
      metaLeadId,
      projectType,
      budgetRange: budgetRange || undefined,
      requirement: customAnswers.length > 0 ? customAnswers.join('; ') : undefined,
      notes: compiledNotes || `Lead generated from Meta Ads (${sourcePlatform})`,
      assignedTo: assignedTo || undefined,
      tags: ['Meta Ads', sourcePlatform],
    };

    const createdLead = await createLead(crmLeadData, adminUser?._id || assignedTo || null);
    logger.info(`Successfully imported Meta lead ${metaLeadId} as CRM Lead ${createdLead.leadId || createdLead._id}`);

  } catch (error) {
    logger.error(`Meta lead processing failed for lead ID ${metaLeadId}: ${error.message}`);
  }
};
