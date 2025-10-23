import { Course } from "src/courses/entities/course.entity";
import { Progress } from "src/progresses/entities/progress.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column()
  durationMinutes: number

  @Column()
  videoUrl: string

  @Column()
  order: number

  @Column()
  isLocked: boolean

  @Column()
  courseId: number

  @ManyToOne((type) => Course, (course) => course.lessons, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: 'courseId' })
  course: Course

  @OneToMany((type) => Progress, (progress) => progress.lesson, {
    cascade: true,
  })
  progresses: Progress[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date

}
