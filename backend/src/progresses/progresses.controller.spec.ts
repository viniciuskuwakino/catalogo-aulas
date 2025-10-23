import { Test, TestingModule } from '@nestjs/testing';
import { ProgressesController } from './progresses.controller';
import { ProgressesService } from './progresses.service';

describe('ProgressesController', () => {
  let controller: ProgressesController;
  let service: ProgressesService;

  const mockProgressesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressesController],
      providers: [
        {
          provide: ProgressesService,
          useValue: mockProgressesService,
        },
      ],
    }).compile();

    controller = module.get<ProgressesController>(ProgressesController);
    service = module.get<ProgressesService>(ProgressesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });
});
