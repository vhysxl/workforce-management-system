import { ActivationTokenPurpose } from '@app/common';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('activation_tokens')
export class ActivationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  token_hash: string;

  @Column({
    type: 'enum',
    enum: ActivationTokenPurpose,
    default: ActivationTokenPurpose.ACTIVATION_ACCOUNT,
  })
  purpose: ActivationTokenPurpose;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  employee_id: string;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ type: 'datetime', nullable: true })
  used_at: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
