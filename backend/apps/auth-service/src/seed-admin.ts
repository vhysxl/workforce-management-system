import { EmployeeRole } from '@app/common';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';

import { EmployeeAuthCredential } from './auth/entities/employee-auth-credential.entity.js';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const email = 'admin@company.com';
  const passwordHash = await argon2.hash('Admin123*');
  const credentialRepository = dataSource.getRepository(EmployeeAuthCredential);
  const credential = await credentialRepository.findOneBy({ email });
  const employeeDatabase = dataSource.driver.escape(
    process.env.EMPLOYEE_DB_NAME ?? 'master_employee_db',
  );
  const employeeTable = `${employeeDatabase}.employees`;
  const [employee] = await dataSource.query<{ id: string }[]>(
    `SELECT id FROM ${employeeTable} WHERE email = ?`,
    [email],
  );
  const employeeId = employee?.id ?? credential?.employee_id ?? randomUUID();

  if (employee) {
    await dataSource.query(
      `UPDATE ${employeeTable}
       SET role = ?, activated_at = COALESCE(activated_at, CURRENT_TIMESTAMP),
           deactivated_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [EmployeeRole.ADMIN, employeeId],
    );
  } else {
    await dataSource.query(
      `INSERT INTO ${employeeTable}
       (id, full_name, email, nik, phone_number, role, birth_place, birth_date,
        activated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        employeeId,
        'Admin',
        email,
        '0000000000000001',
        '080000000000',
        EmployeeRole.ADMIN,
        'Jakarta',
        '1990-01-01',
      ],
    );
  }

  await credentialRepository.save({
    id: credential?.id,
    employee_id: employeeId,
    email,
    password_hash: passwordHash,
    refresh_token_hash: null,
    role: EmployeeRole.ADMIN,
    is_active: true,
  });
}
