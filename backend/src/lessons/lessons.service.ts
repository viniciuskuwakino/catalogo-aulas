import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Lesson } from './entities/lesson.entity';
import { Repository } from 'typeorm';
import { Course } from 'src/courses/entities/course.entity';
import { Role } from 'src/users/enums/role.enum';

@Injectable()
export class LessonsService {

  constructor (
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}
  
  async create(dto: CreateLessonDto, userId: number, role: Role) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const course = await this.courseRepository.findOne({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('You can\'t add lessons to courses you do not own.');
    }

    const lessonWithSameOrder = await this.lessonRepository.findOne({
      where: {
        courseId: dto.courseId,
        order: dto.order,
      },
    });

    if (lessonWithSameOrder) {
      throw new ConflictException('There is already a lesson with this order in the course.');
    }

    const lesson = this.lessonRepository.create({ ...dto });

    return await this.lessonRepository.save(lesson);
  }

  findAll() {
    return `This action returns all lessons`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lesson`;
  }

  async update(id: number, dto: UpdateLessonDto, userId: number, role: Role) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const lesson = await this.lessonRepository.findOne({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const currentCourse = await this.courseRepository.findOne({
      where: { id: lesson.courseId },
    });

    if (!currentCourse) {
      throw new NotFoundException('Course not found');
    }

    if (currentCourse.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('You can\'t edit lessons of courses you do not own.');
    }

    let targetCourse = currentCourse;

    if (dto.courseId && dto.courseId !== lesson.courseId) {
      const newCourse = await this.courseRepository.findOne({
        where: { id: dto.courseId },
      });

      if (!newCourse) {
        throw new NotFoundException('Course not found');
      }

      if (newCourse.userId !== userId) {
        throw new ForbiddenException('You can\'t move lessons to courses you do not own.');
      }

      targetCourse = newCourse;
    }

    const targetOrder = dto.order ?? lesson.order;
    const orderChanged = dto.order !== undefined && dto.order !== lesson.order;
    const courseChanged = targetCourse.id !== lesson.courseId;

    if (orderChanged || courseChanged) {
      const lessonWithSameOrder = await this.lessonRepository.findOne({
        where: {
          courseId: targetCourse.id,
          order: targetOrder,
        },
      });

      if (lessonWithSameOrder && lessonWithSameOrder.id !== lesson.id) {
        throw new ConflictException('There is already a lesson with this order in the course.');
      }
    }

    this.lessonRepository.merge(lesson, dto, { courseId: targetCourse.id, order: targetOrder });

    return await this.lessonRepository.save(lesson);
  }

  async remove(id: number) {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return await this.lessonRepository.softRemove(lesson);
  }
}
