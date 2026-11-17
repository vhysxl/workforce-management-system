export default () => ({
  JWT_SECRET: process.env.JWT_SECRET ?? 'supersecretjwtkey',

  app: {
    port: Number(
      process.env.ATTENDANCE_SERVICE_PORT ??
        process.env.ATTENDANCE_PORT ??
        3003,
    ),
    uploadDir: process.env.UPLOAD_DIR ?? './uploads/attendance',
  },

  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    name: process.env.ATTENDANCE_DB_NAME ?? 'workforce_attendance',
  },
});
