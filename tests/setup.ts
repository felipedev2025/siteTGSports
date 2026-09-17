process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ?? "postgresql://postgres:postgres@localhost:5432/tgsports_test";
process.env.AUTH_SECRET = "test-secret-not-for-production-0123456789";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.ASAAS_WEBHOOK_TOKEN = "test-webhook-token";
