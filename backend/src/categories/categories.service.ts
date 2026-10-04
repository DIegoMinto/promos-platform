import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existingCategory =
      await this.prisma.category.findUnique({
        where: {
          name: createCategoryDto.name,
        },
      });

    if (existingCategory) {
      throw new ConflictException(
        'La categoría ya existe',
      );
    }

    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description:
          createCategoryDto.description,
        icon: createCategoryDto.icon,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: {
        status: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}