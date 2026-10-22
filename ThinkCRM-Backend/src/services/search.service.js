import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Quotation } from '../models/Quotation.js';
import { Measurement } from '../models/Measurement.js';
import { FollowUp } from '../models/FollowUp.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';

// Utility: Escape special regex characters
export const escapeRegex = (str = '') => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Utility: Normalize whitespace (trim + collapse consecutive spaces)
export const normalizeWhitespace = (str = '') => {
  return str.trim().replace(/\s+/g, ' ');
};

// Utility: Build flexible phone regex allowing optional non-digits between digits
export const buildPhoneRegex = (rawPhone = '') => {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits || digits.length < 3) return null;

  // If Indian country code 91 with 12 digits, extract core 10 digits as well
  let coreDigits = digits;
  if (digits.startsWith('91') && digits.length === 12) {
    coreDigits = digits.slice(2);
  }

  // Allow optional non-digits between each digit
  const pattern = coreDigits.split('').map((d) => escapeRegex(d)).join('\\D*');
  return new RegExp(pattern, 'i');
};

// Utility: Build identifier regex (e.g. QT-797156, LD-2026-00001, CUS-2026-00001)
export const buildIdentifierRegex = (rawId = '') => {
  // If user types "QT 797156" or "qt797156" or "qt-797156"
  const clean = rawId.trim();
  const pattern = clean
    .split(/[-\s]+/)
    .map((part) => escapeRegex(part))
    .join('[-\\s]*');
  return new RegExp(pattern, 'i');
};

// Damerau-Levenshtein distance for typo tolerance
export const damerauLevenshteinDistance = (source = '', target = '') => {
  const s = source.toLowerCase();
  const t = target.toLowerCase();
  const m = s.length;
  const n = t.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }

  return d[m][n];
};

// Cached dictionary of dynamic terms from DB + standard CRM terms
let dictionaryCache = {
  terms: [],
  lastUpdated: 0,
};

const STATIC_CRM_TERMS = [
  'quotation',
  'customer',
  'lead',
  'project',
  'modular kitchen',
  'wardrobe',
  'wardrobe design',
  'bedroom',
  'living room',
  'office interior',
  'full home interior',
  'commercial',
  'measurement',
  'follow up',
  'completed',
  'scheduled',
  'draft',
  'in progress',
  'pending',
  'active',
  'qualified',
  'contacted',
  'site visit',
];

export const getCachedDictionary = async () => {
  const now = Date.now();
  // Refresh cache every 5 minutes
  if (dictionaryCache.terms.length > 0 && now - dictionaryCache.lastUpdated < 5 * 60 * 1000) {
    return dictionaryCache.terms;
  }

  try {
    const termMap = new Map();
    STATIC_CRM_TERMS.forEach((t) => termMap.set(t.toLowerCase(), { text: t, category: 'General' }));

    // Fetch sample of lead and customer names
    const [leads, customers, users] = await Promise.all([
      Lead.find({}).select('fullName projectType').limit(150).lean(),
      Customer.find({}).select('fullName projects.projectName').limit(150).lean(),
      User.find({}).select('firstName lastName role').limit(50).lean(),
    ]);

    leads.forEach((l) => {
      if (l.fullName) termMap.set(l.fullName.toLowerCase(), { text: l.fullName, category: 'Lead' });
      if (l.projectType) termMap.set(l.projectType.toLowerCase(), { text: l.projectType, category: 'Project Type' });
    });

    customers.forEach((c) => {
      if (c.fullName) termMap.set(c.fullName.toLowerCase(), { text: c.fullName, category: 'Customer' });
      if (c.projects) {
        c.projects.forEach((p) => {
          if (p.projectName) termMap.set(p.projectName.toLowerCase(), { text: p.projectName, category: 'Project' });
        });
      }
    });

    users.forEach((u) => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      if (name) termMap.set(name.toLowerCase(), { text: name, category: 'Staff' });
    });

    dictionaryCache = {
      terms: Array.from(termMap.values()),
      lastUpdated: now,
    };
    return dictionaryCache.terms;
  } catch (err) {
    console.warn('Could not populate search dictionary cache:', err.message);
    return STATIC_CRM_TERMS.map((t) => ({ text: t, category: 'General' }));
  }
};

// Generate typo-tolerant "Did you mean?" suggestions
export const findDidYouMeanSuggestion = async (query = '', hasExactResults = false) => {
  const q = normalizeWhitespace(query).toLowerCase();
  if (q.length < 3) return null;

  const dict = await getCachedDictionary();

  // If there's an exact match in the dictionary, no need for typo suggestion
  const exactTerm = dict.find((item) => item.text.toLowerCase() === q);
  if (exactTerm && hasExactResults) return null;

  let bestMatch = null;
  let minDistance = Infinity;

  for (const item of dict) {
    const term = item.text.toLowerCase();
    if (term === q) continue;

    // Check distance between full strings
    const dist = damerauLevenshteinDistance(q, term);

    // Max allowed distance depends on query length:
    // 3-5 chars: max 1 edit
    // 6+ chars: max 2 edits
    const maxAllowed = q.length <= 5 ? 1 : 2;

    if (dist <= maxAllowed && dist < minDistance) {
      minDistance = dist;
      bestMatch = item;
    }

    // Also check token-by-token if multiword
    if (term.includes(' ') && q.includes(' ')) {
      const qTokens = q.split(' ');
      const termTokens = term.split(' ');
      if (qTokens.length === termTokens.length) {
        let totalTokenDist = 0;
        let validTokens = true;
        for (let i = 0; i < qTokens.length; i++) {
          const tDist = damerauLevenshteinDistance(qTokens[i], termTokens[i]);
          const allowed = qTokens[i].length <= 5 ? 1 : 2;
          if (tDist > allowed) {
            validTokens = false;
            break;
          }
          totalTokenDist += tDist;
        }
        if (validTokens && totalTokenDist <= 2 && totalTokenDist < minDistance) {
          minDistance = totalTokenDist;
          bestMatch = item;
        }
      }
    }
  }

  return bestMatch;
};

// Calculate search relevance score for an item
export const calculateRelevance = (item, query, entityType) => {
  const q = (query || '').toLowerCase();

  const leadIdStr = typeof item.leadId === 'string' ? item.leadId : (item.leadId?.leadId || '');
  const customerIdStr = typeof item.customerId === 'string' ? item.customerId : (item.customerId?.customerId || '');
  const quotationNumberStr = typeof item.quotationNumber === 'string' ? item.quotationNumber : '';

  // 1. Exact ID match (Quotation #, Lead #, Customer #)
  if (
    (quotationNumberStr && quotationNumberStr.toLowerCase() === q) ||
    (leadIdStr && leadIdStr.toLowerCase() === q) ||
    (customerIdStr && customerIdStr.toLowerCase() === q) ||
    (typeof item.identifier === 'string' && item.identifier.toLowerCase() === q)
  ) {
    return 100;
  }

  // 2. Exact phone / email match
  const phone = typeof item.phone === 'string' ? item.phone : '';
  const email = typeof item.email === 'string' ? item.email : '';
  if (
    (phone && phone.replace(/\D/g, '') === q.replace(/\D/g, '')) ||
    (email && email.toLowerCase() === q)
  ) {
    return 95;
  }

  // 3. Exact name match
  const name = String(item.fullName || item.name || item.projectName || item.quotationNumber || '').toLowerCase();
  if (name === q) {
    return 90;
  }

  // 4. Prefix name match
  if (name.startsWith(q)) {
    return 80;
  }

  // 5. Multiword / token contains
  const tokens = q.split(' ').filter(Boolean);
  if (tokens.length > 1 && tokens.every((tok) => name.includes(tok))) {
    return 75;
  }

  // 6. Substring name match
  if (name.includes(q)) {
    return 65;
  }

  // 7. Secondary fields (city, location, projectType, notes)
  const secondary = [
    typeof item.city === 'string' ? item.city : '',
    typeof item.location === 'string' ? item.location : '',
    typeof item.projectType === 'string' ? item.projectType : '',
    typeof item.notes === 'string' ? item.notes : '',
    typeof item.message === 'string' ? item.message : '',
    typeof item.description === 'string' ? item.description : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (secondary.includes(q)) {
    return 40;
  }

  return 20;
};

// MAIN SEARCH SERVICE FUNCTION
export const executeGlobalSearch = async ({
  query = '',
  entityFilter = '',
  limit = 8,
  page = 1,
  user = {},
}) => {
  const normalizedQuery = normalizeWhitespace(query);
  if (!normalizedQuery) {
    return {
      query: '',
      normalizedQuery: '',
      totalCount: 0,
      counts: {},
      results: {},
      suggestions: [],
    };
  }

  const escaped = escapeRegex(normalizedQuery);
  const regex = new RegExp(escaped, 'i');
  const phoneRegex = buildPhoneRegex(normalizedQuery);
  const identifierRegex = buildIdentifierRegex(normalizedQuery);

  // Determine user permissions
  const isSuperUser = user.role === 'Owner' || user.role === 'Admin';
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  const canViewLeads = isSuperUser || permissions.includes('leads.view');
  const canViewCustomers = isSuperUser || permissions.includes('customers.view');
  const canViewQuotations = isSuperUser || permissions.includes('quotations.view');
  const canViewMeasurements = isSuperUser || permissions.includes('measurements.view');
  const canViewStaff = isSuperUser || permissions.includes('staff.view');

  const parsedLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 8));

  // Determine user-scoped lead and customer IDs for staff data isolation
  let userLeadIds = null;
  let userCustIds = null;
  if (!isSuperUser && user?._id) {
    const [uLeads, uCusts] = await Promise.all([
      Lead.find({ assignedTo: user._id, isDeleted: false }).select('_id'),
      Customer.find({ deletedAt: null, $or: [{ assignedStaff: user._id }, { 'projects.assignedStaff': user._id }] }).select('_id'),
    ]);
    userLeadIds = uLeads.map((l) => l._id);
    userCustIds = uCusts.map((c) => c._id);
  }

  // Build async query promises for each supported entity
  const searchPromises = {};

  // 1. LEADS
  if (canViewLeads && (!entityFilter || entityFilter === 'leads')) {
    const leadConditions = [
      { fullName: regex },
      { email: regex },
      { leadId: identifierRegex || regex },
      { city: regex },
      { location: regex },
      { projectType: regex },
      { leadSource: regex },
      { status: regex },
    ];
    if (phoneRegex) {
      leadConditions.push({ phone: phoneRegex });
      leadConditions.push({ alternatePhone: phoneRegex });
    }

    const leadFindQuery = {
      isDeleted: { $ne: true },
      $or: leadConditions,
    };
    if (!isSuperUser && user?._id) {
      leadFindQuery.assignedTo = user._id;
    }

    searchPromises.leads = Lead.find(leadFindQuery)
      .select('leadId fullName phone alternatePhone email city location projectType status budget priority createdAt')
      .limit(parsedLimit)
      .lean();
  }

  // 2. CUSTOMERS
  if (canViewCustomers && (!entityFilter || entityFilter === 'customers')) {
    const customerConditions = [
      { fullName: regex },
      { email: regex },
      { customerId: identifierRegex || regex },
      { city: regex },
      { location: regex },
      { companyName: regex },
      { projectType: regex },
      { status: regex },
    ];
    if (phoneRegex) {
      customerConditions.push({ phone: phoneRegex });
      customerConditions.push({ alternatePhone: phoneRegex });
    }

    const customerFindQuery = {
      deletedAt: null,
      $or: customerConditions,
    };
    if (!isSuperUser && user?._id) {
      customerFindQuery.$and = [
        {
          $or: [
            { assignedStaff: user._id },
            { 'projects.assignedStaff': user._id },
          ],
        },
      ];
    }

    searchPromises.customers = Customer.find(customerFindQuery)
      .select('customerId fullName phone alternatePhone email city location companyName projectType status totalValue createdAt')
      .limit(parsedLimit)
      .lean();
  }

  // 3. PROJECTS (Embedded within Customers)
  if (canViewCustomers && (!entityFilter || entityFilter === 'projects')) {
    const projMatch = { deletedAt: null, 'projects.0': { $exists: true } };
    if (!isSuperUser && user?._id) {
      projMatch.$or = [
        { assignedStaff: user._id },
        { 'projects.assignedStaff': user._id },
      ];
    }
    searchPromises.projects = Customer.aggregate([
      { $match: projMatch },
      { $unwind: '$projects' },
      {
        $match: {
          $or: [
            { 'projects.projectName': regex },
            { 'projects.projectType': regex },
            { 'projects.description': regex },
            { 'projects.status': regex },
          ],
        },
      },
      {
        $project: {
          _id: '$projects._id',
          projectName: '$projects.projectName',
          projectType: '$projects.projectType',
          budget: '$projects.budget',
          status: '$projects.status',
          description: '$projects.description',
          startDate: '$projects.startDate',
          customerId: '$_id',
          customerNumber: '$customerId',
          customerName: '$fullName',
          customerPhone: '$phone',
        },
      },
      { $limit: parsedLimit },
    ]);
  }

  // 4. QUOTATIONS
  if (canViewQuotations && (!entityFilter || entityFilter === 'quotations')) {
    const quotationConditions = [
      { quotationNumber: identifierRegex || regex },
      { customerName: regex },
      { customerEmail: regex },
      { message: regex },
      { 'uploadedFile.fileName': regex },
      { status: regex },
    ];
    const numericVal = Number(normalizedQuery);
    if (!isNaN(numericVal) && numericVal > 0) {
      quotationConditions.push({ amount: numericVal });
    }

    const quotFindQuery = {
      $or: quotationConditions,
    };
    if (!isSuperUser && user?._id) {
      quotFindQuery.$and = [
        {
          $or: [
            { createdBy: user._id },
            { leadId: { $in: userLeadIds || [] } },
          ],
        },
      ];
    }

    searchPromises.quotations = Quotation.find(quotFindQuery)
      .select('quotationNumber amount status customerName customerEmail uploadedFile leadId createdAt')
      .populate('leadId', 'leadId fullName phone')
      .limit(parsedLimit)
      .lean();
  }

  // 5. FOLLOW-UPS
  if ((canViewLeads || canViewCustomers) && (!entityFilter || entityFilter === 'followups')) {
    const followupConditions = [
      { notes: regex },
      { outcome: regex },
      { type: regex },
      { status: regex },
      { priority: regex },
    ];

    const followupFindQuery = {
      $or: followupConditions,
    };
    if (!isSuperUser && user?._id) {
      followupFindQuery.$and = [
        {
          $or: [
            { assignedTo: user._id },
            { createdBy: user._id },
            { leadId: { $in: userLeadIds || [] } },
            { customerId: { $in: userCustIds || [] } },
          ],
        },
      ];
    }

    searchPromises.followups = FollowUp.find(followupFindQuery)
      .select('type status priority scheduledAt completedAt notes outcome leadId customerId createdAt')
      .populate('leadId', 'leadId fullName phone')
      .populate('customerId', 'customerId fullName phone')
      .limit(parsedLimit)
      .lean();
  }

  // 6. MEASUREMENTS
  if (canViewMeasurements && (!entityFilter || entityFilter === 'measurements')) {
    const measurementConditions = [
      { notes: regex },
      { status: regex },
      { 'attachments.fileName': regex },
    ];

    const measFindQuery = {
      $or: measurementConditions,
    };
    if (!isSuperUser && user?._id) {
      measFindQuery.$and = [
        {
          $or: [
            { assignedTo: user._id },
            { conductedBy: user._id },
            { leadId: { $in: userLeadIds || [] } },
          ],
        },
      ];
    }

    searchPromises.measurements = Measurement.find(measFindQuery)
      .select('status scheduledAt notes attachments leadId assignedTo createdAt')
      .populate('leadId', 'leadId fullName phone city location')
      .populate('assignedTo', 'firstName lastName')
      .limit(parsedLimit)
      .lean();
  }

  // 7. DOCUMENTS (Aggregated from Customer.documents and Lead.documents)
  if ((canViewCustomers || canViewLeads) && (!entityFilter || entityFilter === 'documents')) {
    const docAggregations = [];

    if (canViewCustomers) {
      const custDocMatch = { deletedAt: null, 'documents.0': { $exists: true } };
      if (!isSuperUser && userCustIds) {
        custDocMatch._id = { $in: userCustIds };
      }
      docAggregations.push(
        Customer.aggregate([
          { $match: custDocMatch },
          { $unwind: '$documents' },
          {
            $match: {
              $or: [
                { 'documents.name': regex },
                { 'documents.category': regex },
                { 'documents.fileType': regex },
              ],
            },
          },
          {
            $project: {
              _id: '$documents._id',
              name: '$documents.name',
              url: '$documents.url',
              fileType: '$documents.fileType',
              category: '$documents.category',
              uploadedAt: '$documents.uploadedAt',
              sourceType: { $literal: 'customer' },
              sourceId: '$_id',
              sourceNumber: '$customerId',
              sourceName: '$fullName',
            },
          },
          { $limit: parsedLimit },
        ])
      );
    }

    if (canViewLeads) {
      const leadDocMatch = { isDeleted: { $ne: true }, 'documents.0': { $exists: true } };
      if (!isSuperUser && userLeadIds) {
        leadDocMatch._id = { $in: userLeadIds };
      }
      docAggregations.push(
        Lead.aggregate([
          { $match: leadDocMatch },
          { $unwind: '$documents' },
          {
            $match: {
              $or: [
                { 'documents.name': regex },
                { 'documents.type': regex },
              ],
            },
          },
          {
            $project: {
              _id: '$documents._id',
              name: '$documents.name',
              url: '$documents.url',
              fileType: '$documents.type',
              category: { $literal: 'Lead Document' },
              uploadedAt: '$documents.uploadedAt',
              sourceType: { $literal: 'lead' },
              sourceId: '$_id',
              sourceNumber: '$leadId',
              sourceName: '$fullName',
            },
          },
          { $limit: parsedLimit },
        ])
      );
    }

    searchPromises.documents = Promise.all(docAggregations).then((arrays) =>
      arrays.flat().slice(0, parsedLimit)
    );
  }

  // 8. NOTES & ACTIVITIES (Excluded from default search to avoid noisy system audit logs)
  if (entityFilter === 'notes' && (canViewLeads || canViewCustomers)) {
    const actFindQuery = {
      description: regex,
    };
    if (!isSuperUser && user?._id) {
      actFindQuery.$and = [
        {
          $or: [
            { performedBy: user._id },
            { leadId: { $in: userLeadIds || [] } },
            { customerId: { $in: userCustIds || [] } },
          ],
        },
      ];
    }
    searchPromises.notes = Activity.find(actFindQuery)
      .select('type description metadata leadId customerId createdAt')
      .populate('leadId', 'leadId fullName')
      .populate('customerId', 'customerId fullName')
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .lean();
  }

  // 9. STAFF (USERS)
  if (canViewStaff && (!entityFilter || entityFilter === 'staff')) {
    const staffConditions = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { role: regex },
    ];
    if (phoneRegex) {
      staffConditions.push({ phone: phoneRegex });
    }

    searchPromises.staff = User.find({
      deletedAt: null,
      $or: staffConditions,
    })
      .select('firstName lastName email phone role status avatar')
      .limit(parsedLimit)
      .lean();
  }

  // Execute all entity queries concurrently
  const entityKeys = Object.keys(searchPromises);
  const queryResults = await Promise.all(Object.values(searchPromises));

  const results = {};
  const counts = {};
  let totalCount = 0;

  entityKeys.forEach((key, idx) => {
    let items = queryResults[idx] || [];

    // Sort items by relevance score
    items = items.map((item) => ({
      ...item,
      relevanceScore: calculateRelevance(item, normalizedQuery, key),
    }));
    items.sort((a, b) => b.relevanceScore - a.relevanceScore);

    results[key] = items;
    counts[key] = items.length;
    totalCount += items.length;
  });

  // Check for "Did you mean?" suggestions
  const suggestion = await findDidYouMeanSuggestion(normalizedQuery, totalCount > 0);
  const suggestions = suggestion ? [suggestion] : [];

  return {
    query: normalizedQuery,
    normalizedQuery,
    totalCount,
    counts,
    results,
    suggestion: suggestion?.text || null,
    suggestions,
  };
};
