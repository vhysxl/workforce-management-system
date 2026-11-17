export default () => ({
  app: {
    port: Number(
      process.env.AUTH_SERVICE_PORT ?? process.env.PORT ?? 3001,
    ),
  },

  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    name:
      process.env.AUTH_DB_NAME ??
      process.env.DB_NAME ??
      'workforce_auth',
  },

  services: {
    employee: {
      url: process.env.EMPLOYEE_SERVICE_URL ?? 'http://localhost:3002/api',
    },
  },
});
