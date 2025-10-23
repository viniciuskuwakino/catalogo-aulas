import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

const mockUserRepository = {
  findAndCount: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('paginates results with provided page and limit', async () => {
    const users = [{ id: 1 } as User];
    mockUserRepository.findAndCount.mockResolvedValue([users, 6]);

    const result = await service.findAll({ page: 2, limit: 5 });

    expect(mockUserRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      }),
    );

    expect(result).toEqual({
      data: users,
      meta: {
        total: 6,
        page: 2,
        limit: 5,
        lastPage: 2,
      },
    });
  });

  it('falls back to default pagination when params are omitted', async () => {
    const users = [{ id: 2 } as User];
    mockUserRepository.findAndCount.mockResolvedValue([users, 1]);

    const result = await service.findAll({});

    expect(mockUserRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
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
});
