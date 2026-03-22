import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

export const uploadSingle = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, 
    },

}).single('file');

export const uploadMultiple = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, 
        files: 10, 
    },
}).array('files', 10);
