# Architecture

The CRM Backend is built using a modern 3-layer architecture:

1. **Routes**: Define the API endpoints and map them to controllers. They also apply middlewares for authentication, authorization, and validation.
2. **Controllers**: Handle HTTP requests and responses. They are thin and delegate business logic to services.
3. **Services**: Contain the core business logic. They interact with repositories or Mongoose models directly.

## Modules
- **Authentication**: JWT-based stateless authentication.
- **Leads**: Central entity of the CRM. Manages customer inquiries, statuses, and follow-ups.
- **Follow-ups**: Scheduled tasks to contact leads.
- **Measurements**: Capture physical dimensions for projects.
- **Quotations**: PDF document handling and email delivery.
- **Customers**: Converted leads.
