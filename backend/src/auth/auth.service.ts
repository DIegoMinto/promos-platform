import { Injectable, UnauthorizedException, ConflictException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import * as bcrypt from 'bcrypt';

import { UserRole } from '@prisma/client';

import { RegisterDto } from './dto/register.dto.js';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
  const existingUser = await this.prisma.user.findUnique({
    where: {
      email: registerDto.email,
    },
  });

  if (existingUser) {
    throw new ConflictException(
      'El correo electrónico ya está registrado',
    );
  }

  const hashedPassword = await bcrypt.hash(
    registerDto.password,
    10,
  );

  const user = await this.prisma.user.create({
    data: {
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      role: UserRole.CLIENTE,
    },
  });

  return {
    message: 'Usuario registrado correctamente',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.status) {
  throw new UnauthorizedException('Usuario inactivo');
}

    const passwordIsValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}