import express from 'express';
import axios from 'axios';
import { logger } from '../../utils/logger.js';
import { createLead } from '../../services/lead.service.js';
import { Setting } from '../../models/Setting.js';

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

const processMetaLead = async (metaLeadId) => {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('META_ACCESS_TOKEN is not configured');
    }

    const response = await axios.get(`https://graph.facebook.com/v19.0/${metaLeadId}`, {
      params: { access_token: accessToken },
    });

    const leadData = response.data;
    
    // Parse field_data to standard CRM format
    // Meta returns an array of { name: 'email', values: ['test@test.com'] }
    let fullName = 'Unknown';
    let email = '';
    let phone = '';

    for (const field of leadData.field_data) {
      if (field.name === 'full_name' || field.name === 'first_name') {
        fullName = field.values[0];
      }
      if (field.name === 'email') {
        email = field.values[0];
      }
      if (field.name === 'phone_number') {
        phone = field.values[0];
      }
    }

    // Default assignment
    const settings = await Setting.findOne();
    const assignedTo = settings?.defaultAssignmentSettings?.metaLeadAssignee || null;

    // Create lead
    const crmLeadData = {
      fullName: fullName || 'Unknown Meta Lead',
      email,
      phone: phone || '0000000000', // Need phone based on our schema, but meta might not have it
      leadSource: 'Meta',
      metaLeadId: metaLeadId,
      projectType: 'Other',
      assignedTo,
    };

    // Note: We need a system user to associate with "createdBy". Let's fetch an admin or use null if schema allows, but schema requires User ObjectId.
    // For now we'll just not pass createdBy if it's optional or we will have to handle it in service. The schema createdBy is not required.
    // Wait, the createLead schema requires it? In Lead.js `createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }` - it is not strictly required `required: true` is not set on createdBy.

    await createLead(crmLeadData, null);

  } catch (error) {
    logger.error(`Meta lead processing failed: ${error.message}`);
  }
};
