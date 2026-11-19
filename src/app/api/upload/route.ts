import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session || session.value !== 'true') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;

    if (!bucketName || !publicDomain) {
      return NextResponse.json(
        { success: false, error: 'Cloudflare R2 environment variables are missing on the server.' },
        { status: 500 }
      );
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `product_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type || 'image/jpeg',
    });

    await r2Client.send(command);

    const url = `${publicDomain.replace(/\/$/, '')}/${fileName}`;
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('API /api/upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
