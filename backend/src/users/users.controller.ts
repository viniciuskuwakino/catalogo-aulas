import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { User } from './entities/user.entity';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User successfully created.', type: User })
  @ApiBadRequestResponse({ description: 'Validation failed for the provided payload.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'List users with pagination' })
  @ApiOkResponse({ description: 'Paginated list of users.' })
  @ApiBadRequestResponse({ description: 'Invalid pagination parameters.' })
  @ApiForbiddenResponse({ description: 'Only admins and instructors can list users.' })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Retrieve a user by ID' })
  @ApiOkResponse({ description: 'User found.', type: User })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiForbiddenResponse({ description: 'Only admins can access user details.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiOkResponse({ description: 'User updated successfully.', type: User })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiBadRequestResponse({ description: 'Validation failed for the provided payload.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiOkResponse({ description: 'User removed successfully.', type: User })
  @ApiNotFoundResponse({ description: 'User not found.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
