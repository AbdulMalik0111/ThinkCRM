# ThinkCRM Backend

This is the complete production-ready backend for the ThinkCRM system.

## Stack
- Node.js
- Express.js
- MongoDB / Mongoose
- JavaScript (ES Modules)

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```

3. **Database Setup**
   Ensure MongoDB is running locally or provide a remote `MONGODB_URI` in your `.env`.

4. **Seed Database**
   Seed the initial users and roles:
   ```bash
   npm run seed
   ```

5. **Start the Server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## Testing
Run tests using Jest:
```bash
npm test
```

## Documentation
- API Documentation (Swagger) is available at `/api/docs` when the server is running.
- Internal documentation is available in the `docs/` folder.
