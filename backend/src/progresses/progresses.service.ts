import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Progress } from './entities/progress.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Lesson } from 'src/lessons/entities/lesson.entity';
import { Role } from 'src/users/enums/role.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { buildPaginatedResult } from 'src/common/utils/pagination.util';

@Injectable()
export class ProgressesService {

  constructor (
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
  ) {}
  
  async create(dto: CreateProgressDto, role: Role) {
    if (role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can register lesson progress.');
    }

    const user = await this.userRepository.findOneBy({ id: dto.userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const lesson = await this.lessonRepository.findOne({
      where: { id: dto.lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const existingProgress = await this.progressRepository.findOne({
      where: {
        userId: dto.userId,
        lessonId: dto.lessonId,
      },
    });

    if (existingProgress) {
      throw new ConflictException('Progress for this lesson already exists.');
    }

    const completed = dto.completed ?? dto.watchedSeconds >= lesson.durationMinutes * 60;

    const progress = this.progressRepository.create({
      ...dto,
      completed,
    });

    return await this.progressRepository.save(progress);
  }

  async findAll(userId: number, role: Role, { page = 1, limit = 10 }: PaginationQueryDto) {
    const take = limit;
    const skip = (page - 1) * take;

    if (role === Role.ADMIN) {
      const [progresses, total] = await this.progressRepository.findAndCount({
        relations: {
          user: true,
          lesson: true,
        },
        order: {
          createdAt: 'DESC',
        },
        skip,
        take,
      });

      return buildPaginatedResult(progresses, total, page, take);
    }

    if (role === Role.STUDENT) {
      const [progresses, total] = await this.progressRepository.findAndCount({
        where: { userId },
        relations: {
          user: true,
          lesson: true,
        },
        order: {
          createdAt: 'DESC',
        },
        skip,
        take,
      });

      return buildPaginatedResult(progresses, total, page, take);
    }

    throw new ForbiddenException('You are not allowed to list progresses.');
  }

  findOne(id: number) {
    return `This action returns a #${id} progress`;
  }

  async update(id: number, dto: UpdateProgressDto) {
    const progress = await this.progressRepository.findOneBy({ id });

    if (!progress) {
      throw new NotFoundException('Progress not found');
    }

    if (dto.lessonId && dto.lessonId !== progress.lessonId) {
      const lesson = await this.lessonRepository.findOne({
        where: { id: dto.lessonId },
      });

      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }
    }

    const targetWatchedSeconds = dto.watchedSeconds ?? progress.watchedSeconds;
    const targetLessonId = dto.lessonId ?? progress.lessonId;

    const targetLesson = await this.lessonRepository.findOne({
      where: { id: targetLessonId },
    });

    if (!targetLesson) {
      throw new NotFoundException('Lesson not found');
    }

    const completed = dto.completed ?? targetWatchedSeconds >= targetLesson.durationMinutes * 60;

    this.progressRepository.merge(progress, dto, {
      completed,
      watchedSeconds: targetWatchedSeconds,
      lessonId: targetLessonId,
    });

    return await this.progressRepository.save(progress);
  }

  async remove(id: number) {
    const progress = await this.progressRepository.findOne({
      where: { id },
    });

    if (!progress) {
      throw new NotFoundException('Progress not found');
    }

    return await this.progressRepository.softRemove(progress);
  }
}
