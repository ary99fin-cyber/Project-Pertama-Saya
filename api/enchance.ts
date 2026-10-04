import { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

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
      return res.status(500).json({ error: 'Gagal mengunggah file' });
    }

    try {
      const fileField = files.image || files.file;
      if (!fileField) {
        return res.status(400).json({ error: 'Tidak ada file gambar' });
      }

      const uploadedFile = Array.isArray(fileField) ? fileField[0] : fileField;
      
      // Ambil API Key dari Environment Variable Vercel atau masukkan langsung di sini untuk uji coba
      const apiKey = process.env.DEEPAI_API_KEY || "52336f44-45d8-4909-944e-e7d8984cff35";

      const formData = new FormData();
      formData.append('image', fs.createReadStream(uploadedFile.filepath));

      const aiResponse = await axios.post('https://api.deepai.org/api/torch-srgan', formData, {
        headers: {
          'api-key': apiKey,
          ...formData.getHeaders(),
        },
      });

      fs.unlinkSync(uploadedFile.filepath);

      return res.status(200).json({ output_url: aiResponse.data.output_url });
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      return res.status(500).json({ error: 'Gagal memproses AI DeepAI' });
    }
  });
}
