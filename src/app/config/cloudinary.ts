import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import streamifier from "streamifier";
import crypto from 'crypto';


cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

const generateFileHash = (buffer: Buffer) => {
    return crypto.createHash('md5').update(buffer).digest('hex');
};

const streamUpload = (buffer: Buffer, public_id: string) => {
    return new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'Khelaghor-images',
                public_id,
                overwrite: false,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    });
};

export const uploadSingleImage = async (file: Express.Multer.File) => {
    if (!file) throw new Error('No file provided');

    const hash = generateFileHash(file.buffer);

    try {
        const result = await streamUpload(file.buffer, hash);
        return result;
    } catch (error: any) {
        if (error?.http_code === 409) {
            return {
                message: 'Duplicate image already exists',
                public_id: hash,
            };
        }
        throw error;
    }
};

export const uploadMultipleImages = async (
    files: Express.Multer.File[]
) => {
    if (!files || files.length === 0) {
        throw new Error('No files provided');
    }

    const results = await Promise.allSettled(
        files.map(async (file) => {
            const hash = generateFileHash(file.buffer);

            try {
                const res = await streamUpload(file.buffer, hash);
                return res;
            } catch (error: any) {
                if (error?.http_code === 409) {
                    return {
                        message: 'Duplicate skipped',
                        public_id: hash,
                    };
                }
                throw error;
            }
        })
    );

    return results;
};

export const deleteImage = async (public_id: string) => {
    if (!public_id) throw new Error('Public ID required');

    const result = await cloudinary.uploader.destroy(public_id);
    return result;
};

export const deleteMultipleImages = async (publicIds: string[]) => {
    if (!publicIds || publicIds.length === 0) {
        throw new Error('No public IDs provided');
    }

    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
};


export const extractPublicId = (url: string): string | null => {
    try {
        const parts = url.split('/');
        const fileWithExt = parts.slice(-1)[0]; 
        const publicId = fileWithExt.split('.')[0];

        const folder = parts.slice(-2, -1)[0];

        return folder ? `${folder}/${publicId}` : publicId;
    } catch {
        return null;
    }
};