import { Audit } from "src/audits/entities/audit.entity";
import { Course } from "src/courses/entities/course.entity";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { Progress } from "src/progresses/entities/progress.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "../enums/role.enum";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column({ select: false })
  password: string

  @Column({
    type: "enum",
    enum: Role,
    default: Role.STUDENT,
  })
  role: Role

  @OneToMany((type) => Course, (course) => course.createdBy, {
    cascade: true,
  })
  courses: Course[]

  @OneToMany((type) => Enrollment, (enrollment) => enrollment.user)
  enrollments: Enrollment[]

  @OneToMany((type) => Progress, (progress) => progress.user, {
    cascade: true,
  })
  progresses: Progress[]

  @OneToMany((type) => Audit, (audit) => audit.actor, {
    cascade: true,
  })
  audits: Audit[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date

}
