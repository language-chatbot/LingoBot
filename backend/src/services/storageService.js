import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const {
  S3_BUCKET,
  S3_REGION,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_ENDPOINT,
} = process.env;

const isS3Configured = !!(S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY);

let s3Client = null;
if (isS3Configured) {
  const s3Config = {
    region: S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  };
  if (S3_ENDPOINT) {
    s3Config.endpoint = S3_ENDPOINT;
    s3Config.forcePathStyle = true;
  }
  s3Client = new S3Client(s3Config);
  console.log('S3 storage client successfully initialized.');
} else {
  console.log('S3 credentials not fully configured; falling back to local file storage.');
}

/**
 * Processes an uploaded file by uploading it to S3 if configured, 
 * or maintaining its path inside local server storage.
 * @param {Object} file - The Multer file object
 * @returns {Promise<string>} The public URL or local asset path to access the file
 */
export const processUploadedFile = async (file) => {
  if (!file) return null;

  if (isS3Configured) {
    const localFilePath = file.path;
    const fileName = `${Date.now()}-${file.filename}-${file.originalname.replace(/\s+/g, '_')}`;

    try {
      const fileStream = fs.createReadStream(localFilePath);
      const uploadParams = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Body: fileStream,
        ContentType: file.mimetype,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      // Clean up local temp file after S3 upload succeeds
      fs.unlinkSync(localFilePath);

      // Return S3 access link
      if (S3_ENDPOINT) {
        return `${S3_ENDPOINT}/${S3_BUCKET}/${fileName}`;
      } else {
        return `https://${S3_BUCKET}.s3.${S3_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
      }
    } catch (err) {
      console.error('S3 Upload failed, falling back to local serving path:', err);
      // If S3 fails, keep local file and return local path
      return `/uploads/${file.filename}`;
    }
  } else {
    // Return relative URL for static serving
    return `/uploads/${file.filename}`;
  }
};
