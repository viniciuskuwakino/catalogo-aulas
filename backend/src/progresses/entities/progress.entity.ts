import { Lesson } from "src/lessons/entities/lesson.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('progresses')
export class Progress {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  watchedSeconds: number

  @Column({ default: false })
  completed: boolean

  @Column()
  userId: number

  @Column()
  lessonId: number

  @ManyToOne((type) => User, (user) => user.progresses, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: 'userId' })
  user: User

  @ManyToOne((type) => Lesson, (lesson) => lesson.progresses, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date
}
