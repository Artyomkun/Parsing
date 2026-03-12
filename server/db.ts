import mongoose, { Document, Schema, Types } from 'mongoose';
import Sentry from '@sentry/node';
import cron from 'node-cron';

interface IUser extends Document {
  username: string;
  email: string;
  createdAt: Date;
  lastActiveAt?: Date;
  timeZoneOffset?: number;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: Date,
  timeZoneOffset: Number,
});

const User = mongoose.model<IUser>('User', UserSchema);

interface IImportantActivity extends Document {
  eventType: string;
  documentId?: Types.ObjectId;
  collectionName: string;
  performedBy?: Types.ObjectId;
  performedAt: Date;
  details?: any;
}

const ImportantActivitySchema = new Schema<IImportantActivity>({
  eventType: { type: String, required: true },
  documentId: { type: Schema.Types.ObjectId, required: false },
  collectionName: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  performedAt: { type: Date, default: Date.now },
  details: { type: Schema.Types.Mixed },
});

const ImportantActivity = mongoose.model<IImportantActivity>('ImportantActivity', ImportantActivitySchema);

interface IDownloadLog extends Document {
  userId: Types.ObjectId;
  version: string;
  platform: string;
  extension: string;
  downloadTime: Date;
}

const DownloadLogSchema = new Schema<IDownloadLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  version: { type: String, required: true },
  platform: { type: String, required: true },
  extension: { type: String, required: true },
  downloadTime: { type: Date, default: Date.now }
});

const DownloadLog = mongoose.model<IDownloadLog>('DownloadLog', DownloadLogSchema);

interface IErrorLog extends Document {
  errorMessage: string;
  errorStack?: string;
  occurredAt: Date;
  userId?: Types.ObjectId;
  context?: any;
}

const ErrorLogSchema = new Schema<IErrorLog>({
  errorMessage: { type: String, required: true },
  errorStack: String,
  occurredAt: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  context: Schema.Types.Mixed,
});

const ErrorLog = mongoose.model<IErrorLog>('ErrorLog', ErrorLogSchema);

// Расширенная активность
interface IExtendedImportantActivity extends IImportantActivity {
  userAgent?: string;
  ipAddress?: string;
}

const ExtendedImportantActivitySchema = new Schema<IExtendedImportantActivity>({
  eventType: { type: String, required: true },
  documentId: { type: Schema.Types.ObjectId, required: false },
  collectionName: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  performedAt: { type: Date, default: Date.now },
  details: { type: Schema.Types.Mixed },
  userAgent: String,
  ipAddress: String,
});

const ExtendedImportantActivity = mongoose.model<IExtendedImportantActivity>('ExtendedImportantActivity', ExtendedImportantActivitySchema);

// Получение IP клиента
function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.connection?.remoteAddress || req.socket?.remoteAddress || '';
}

// Логирование важного события
async function logImportantEvent({
  eventType,
  collectionName,
  documentId,
  performedBy,
  details,
  userAgent,
  ipAddress,
}: {
  eventType: string;
  collectionName: string;
  documentId?: Types.ObjectId;
  performedBy?: Types.ObjectId;
  details?: any;
  userAgent?: string;
  ipAddress?: string;
}) {
  const lastLog = await ImportantActivity.findOne({ eventType, documentId, collectionName })
    .sort({ performedAt: -1 })
    .exec();

  const now = new Date();
  if (lastLog) {
    const diffHrs = (now.getTime() - lastLog.performedAt.getTime()) / 36e5; // миллисекунды → часы
    if (diffHrs < 1) return;
  }

  await new ExtendedImportantActivity({
    eventType,
    collectionName,
    documentId,
    performedBy,
    performedAt: now,
    details,
    userAgent,
    ipAddress,
  }).save();
}

// Логирование загрузки
async function logDownload(userId: Types.ObjectId, version: string, platform: string, extension: string) {
  await new DownloadLog({ userId, version, platform, extension }).save();
  await logImportantEvent({
    eventType: 'download',
    collectionName: 'DownloadLog',
    performedBy: userId,
    details: { version, platform, extension },
  });
}

// Логирование ошибок
async function logError(error: Error, userId?: Types.ObjectId, context?: any) {
  await new ErrorLog({ errorMessage: error.message, errorStack: error.stack, userId, context }).save();
  Sentry.captureException(error, { extra: context });
}

// Локальное время с оффсетом
function getLocalTime(date: Date, offsetMinutes: number) {
  return new Date(date.getTime() + offsetMinutes * 60000);
}

// Очистка старых логов
async function cleanupOldLogs() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  await ImportantActivity.deleteMany({ performedAt: { $lt: oneYearAgo } });
  await DownloadLog.deleteMany({ downloadTime: { $lt: oneYearAgo } });
  await ErrorLog.deleteMany({ occurredAt: { $lt: oneYearAgo } });
}

// Статистика загрузок
async function getDownloadStats(startDate: Date, endDate: Date) {
  return DownloadLog.countDocuments({ downloadTime: { $gte: startDate, $lte: endDate } });
}

// Сводка активности
async function getActivitySummary() {
  return ImportantActivity.aggregate([{ $group: { _id: "$eventType", count: { $sum: 1 } } }]);
}

// Инициализация
async function init() {
  await mongoose.connect('mongodb://localhost:27017/parsing-app');
  cron.schedule('0 0 * * *', () => cleanupOldLogs());
}

export {
  User,
  ImportantActivity,
  ExtendedImportantActivity,
  DownloadLog,
  ErrorLog,
  logImportantEvent,
  logDownload,
  logError,
  getClientIp,
  getLocalTime,
  cleanupOldLogs,
  getDownloadStats,
  getActivitySummary,
  init,
};
