import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/users/enums/role.enum';
import { Status } from './enums/status.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { buildPaginatedResult } from 'src/common/utils/pagination.util';

@Injectable()
export class CoursesService {

  constructor (
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(dto: CreateCourseDto, role: Role) {
    const isInstructor = role === Role.INSTRUCTOR;

    if (isInstructor) {
      delete dto?.publishedAt
    }

    const course = this.courseRepository.create({
      ...dto,
      status: isInstructor ? Status.DRAFT : dto.status
    });

    return await this.courseRepository.save(course);
  }

  async findAll(userId: number, role: Role, { page = 1, limit = 10 }: PaginationQueryDto) {
    if (userId == null) {
      throw new BadRequestException('userId is required');
    }

    const take = limit;
    const skip = (page - 1) * take;

    if (role === Role.ADMIN) {
      const [courses, total] = await this.courseRepository.findAndCount({
        relations: {
          createdBy: true,
          enrollments: {
            user: true
          },
          lessons: true,
          audits: true,
        },
        order: {
          createdAt: 'DESC',
        },
        skip,
        take,
      });

      return buildPaginatedResult(courses, total, page, take);
    }

    if (role === Role.STUDENT) {
      const [courses, total] = await this.courseRepository.findAndCount({
        where: { status: Status.PUBLISHED },
        relations: {
          createdBy: true,
          lessons: true,
        },
        order: {
          createdAt: 'DESC',
        },
        skip,
        take,
      });

      return buildPaginatedResult(courses, total, page, take);
    }

    const [courses, total] = await this.courseRepository.findAndCount({
      where: { userId },
      relations: {
        createdBy: true,
        enrollments: true,
        lessons: true,
        audits: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take,
    });

    return buildPaginatedResult(courses, total, page, take);
  }

  async findOne(id: number, userId: number, role: Role) {
    if (userId == null) {
      throw new BadRequestException('userId is required');
    }

    if (role === Role.ADMIN) {
      return await this.courseRepository.findOne({
        where: { id },
        relations: {
          createdBy: true,
          enrollments: {
            user: true
          },
          lessons: true,
          audits: true
        }
      });
    }

    if (role === Role.STUDENT) {
      return await this.courseRepository.findOne({
        where: {
          id,
          status: Status.PUBLISHED
        },
        relations: {
          createdBy: true,
          lessons: true
        }
      });
    }

    return await this.courseRepository.findOne({
      where: {
        id,
        userId
      },
      relations: {
        createdBy: true,
        enrollments: true,
        lessons: true,
        audits: true
      }
    })
  }

  async update(courseId: number, dto: UpdateCourseDto, role: Role) {
    const course = await this.courseRepository.findOneBy({ id: courseId });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (role === Role.INSTRUCTOR && course.userId !== dto.userId) {
      throw new ForbiddenException('You can\'t edit others user\'s courses.');
    }

    if (role === Role.INSTRUCTOR) {
      delete dto.status;
      delete dto.publishedAt;
    }

    this.courseRepository.merge(course, dto);

    return await this.courseRepository.save(course);
  }

  async remove(id: number) {
    const course = await this.courseRepository.findOneBy({ id });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.courseRepository.softRemove(course);
  }
}
