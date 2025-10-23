import { Test, TestingModule } from '@nestjs/testing';
import { AuditsController } from './audits.controller';
import { AuditsService } from './audits.service';

describe('AuditsController', () => {
  let controller: AuditsController;
  let service: AuditsService;

  const mockAuditsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditsController],
      providers: [
        {
          provide: AuditsService,
          useValue: mockAuditsService,
        },
      ],
    }).compile();

    controller = module.get<AuditsController>(AuditsController);
    service = module.get<AuditsService>(AuditsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
