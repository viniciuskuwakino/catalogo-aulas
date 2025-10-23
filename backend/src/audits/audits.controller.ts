import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Query } from '@nestjs/common';
import { AuditsService } from './audits.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/users/enums/role.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Audit } from './entities/audit.entity';

@ApiBearerAuth()
@Controller('audits')
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Create an audit record for course status changes' })
  @ApiCreatedResponse({ description: 'Audit created successfully.', type: Audit })
  @ApiBadRequestResponse({ description: 'Validation failed for the provided payload.' })
  @ApiForbiddenResponse({ description: 'Only admins and instructors can create audits.' })
  @ApiNotFoundResponse({ description: 'Course not found.' })
  create(@Body() createAuditDto: CreateAuditDto, @Request() req) {
    createAuditDto.userId = req.user.userId
    return this.auditsService.create(createAuditDto, req.user.role);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List audits with pagination' })
  @ApiOkResponse({ description: 'Paginated list of audits.' })
  @ApiForbiddenResponse({ description: 'Only admins can list audits.' })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.auditsService.findAll(pagination);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Retrieve an audit by ID' })
  @ApiOkResponse({ description: 'Audit found.', type: Audit })
  @ApiNotFoundResponse({ description: 'Audit not found.' })
  @ApiForbiddenResponse({ description: 'Only admins can access audit details.' })
  findOne(@Param('id') id: string) {
    return this.auditsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update an audit' })
  @ApiOkResponse({ description: 'Audit updated successfully.', type: Audit })
  @ApiNotFoundResponse({ description: 'Audit not found.' })
  @ApiBadRequestResponse({ description: 'Validation failed for the provided payload.' })
  @ApiForbiddenResponse({ description: 'Only admins can update audits.' })
  update(@Param('id') id: string, @Body() updateAuditDto: UpdateAuditDto) {
    return this.auditsService.update(+id, updateAuditDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an audit' })
  @ApiOkResponse({ description: 'Audit removed successfully.', type: Audit })
  @ApiNotFoundResponse({ description: 'Audit not found.' })
  remove(@Param('id') id: string) {
    return this.auditsService.remove(+id);
  }
}
