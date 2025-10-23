import { Module } from '@nestjs/common';
import { ProgressesService } from './progresses.service';
import { ProgressesController } from './progresses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from 'src/lessons/entities/lesson.entity';
import { User } from 'src/users/entities/user.entity';
import { Progress } from './entities/progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Progress, Lesson, User])],
  controllers: [ProgressesController],
  providers: [ProgressesService],
})
export class ProgressesModule {}
