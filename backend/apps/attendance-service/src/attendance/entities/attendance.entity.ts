import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum LeaveType {
  SICK = 'sick',
  PERSONAL = 'personal',
}

export enum WorkType {
  WFO = 'wfo',
  WFH = 'wfh',
}

export type AttendanceType = WorkType | LeaveType;
export const AttendanceType = { ...WorkType, ...LeaveType } as const;

@Entity('employee_attendances')
@Index(['employee_id', 'date'], { unique: true })
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  employee_id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'enum',
    enum: AttendanceType,
  })
  type: AttendanceType;

  @Column({ type: 'datetime', nullable: true })
  clock_in: Date | null;

  @Column({ type: 'datetime', nullable: true })
  clock_out: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_path: string | null;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
