import { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';
import formidable from 'formidable';
import fs from 'fs';

// Menonaktifkan bodyParser bawaan Vercel agar formidable bisa membaca file multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({});

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal memproses unggahan file' });
    }

    try {
      const fileField = files.image || files.file;
      if (!fileField) {
        return res.status(400).json({ error: 'Tidak ada file gambar yang diunggah' });
      }

      const uploadedFile = Array.isArray(fileField) ? fileField[0] : fileField;
      const filePath = uploadedFile.filepath;

      // Ambil parameter lebar/tinggi dari form (opsional, default ke 800px)
      const widthParam = fields.width ? parseInt(Array.isArray(fields.width) ? fields.width[0] : fields.width, 10) : 800;

      // Proses resize menggunakan Sharp
      const imageBuffer = fs.readFileSync(filePath);
      const resizedBuffer = await sharp(imageBuffer)
        .resize({ width: widthParam, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Hapus file temporary dari server
      fs.unlinkSync(filePath);

      // Kirim balik gambar yang sudah di-resize
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="resized-image.jpg"');
      return res.status(200).send(resizedBuffer);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Gagal melakukan resize gambar' });
    }
  });
}
