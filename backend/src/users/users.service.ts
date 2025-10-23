import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { buildPaginatedResult } from 'src/common/utils/pagination.util';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(dto: CreateUserDto) {
    const salt = process.env.BCRYPT_SALT || 'salt';
    const hash = await bcrypt.hash(dto.password, salt);
    const user = this.userRepository.create({
      ...dto,
      password: hash
    });

    return await this.userRepository.save(user);
  }

  async findAll({ page = 1, limit = 10 }: PaginationQueryDto) {
    const take = limit;
    const skip = (page - 1) * take;

    const [users, total] = await this.userRepository.findAndCount({
      relations: {
        courses: true,
        enrollments: true,
        progresses: true,
        audits: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take,
    });

    return buildPaginatedResult(users, total, page, take);
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role']
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        courses: true,
        enrollments: true,
        progresses: true,
        audits: true
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.password) {
      const salt = process.env.BCRYPT_SALT || 'salt';
      dto.password = await bcrypt.hash(dto.password, salt);
    }

    this.userRepository.merge(user, dto);

    return await this.userRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepository.softRemove(user);
  }
}
