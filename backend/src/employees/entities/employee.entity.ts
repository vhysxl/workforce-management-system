import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EmployeeRole {
  EMPLOYEE = 'employee',
  HRD = 'hrd',
  ADMIN = 'admin',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
}

export enum Religion {
  ISLAM = 'islam',
  CHRISTIAN = 'christian',
  CATHOLIC = 'catholic',
  HINDU = 'hindu',
  BUDDHIST = 'buddhist',
  CONFUCIAN = 'confucian',
  OTHER = 'other',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  full_name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password_hash: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    unique: true,
    nullable: true,
    select: false,
  })
  nik: string | null;

  @Column({ type: 'varchar', length: 20 })
  phone_number: string;

  @Column({
    type: 'enum',
    enum: EmployeeRole,
    default: EmployeeRole.EMPLOYEE,
  })
  role: EmployeeRole;

  @Column()
  birth_place: string;

  @Column({ type: 'date' })
  birth_date: string;

  @Column({
    type: 'enum',
    enum: MaritalStatus,
    nullable: true,
  })
  marital_status: MaritalStatus | null;

  @Column({
    type: 'enum',
    enum: Religion,
    nullable: true,
  })
  religion: Religion | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  deactivated_at: Date | null;
}
