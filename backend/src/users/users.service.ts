import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
  const users = await this.prisma.user.findMany({
    where: {
      status: true,
    },
  });

  return users.map((user) => this.removePassword(user));
}

  async create(createUserDto: CreateUserDto) {
  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

  const user = await this.prisma.user.create({
    data: {
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role,
    },
  });

  return this.removePassword(user);
}

async findOne(id: number) {
  const user = await this.prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }

  return this.removePassword(user);
}

private removePassword(user: Prisma.UserGetPayload<{}>) {
  const { password, ...userWithoutPassword } = user;

  return userWithoutPassword;
}

async update(id: number, updateUserDto: UpdateUserDto) {
  const user = await this.prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }

  const data: {
    name?: string;
    email?: string;
    password?: string;
    role?: UpdateUserDto['role'];
  } = {};

  if (updateUserDto.name !== undefined) {
    data.name = updateUserDto.name;
  }

  if (updateUserDto.email !== undefined) {
    data.email = updateUserDto.email;
  }

  if (updateUserDto.role !== undefined) {
    data.role = updateUserDto.role;
  }

  if (updateUserDto.password !== undefined) {
    data.password = await bcrypt.hash(updateUserDto.password, 10);
  }

  const updatedUser = await this.prisma.user.update({
    where: {
      id,
    },
    data,
  });

  return this.removePassword(updatedUser);
}

async remove(id: number) {
  const user = await this.prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }

  const updatedUser = await this.prisma.user.update({
    where: {
      id,
    },
    data: {
      status: false,
    },
  });

  return this.removePassword(updatedUser);
}
}