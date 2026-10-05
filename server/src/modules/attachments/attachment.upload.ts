import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (
  _req,
  file,
  callback,
) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return callback(
      new Error(
        'Only PNG, JPG, JPEG, PDF, DOCX and TXT files are allowed',
      ),
    );
  }

  callback(null, true);
};

export const uploadAttachment = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});