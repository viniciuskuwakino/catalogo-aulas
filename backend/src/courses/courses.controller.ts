import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/users/enums/role.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Course } from './entities/course.entity';

@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiCreatedResponse({ description: 'Course created successfully.', type: Course })
  @ApiBadRequestResponse({ description: 'Validation failed for the provided payload.' })
  @ApiForbiddenResponse({ description: 'Only admins and instructors can create courses.' })
  create(@Body() createCourseDto: CreateCourseDto, @Request() req) {
    createCourseDto.userId = req.user.userId
    return this.coursesService.create(createCourseDto, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'List courses with pagination' })
  @ApiOkResponse({ description: 'Paginated list of courses.' })
  @ApiBadRequestResponse({ description: 'Invalid pagination parameters.' })
  findAll(@Request() req, @Query() pagination: PaginationQueryDto) {
    const userId = req.user.userId;
    return this.coursesService.findAll(userId, req.user.role, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a course by ID' })
  @ApiOkResponse({ description: 'Course found.', type: Course })
  @ApiNotFoundResponse({ description: 'Course not found.' })
  @ApiForbiddenResponse({ description: 'Access denied for this course.' })
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.coursesService.findOne(+id, userId, req.user.role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Update an existing course' })
  @ApiOkResponse({ description: 'Course updated successfully.', type: Course })
  @ApiNotFoundResponse({ description: 'Course not found.' })
  @ApiForbiddenResponse({ description: 'You cannot update this course.' })
  @ApiBadRequestResponse({ description: 'Validation failed for the provided payload.' })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto, @Request() req) {
    updateCourseDto.userId = req.user.userId
    return this.coursesService.update(+id, updateCourseDto, req.user.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiOkResponse({ description: 'Course deleted successfully.', type: Course })
  @ApiNotFoundResponse({ description: 'Course not found.' })
  @ApiForbiddenResponse({ description: 'You cannot delete this course.' })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(+id);
  }
}
