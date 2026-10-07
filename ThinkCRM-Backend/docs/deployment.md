# Deployment

The application is a standard Node.js server and can be deployed anywhere Node is supported.

## Requirements
- Node.js >= 18
- MongoDB instance (e.g., MongoDB Atlas)
- Cloudinary account for file storage
- SMTP provider (e.g., SendGrid, Mailgun) for emails

## Steps
1. Clone the repository on the production server.
2. Install dependencies: `npm install --omit=dev`
3. Configure `.env` with production variables (e.g., `NODE_ENV=production`).
4. Start the server using a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "thinkcrm-backend"
   ```

## Environment Variables
Ensure the following are set in production:
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLOUDINARY_*` keys
- `SMTP_*` keys
- `META_*` keys for integration
