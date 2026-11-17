import { EmployeeRole } from '@app/common';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    unique: true,
    select: false,
  })
  nik: string;

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

  @Column({ type: 'datetime', nullable: true })
  activated_at: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  deactivated_at: Date | null;
}
