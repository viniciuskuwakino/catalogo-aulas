import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Role } from 'src/users/enums/role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { Repository } from 'typeorm';
import { Course } from 'src/courses/entities/course.entity';
import { User } from 'src/users/entities/user.entity';
import { Status } from 'src/courses/enums/status.enum';

@Injectable()
export class EnrollmentsService {

  constructor (
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateEnrollmentDto, role: Role) {
    const course = await this.courseRepository.findOneBy({ id: dto.courseId });
    const user = await this.userRepository.findOneBy({ id: dto.userId });

    if (!course || !user) {
      throw new NotFoundException('User or course not found');
    }

    if (course.status !== Status.PUBLISHED) {
      throw new BadRequestException('Course not published');
    }

    const alreadyEnrolled = await this.enrollmentRepository.findOne({
      where: {
        course: { id: course.id },
        user: { id: user.id }
      },
    });

    if (alreadyEnrolled) {
      throw new ConflictException('User already enrolled in this course');
    }

    const enrollment = this.enrollmentRepository.create({ ...dto });

    return await this.enrollmentRepository.save(enrollment);
  }

  findAll() {
    return `This action returns all enrollments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} enrollment`;
  }

  update(id: number, updateEnrollmentDto: UpdateEnrollmentDto) {
    return `This action updates a #${id} enrollment`;
  }

  remove(id: number) {
    return `This action removes a #${id} enrollment`;
  }
}
