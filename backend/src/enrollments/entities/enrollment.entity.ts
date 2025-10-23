import { Course } from "src/courses/entities/course.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  userId: number

  @Column()
  courseId: number

  @ManyToOne((type) => User, (user) => user.enrollments, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: 'userId' })
  user: User

  @ManyToOne((type) => Course, (course) => course.enrollments, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: 'courseId' })
  course: Course

  @CreateDateColumn()
  createdAt: Date

}
