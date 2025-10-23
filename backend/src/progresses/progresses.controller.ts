import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Query } from '@nestjs/common';
import { ProgressesService } from './progresses.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/users/enums/role.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Progress } from './entities/progress.entity';

@ApiBearerAuth()
@Controller('progresses')
export class ProgressesController {
  constructor(private readonly progressesService: ProgressesService) {}

  @Post()
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Register student progress for a lesson' })
  @ApiCreatedResponse({ description: 'Progress registered successfully.', type: Progress })
  @ApiBadRequestResponse({ description: 'Validation failed for the provided payload.' })
  @ApiForbiddenResponse({ description: 'Only students can register progress.' })
  @ApiNotFoundResponse({ description: 'Lesson or user not found.' })
  create(@Body() createProgressDto: CreateProgressDto, @Request() req) {
    createProgressDto.userId = req.user.userId
    return this.progressesService.create(createProgressDto, req.user.role);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'List progresses with pagination' })
  @ApiOkResponse({ description: 'Paginated list of progresses.' })
  @ApiForbiddenResponse({ description: 'Only admins and students can list progresses.' })
  findAll(@Request() req, @Query() pagination: PaginationQueryDto) {
    const { userId, role } = req.user;
    return this.progressesService.findAll(userId, role, pagination);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.progressesService.findOne(+id);
  // }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'Update progress data' })
  @ApiOkResponse({ description: 'Progress updated successfully.', type: Progress })
  @ApiNotFoundResponse({ description: 'Progress not found.' })
  @ApiBadRequestResponse({ description: 'Validation failed for the provided payload.' })
  update(@Param('id') id: string, @Body() updateProgressDto: UpdateProgressDto) {
    return this.progressesService.update(+id, updateProgressDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a progress record' })
  @ApiOkResponse({ description: 'Progress removed successfully.', type: Progress })
  @ApiNotFoundResponse({ description: 'Progress not found.' })
  @ApiForbiddenResponse({ description: 'Only admins can remove progresses.' })
  remove(@Param('id') id: string) {
    return this.progressesService.remove(+id);
  }
}
