import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

 @UseGuards(JwtAuthGuard)
@Get()
findAll() {
  return this.usersService.findAll();
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  @Patch(':id')
update(
  @Param('id') id: string,
  @Body() updateUserDto: UpdateUserDto,
) {
  return this.usersService.update(Number(id), updateUserDto);
}

@Delete(':id')
remove(@Param('id') id: string) {
  return this.usersService.remove(Number(id));
}
}