import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Employee } from './employee.entity.js';

export enum ActivationTokenPurpose {
  ACTIVATION_ACCOUNT = 'activation_account',
  RESET_PASSWORD = 'reset_password',
}

@Entity('employee_activation_tokens')
export class ActivationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  token_hash: string;

  @Column({
    type: 'enum',
    enum: ActivationTokenPurpose,
    default: ActivationTokenPurpose.ACTIVATION_ACCOUNT,
  })
  purpose: ActivationTokenPurpose;

  @Column()
  employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ type: 'datetime', nullable: true })
  used_at: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
