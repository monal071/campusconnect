import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resources');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      filter: function ({ name, originalFilename, mimetype }) {
        // Allow only specific file types
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp'
        ];
        
        return allowedTypes.includes(mimetype);
      }
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('File upload error:', err);
        return res.status(500).json({ error: 'File upload failed' });
      }

      const file = files.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate a unique filename
      const timestamp = Date.now();
      const originalName = Array.isArray(file) ? file[0].originalFilename : file.originalFilename;
      const extension = path.extname(originalName);
      const baseName = path.basename(originalName, extension);
      const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const uniqueFilename = `${timestamp}_${safeBaseName}${extension}`;
      
      const filePath = Array.isArray(file) ? file[0].filepath : file.filepath;
      const newPath = path.join(uploadDir, uniqueFilename);

      // Move file to final destination
      try {
        fs.renameSync(filePath, newPath);
        
        const fileSize = Array.isArray(file) ? file[0].size : file.size;
        const fileUrl = `/uploads/resources/${uniqueFilename}`;

        res.status(200).json({
          message: 'File uploaded successfully',
          file: {
            filename: uniqueFilename,
            originalName: originalName,
            url: fileUrl,
            size: fileSize,
            uploadedAt: new Date().toISOString()
          }
        });
      } catch (moveError) {
        console.error('Error moving file:', moveError);
        res.status(500).json({ error: 'Failed to save file' });
      }
    });

  } catch (error) {
    console.error('Upload handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}