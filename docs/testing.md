# Testing

To run the unit and integration tests, use the following commands:

```bash
npm run test
```

To run tests in watch mode:

```bash
npm run test:watch
```

## Tools Used
- **Jest**: Test runner and assertion library.
- **Supertest**: HTTP assertion library for testing Express routes.

## Test Structure
- `tests/integration/`: Contains integration tests for API endpoints (e.g., authentication).
- Tests connect to the database configured in the `.env` file (ensure it's safe for testing or use a dedicated test DB).
