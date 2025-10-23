import { Test, TestingModule } from '@nestjs/testing';
import { AuditsService } from './audits.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Audit } from './entities/audit.entity';
import { Course } from 'src/courses/entities/course.entity';
import { Role } from 'src/users/enums/role.enum';
import { Status } from './enums/status.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

type MockRepository<T = any> = {
  findOneBy: jest.Mock;
  findOne?: jest.Mock;
  findAndCount?: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

function createMockRepository<T = any>(): MockRepository<T> {
  return {
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
}

describe('AuditsService', () => {
  let service: AuditsService;
  let auditRepository: MockRepository<Audit>;
  let courseRepository: MockRepository<Course>;

  beforeEach(async () => {
    auditRepository = createMockRepository<Audit>();
    courseRepository = createMockRepository<Course>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditsService,
        {
          provide: getRepositoryToken(Audit),
          useValue: auditRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
      ],
    }).compile();

    service = module.get<AuditsService>(AuditsService);
  });

  describe('create (publish flow)', () => {
    it('throws NotFoundException when course does not exist', async () => {
      courseRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.create({ courseId: 123, userId: 1 }, Role.ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(courseRepository.findOneBy).toHaveBeenCalledWith({ id: 123 });
      expect(courseRepository.save).not.toHaveBeenCalled();
      expect(auditRepository.save).not.toHaveBeenCalled();
    });

    it('moves instructor course from draft to pending_review and clears publishedAt', async () => {
      const course = { id: 10, status: Status.DRAFT, publishedAt: undefined };

      courseRepository.findOneBy.mockResolvedValue(course);
      courseRepository.save.mockImplementation(async (entity) => entity);
      auditRepository.create.mockImplementation((payload) => payload);
      auditRepository.save.mockImplementation(async (payload) => payload);

      const result = await service.create(
        { courseId: 10, userId: 77 },
        Role.INSTRUCTOR,
      );

      expect(courseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 10,
          status: Status.PENDING_REVIEW,
          publishedAt: undefined,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          fromStatus: Status.DRAFT,
          toStatus: Status.PENDING_REVIEW,
          courseId: 10,
          userId: 77,
        }),
      );
    });

    it('allows admin to publish course and sets publishedAt timestamp', async () => {
      const course = { id: 20, status: Status.PENDING_REVIEW } as Course;

      courseRepository.findOneBy.mockResolvedValue(course);
      courseRepository.save.mockImplementation(async (entity) => entity);
      auditRepository.create.mockImplementation((payload) => payload);
      auditRepository.save.mockImplementation(async (payload) => payload);

      const result = await service.create(
        {
          courseId: 20,
          userId: 501,
          fromStatus: Status.PENDING_REVIEW,
          toStatus: Status.PUBLISHED,
        },
        Role.ADMIN,
      );

      expect(courseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 20,
          status: Status.PUBLISHED,
          publishedAt: expect.any(Date),
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          fromStatus: Status.PENDING_REVIEW,
          toStatus: Status.PUBLISHED,
          courseId: 20,
        }),
      );
    });

    it('defaults admin fromStatus to current course status when omitted', async () => {
      const course = { id: 30, status: Status.PENDING_REVIEW } as Course;

      courseRepository.findOneBy.mockResolvedValue(course);
      courseRepository.save.mockImplementation(async (entity) => entity);
      auditRepository.create.mockImplementation((payload) => payload);
      auditRepository.save.mockImplementation(async (payload) => payload);

      const result = await service.create(
        {
          courseId: 30,
          userId: 99,
          toStatus: Status.PUBLISHED,
        },
        Role.ADMIN,
      );

      expect(result.fromStatus).toBe(Status.PENDING_REVIEW);
      expect(result.toStatus).toBe(Status.PUBLISHED);
    });

    it('throws BadRequestException when toStatus remains undefined', async () => {
      const course = { id: 40, status: Status.DRAFT } as Course;

      courseRepository.findOneBy.mockResolvedValue(course);

      await expect(
        service.create({ courseId: 40, userId: 7 }, Role.ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(courseRepository.save).not.toHaveBeenCalled();
      expect(auditRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll (pagination)', () => {
    it('paginates audits according to the query params', async () => {
      const audits = [{ id: 1 } as Audit];
      auditRepository.findAndCount!.mockResolvedValue([audits, 5]);

      const result = await service.findAll({ page: 3, limit: 2 });

      expect(auditRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 4,
          take: 2,
        }),
      );

      expect(result).toEqual({
        data: audits,
        meta: {
          total: 5,
          page: 3,
          limit: 2,
          lastPage: 3,
        },
      });
    });
  });
});
