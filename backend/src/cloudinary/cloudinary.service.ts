import { Injectable } from '@nestjs/common';
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
    file: {
      buffer: Buffer;
    },
    folder = 'promos-platform/promotions',
  ) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('ERROR CLOUDINARY:', error);
            reject(error);
            return;
          }

          console.log('IMAGEN SUBIDA A CLOUDINARY:', result?.secure_url);

          resolve(result);
        },
      );

      uploadStream.on('error', (error) => {
        console.error('ERROR EN STREAM CLOUDINARY:', error);
        reject(error);
      });

      uploadStream.end(file.buffer);
    });
  }
}