export default () => ({
  JWT_SECRET: process.env.JWT_SECRET ?? 'supersecretjwtkey',

  app: {
    port: Number(
      process.env.EMPLOYEE_SERVICE_PORT ??
        process.env.EMPLOYEE_PORT ??
        3002,
    ),
  },

  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    name: process.env.EMPLOYEE_DB_NAME ?? 'master_employee_db',
  },

  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001/api',
    },
  },
});
