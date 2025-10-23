import { Test, TestingModule } from '@nestjs/testing';
import { LessonsService } from './lessons.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Lesson } from './entities/lesson.entity';
import { Course } from 'src/courses/entities/course.entity';

const mockLessonRepository = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  softRemove: jest.fn(),
};

const mockCourseRepository = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
};

describe('LessonsService', () => {
  let service: LessonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        {
          provide: getRepositoryToken(Lesson),
          useValue: mockLessonRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
