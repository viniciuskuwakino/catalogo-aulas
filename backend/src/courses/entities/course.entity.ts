import { Audit } from "src/audits/entities/audit.entity"
import { Enrollment } from "src/enrollments/entities/enrollment.entity"
import { Lesson } from "src/lessons/entities/lesson.entity"
import { User } from "src/users/entities/user.entity"
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Language } from "../enums/language.enum"
import { Status } from "../enums/status.enum"

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column()
  summary: string

  @Column({
    type: "enum",
    enum: Language,
    default: Language.PT,
  })
  language: Language

  @Column({
    type: "enum",
    enum: Status,
    default: Status.DRAFT,
  })
  status: Status

  @Column()
  userId: number

  @ManyToOne((type) => User, (user) => user.courses, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: 'userId' })
  createdBy: User

  @OneToMany((type) => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[]

  @OneToMany((type) => Lesson, (lesson) => lesson.course, {
    cascade: true,
  })
  lessons: Lesson[]

  @OneToMany((type) => Audit, (audit) => audit.entity, {
    cascade: true,
  })
  audits: Audit[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ nullable: true, default: null })
  publishedAt?: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date

}
