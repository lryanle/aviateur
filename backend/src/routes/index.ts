import { Router } from 'express';
import multer from 'multer';
import fs, { existsSync, mkdirSync } from 'fs';
import s3 from '../s3';
import path from 'path';
import dayjs from 'dayjs';

const index = Router();
const uploadPath = path.join(__dirname, '..', '..', 'uploads');
if (!existsSync(uploadPath)) mkdirSync(uploadPath);

// Configure multer for file upload handling
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});


const multerStorage = multer({ storage });


index.get('/', (req, res) => {
    res.send('Hello world!');
});

index.post('/upload', multerStorage.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).send('No file uploaded');
            return;
        }

        const fileStream = fs.createReadStream(req.file.path);

        const params = {
            Bucket: process.env.B2_BUCKET_NAME!,
            Key: req.file.filename,
            Body: fileStream,
            ContentType: req.file.mimetype,
        };


        const data = await s3.upload(params).promise();

        // Cleanup remains the same
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'File uploaded successfully',
            fileName: decodeURIComponent(data.Key),
            url: `https://cdn.aviateur.tech/${data.Key}`
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).send('Error uploading file');
    }
});

index.get('/files', async (req, res) => {
    try {
        const params = {
            Bucket: process.env.B2_BUCKET_NAME!,
        };
        const data = await s3.listObjectsV2(params).promise();
        const files = data.Contents?.map((file) => ({
            key: encodeURIComponent(file.Key as string),
            size: file.Size,
            lastModified: dayjs(file.LastModified),
            url: `https://cdn.aviateur.tech/${encodeURIComponent(file.Key as string)}`
        }));

        const sortedFiles = files?.sort((a, b) => b.lastModified.unix() - a.lastModified.unix());

        res.json(sortedFiles);
    } catch (e) {
        console.error(e);
        res.status(500).send('Internal server error!');
    }
});

export default index;