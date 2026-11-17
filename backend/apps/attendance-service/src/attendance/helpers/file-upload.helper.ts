import { BadRequestException } from '@nestjs/common';

import { ERROR_MESSAGES } from '@app/common';
import type { AuthenticatedRequest } from '@app/common';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const imageExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export const imageFileFilter = (
  req: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!Object.hasOwn(imageExtensions, file.mimetype)) {
    return callback(
      new BadRequestException(ERROR_MESSAGES.ATTENDANCE.INVALID_IMAGE_FILE),
      false,
    );
  }
  callback(null, true);
};

export function createAttendanceDiskStorage(
  baseUploadDir: string = './uploads/attendance',
) {
  return diskStorage({
    destination: (req, _file, callback) => {
      const authReq = req as unknown as AuthenticatedRequest;
      const employeeId = authReq.user?.sub ?? 'unauthenticated';
      const targetDir = join(baseUploadDir, employeeId);

      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      callback(null, targetDir);
    },
    filename: (req, file, callback) => {
      const attendanceId = randomUUID();
      (req as unknown as { attendanceId?: string }).attendanceId = attendanceId;
      const ext = imageExtensions[file.mimetype];
      if (!ext) {
        callback(new BadRequestException(ERROR_MESSAGES.ATTENDANCE.INVALID_IMAGE_FILE), '');
        return;
      }
      callback(null, `${attendanceId}${ext}`);
    },
  });
}
