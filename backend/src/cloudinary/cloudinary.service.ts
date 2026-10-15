
import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: { buffer: Buffer },
    folder = 'promos-platform/promotions',
  ): Promise<{ secure_url: string }> {
    return this.upload(file.buffer, folder, 'image');
  }

  async uploadReceipt(
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
    },
  ): Promise<{ secure_url: string }> {
    const isImage = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ].includes(file.mimetype);

    const isPdf = file.mimetype === 'application/pdf';

    if (!isImage && !isPdf) {
      throw new BadRequestException(
        'El comprobante debe ser JPG, PNG, WEBP o PDF.',
      );
    }

    const extension = extname(file.originalname).toLowerCase();
    const safeName = `${randomUUID()}${extension}`;

    return this.upload(
      file.buffer,
      'promos-platform/payment-receipts',
      isPdf ? 'raw' : 'image',
      isPdf ? safeName : undefined,
    );
  }

  private upload(
    buffer: Buffer,
    folder: string,
    resourceType: 'image' | 'raw',
    publicId?: string,
  ): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          ...(publicId ? { public_id: publicId } : {}),
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result?.secure_url) {
            reject(new Error('Cloudinary no devolvió la URL del archivo.'));
            return;
          }

          resolve({ secure_url: result.secure_url });
        },
      );

      stream.on('error', reject);
      stream.end(buffer);
    });
  }
}
