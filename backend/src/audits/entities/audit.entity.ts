import { Course } from "src/courses/entities/course.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Status } from "../enums/status.enum";


@Entity('audits')
export class Audit {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    type: "enum",
    enum: Status,
    default: Status.DRAFT,
  })
  fromStatus: Status

  @Column({
    type: "enum",
    enum: Status,
    default: Status.PENDING_REVIEW,
  })
  toStatus: Status

  @Column({ nullable: true })
  reason?: string

  @Column()
  userId: number

  @Column()
  courseId: number

  @ManyToOne((type) => User, (user) => user.audits, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: 'userId' })
  actor: User

  @ManyToOne((type) => Course, (course) => course.audits, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: 'courseId' })
  entity: Course

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

}
