import type { FormEvent } from 'react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import type { EmployeeDetail, EmployeeInput, EmployeeRole, ManagerRole } from '../lib/employees';

interface EmployeeFormProps {
  employee?: EmployeeDetail;
  actorRole: ManagerRole;
  readOnly: boolean;
  isSaving: boolean;
  onSubmit: (data: EmployeeInput) => void;
  onCancel: () => void;
}

export default function EmployeeForm({ employee, actorRole, readOnly, isSaving, onSubmit, onCancel }: EmployeeFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      full_name: String(form.get('full_name')),
      email: String(form.get('email')),
      nik: String(form.get('nik')),
      phone_number: String(form.get('phone_number')),
      role: form.get('role') as EmployeeRole,
      address: String(form.get('address')) || null,
      birth_place: String(form.get('birth_place')),
      birth_date: String(form.get('birth_date')),
      marital_status: String(form.get('marital_status')) || null,
      religion: String(form.get('religion')) || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset disabled={readOnly || isSaving} className="grid gap-5 sm:grid-cols-2 disabled:opacity-70">
        <Input id="employee-name" name="full_name" label="Full name" required maxLength={150} defaultValue={employee?.full_name} />
        <Input id="employee-email" name="email" type="email" label="Email" required maxLength={150} defaultValue={employee?.email} />
        <Input id="employee-nik" name="nik" label="NIK" required inputMode="numeric" pattern="[0-9]{16}" minLength={16} maxLength={16} title="NIK must contain exactly 16 digits" defaultValue={employee?.nik} />
        <Input id="employee-phone" name="phone_number" type="tel" label="Phone number" required maxLength={20} defaultValue={employee?.phone_number} />
        <Input id="employee-birth-place" name="birth_place" label="Birth place" required maxLength={255} defaultValue={employee?.birth_place} />
        <Input id="employee-birth-date" name="birth_date" type="date" label="Birth date" required defaultValue={employee?.birth_date} />
        <Select id="employee-role" name="role" label="Role" required defaultValue={employee?.role ?? 'employee'}>
          <option value="employee">Employee</option>
          <option value="hrd" disabled={actorRole !== 'admin'}>HRD</option>
          <option value="admin" disabled>Admin</option>
        </Select>
        <Select id="employee-marital-status" name="marital_status" label="Marital status" defaultValue={employee?.marital_status ?? ''}>
          <option value="">Not specified</option>
          <option value="single">Single</option>
          <option value="married">Married</option>
          <option value="divorced">Divorced</option>
          <option value="widowed">Widowed</option>
        </Select>
        <Select id="employee-religion" name="religion" label="Religion" defaultValue={employee?.religion ?? ''}>
          <option value="">Not specified</option>
          <option value="islam">Islam</option>
          <option value="christian">Christian</option>
          <option value="catholic">Catholic</option>
          <option value="hindu">Hindu</option>
          <option value="buddhist">Buddhist</option>
          <option value="confucian">Confucian</option>
          <option value="other">Other</option>
        </Select>
        <div className="sm:col-span-2">
          <label htmlFor="employee-address" className="block text-sm font-medium mb-1.5">Address</label>
          <textarea id="employee-address" name="address" rows={3} maxLength={500} defaultValue={employee?.address ?? ''} className="w-full px-4 py-2.5 rounded-lg bg-supporting-2 focus:outline-none focus:ring-1 focus:ring-tertiary" />
        </div>
      </fieldset>
      {!readOnly && (
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>Cancel</Button>
          <Button type="submit" isLoading={isSaving}>{employee ? 'Save changes' : 'Create employee'}</Button>
        </div>
      )}
    </form>
  );
}
