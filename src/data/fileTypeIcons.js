import {
    File,
    FilePdf,
    FileText,
    FileZip,
    FileImage,
    FileAudio,
    FileVideo,
    FileCode,
    FileCss,
    FileHtml,
    FileJs,
    FileTs,
    FileDoc,
    FileXls,
    FileSvg,
    FolderSimple,
    Stack,
    Browser,
    Article,
    Link
  } from '@phosphor-icons/react';
  
  export const fileTypeIcons = {
    'application/pdf': FilePdf,
    'text/plain': FileText,
    'application/zip': FileZip,
    'image/svg+xml': FileSvg,
    'image/png': FileImage,
    'image/jpeg': FileImage,
    'font/ttf': File,
    'font/woff': File,
    'font/woff2': File,
    'application/msword': FileDoc,
    'application/vnd.ms-excel': FileXls,
    'audio/mpeg': FileAudio,
    'video/mp4': FileVideo,
    'application/json': FileCode,
    'text/css': FileCss,
    'text/html': FileHtml,
    'application/javascript': FileJs,
    'application/typescript': FileTs,
    'folder': FolderSimple,
    folder: FolderSimple,
    default: File,
  };

  const resourceTypeIcons = {
    default: File,
    file: FileText,
    layout: FolderSimple,
    page: FileHtml,
    article: FileText,
    image: FileImage,
    code: FileCode,
    video: FileVideo,
    pdf: FilePdf,
    zip: FileZip,
    link: File,
  };
  
  