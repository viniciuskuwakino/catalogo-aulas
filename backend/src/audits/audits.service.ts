import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Audit } from './entities/audit.entity';
import { Repository } from 'typeorm';
import { Course } from 'src/courses/entities/course.entity';
import { Role } from 'src/users/enums/role.enum';
import { Status } from './enums/status.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { buildPaginatedResult } from 'src/common/utils/pagination.util';

@Injectable()
export class AuditsService {

  constructor (
    @InjectRepository(Audit)
    private readonly auditRepository: Repository<Audit>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>
  ) {}
  
  async create(dto: CreateAuditDto, role: Role) {
    const course = await this.courseRepository.findOneBy({
      id: dto.courseId,
    });
   
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    let fromStatus = course.status;
    let toStatus = dto.toStatus;

    if (role === Role.INSTRUCTOR) {
      fromStatus = Status.DRAFT;
      toStatus = Status.PENDING_REVIEW;
    } else if (role === Role.ADMIN) {
      fromStatus = dto.fromStatus ?? course.status;
    }

    if (!toStatus) {
      throw new BadRequestException('toStatus must be provided');
    }

    course.status = toStatus;

    if (toStatus === Status.PUBLISHED) {
      course.publishedAt = new Date()
    }

    await this.courseRepository.save(course);

    const audit = this.auditRepository.create({
      ...dto,
      fromStatus,
      toStatus
    });

    return await this.auditRepository.save(audit);
  }

  async findAll({ page = 1, limit = 10 }: PaginationQueryDto) {
    const take = limit;
    const skip = (page - 1) * take;

    const [audits, total] = await this.auditRepository.findAndCount({
      relations: {
        actor: true,
        entity: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take,
    });

    return buildPaginatedResult(audits, total, page, take);
  }

  async findOne(id: number) {
    const audit = await this.auditRepository.findOne({
      where: { id },
      relations: {
        actor: true,
        entity: true
      }
    });

    if (!audit) {
      throw new NotFoundException('Audit not found');
    }

    return audit;
  }

  async update(id: number, dto: UpdateAuditDto) {
    const audit = await this.auditRepository.findOneBy({ id });

    if (!audit) {
      throw new NotFoundException('Audit not found');
    }

    this.auditRepository.merge(audit, dto);

    const course = await this.courseRepository.findOneBy({
      id: audit.courseId
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (dto.toStatus) {
      course.status = dto.toStatus;
      await this.courseRepository.save(course);
    }

    return await this.auditRepository.save(audit);
  }

  async remove(id: number) {
    const audit = await this.auditRepository.findOneBy({ id });

    if (!audit) {
      throw new NotFoundException('Course not found');
    }

    return this.auditRepository.remove(audit);
  }
}
