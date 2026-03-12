import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';

interface FileInfo {
  path: string;
  name: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: boolean;
}

ipcMain.handle('file:read', async (_, filePath: string): Promise<string> => {; 
  try {
    // 1. Нормализуем путь и проверяем его безопасность
    const normalizedPath = path.normalize(filePath);
    
    // 2. Проверяем, что путь абсолютный (добавлено)
    if (!path.isAbsolute(normalizedPath)) {
      throw new Error('File path must be absolute');
    }
    
    // 3. Проверка безопасности пути (исправлено)
    if (normalizedPath.includes('..') || normalizedPath.includes('~')) {
      throw new Error('Invalid file path: Access to parent directories is not allowed');
    }

    // 4. Чтение файла (здесь используется filePath)
    const content = await fs.readFile(normalizedPath, 'utf-8');
    return content;
  } catch (error) {
    const message = (error instanceof Error) ? error.message : 'Unknown error';
    throw new Error(`Failed to read file: ${message}`);
  }
});

ipcMain.handle('file:get-info', async (_, filePath: string): Promise<FileInfo> => {
  try {
    if (!filePath || typeof filePath !== 'string' || filePath.includes('..')) {
      throw new Error('Invalid file path');
    }
    const stats = await fs.stat(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {  // Removed type annotation
    const message = (error instanceof Error) ? error.message : String(error);
    throw new Error(`Failed to get file info: ${message}`);
  }
});