import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/users/enums/role.enum';

@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(Role.STUDENT)
  create(@Body() createEnrollmentDto: CreateEnrollmentDto, @Request() req) {
    createEnrollmentDto.userId = req.user.userId
    return this.enrollmentsService.create(createEnrollmentDto, req.user.role);
  }

  // @Get()
  // findAll() {
  //   return this.enrollmentsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.enrollmentsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateEnrollmentDto: UpdateEnrollmentDto) {
  //   return this.enrollmentsService.update(+id, updateEnrollmentDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.enrollmentsService.remove(+id);
  // }
}
