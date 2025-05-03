export const getMimeTypeFromUrl = (url) => {
    if (!url || typeof url !== 'string') return 'external/url';
  
    const ext = url.split('.').pop().toLowerCase().split('?')[0];
  
    const isGoogleDrive = url.includes('drive.google.com');
  
    if (isGoogleDrive) {
      return 'application/vnd.google-apps.unknown'; // or something you use to distinguish it
    }
  
    const mimeMap = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      ico: 'image/x-icon',
      tif: 'image/tiff',
      tiff: 'image/tiff',
  
      // Fonts
      woff: 'font/woff',
      woff2: 'font/woff2',
      ttf: 'font/ttf',
      otf: 'font/otf',
      eot: 'application/vnd.ms-fontobject',
  
      // Video
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
  
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
  
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      csv: 'text/csv',
      json: 'application/json',
      xml: 'application/xml',
  
      // Archives
      zip: 'application/zip',
      rar: 'application/vnd.rar',
      tar: 'application/x-tar',
      gz: 'application/gzip',
      '7z': 'application/x-7z-compressed',
    };
  
    return mimeMap[ext] || 'external/url';
  };
  