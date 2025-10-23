import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Role } from 'src/users/enums/role.enum';
import { Status } from './enums/status.enum';

const mockCourseRepository = {
  findAndCount: jest.fn(),
};

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    jest.clearAllMocks();
  });

  it('paginates results for admins', async () => {
    const courses = [{ id: 1 } as Course];
    mockCourseRepository.findAndCount.mockResolvedValue([courses, 3]);

    const result = await service.findAll(10, Role.ADMIN, { page: 2, limit: 1 });

    expect(mockCourseRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 1,
        take: 1,
      }),
    );

    expect(result).toEqual({
      data: courses,
      meta: {
        total: 3,
        page: 2,
        limit: 1,
        lastPage: 3,
      },
    });
  });

  it('returns published courses for students', async () => {
    const courses = [{ id: 2 } as Course];
    mockCourseRepository.findAndCount.mockResolvedValue([courses, 2]);

    const result = await service.findAll(5, Role.STUDENT, { page: 1, limit: 2 });

    expect(mockCourseRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: Status.PUBLISHED },
        skip: 0,
        take: 2,
      }),
    );

    expect(result.meta).toEqual({
      total: 2,
      page: 1,
      limit: 2,
      lastPage: 1,
    });
  });

  it('filters courses by user for instructors', async () => {
    const courses = [{ id: 3, userId: 88 } as Course];
    mockCourseRepository.findAndCount.mockResolvedValue([courses, 1]);

    const result = await service.findAll(88, Role.INSTRUCTOR, { page: 3, limit: 5 });

    expect(mockCourseRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 88 },
        skip: 10,
        take: 5,
      }),
    );

    expect(result.meta).toEqual({
      total: 1,
      page: 3,
      limit: 5,
      lastPage: 1,
    });
  });
});
