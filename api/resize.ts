import sharp from 'sharp';
import { NextRequest } from 'next/server';

export default async function handler(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    const sizeStr = formData.get('size') as string;

    if (!file) return new Response('No image uploaded', { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const size = parseInt(sizeStr) || 1080;

    const resized = await sharp(buffer)
      .resize(size, size, { fit: 'inside' })
      .jpeg({ quality: 90 })
      .toBuffer();

    return new Response(resized, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="resized_${size}.jpg"`,
      },
    });
  } catch (err) {
    console.error(err);
    return new Response('Server error', { status: 500 });
  }
}
