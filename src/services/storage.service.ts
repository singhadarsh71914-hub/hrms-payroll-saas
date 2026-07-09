import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface IStorageProvider {
  upload(filepath: string, destination: string): Promise<string>;
  download(id: string): Promise<string>;
  delete(id: string): Promise<boolean>;
}

export class LocalStorageProvider implements IStorageProvider {
  private baseDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async upload(filepath: string, destination: string): Promise<string> {
    const destPath = path.join(this.baseDir, destination);
    // ensure dir
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Copy instead of rename in case /tmp is on a different mount
    fs.copyFileSync(filepath, destPath);
    // fs.unlinkSync(filepath); // Can be optionally deleted after upload
    return destPath;
  }

  async download(id: string): Promise<string> {
    return path.join(this.baseDir, id);
  }

  async delete(id: string): Promise<boolean> {
    try {
      fs.unlinkSync(path.join(this.baseDir, id));
      return true;
    } catch {
      return false;
    }
  }
}

export class S3StorageProvider implements IStorageProvider {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
      }
    });
    this.bucket = process.env.AWS_S3_BUCKET || 'hrms-reports';
  }

  async upload(filepath: string, destination: string): Promise<string> {
    const fileStream = fs.createReadStream(filepath);
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: destination,
      Body: fileStream,
    }));
    return `s3://${this.bucket}/${destination}`;
  }

  async download(id: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: id
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return url;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: id
      }));
      return true;
    } catch {
      return false;
    }
  }
}

// Factory
export const StorageService = process.env.STORAGE_PROVIDER === 's3' 
  ? new S3StorageProvider() 
  : new LocalStorageProvider();
