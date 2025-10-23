import { Test, TestingModule } from '@nestjs/testing';
import { ProgressesService } from './progresses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Progress } from './entities/progress.entity';
import { User } from 'src/users/entities/user.entity';
import { Lesson } from 'src/lessons/entities/lesson.entity';
import { Role } from 'src/users/enums/role.enum';
import { ForbiddenException } from '@nestjs/common';

const mockProgressRepository = {
  findAndCount: jest.fn(),
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
};

const mockUserRepository = {
  findOneBy: jest.fn(),
};

const mockLessonRepository = {
  findOne: jest.fn(),
};

describe('ProgressesService', () => {
  let service: ProgressesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressesService,
        { provide: getRepositoryToken(Progress), useValue: mockProgressRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Lesson), useValue: mockLessonRepository },
      ],
    }).compile();

    service = module.get<ProgressesService>(ProgressesService);
    jest.clearAllMocks();
  });

  it('paginates progresses for admins', async () => {
    const progresses = [{ id: 1 } as Progress];
    mockProgressRepository.findAndCount.mockResolvedValue([progresses, 4]);

    const result = await service.findAll(1, Role.ADMIN, { page: 2, limit: 2 });

    expect(mockProgressRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 2,
        take: 2,
      }),
    );

    expect(result).toEqual({
      data: progresses,
      meta: {
        total: 4,
        page: 2,
        limit: 2,
        lastPage: 2,
      },
    });
  });

  it('paginates progresses for students filtered by user', async () => {
    const progresses = [{ id: 2 } as Progress];
    mockProgressRepository.findAndCount.mockResolvedValue([progresses, 1]);

    const result = await service.findAll(42, Role.STUDENT, { page: 1, limit: 10 });

    expect(mockProgressRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 42 },
        skip: 0,
        take: 10,
      }),
    );

    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      lastPage: 1,
    });
  });

  it('throws when role is not permitted to list progresses', async () => {
    await expect(
      service.findAll(10, Role.INSTRUCTOR, { page: 1, limit: 5 }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockProgressRepository.findAndCount).not.toHaveBeenCalled();
  });
});
