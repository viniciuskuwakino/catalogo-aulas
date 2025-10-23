import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/users/enums/role.enum';

@ApiBearerAuth()
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  create(@Body() createLessonDto: CreateLessonDto, @Request() req) {
    const userId = req.user.userId
    return this.lessonsService.create(createLessonDto, userId, req.user.role);
  }

  // @Get()
  // findAll() {
  //   return this.lessonsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.lessonsService.findOne(+id);
  // }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  update(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto, @Request() req) {
    const userId = req.user.userId
    return this.lessonsService.update(+id, updateLessonDto, userId, req.user.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(+id);
  }
}
