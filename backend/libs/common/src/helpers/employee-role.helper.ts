import { EmployeeRole } from '../enums/employee-role.enum.js';

export function canManageEmployeeRole(
  actorRole: EmployeeRole,
  targetRole: EmployeeRole,
): boolean {
  if (actorRole === EmployeeRole.ADMIN) {
    return targetRole === EmployeeRole.HRD || targetRole === EmployeeRole.EMPLOYEE;
  }

  return actorRole === EmployeeRole.HRD && targetRole === EmployeeRole.EMPLOYEE;
}
