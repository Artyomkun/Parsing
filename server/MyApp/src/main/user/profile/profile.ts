import { generateId } from './generate-id';
import {formatDateToISO } from './formatDate';
const PROFILE_STORAGE_KEY = 'user_profiles';
export const formatDateForServer = formatDateToISO;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string; 
  createdAt: Date;
  updatedAt: Date;
}

// Типы для работы с профилями
type ProfileInput = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
type ProfileUpdate = Partial<Omit<ProfileInput, 'email'>> & { id: string };

// Инициализация хранилища
const initializeStorage = () => {
  if (!localStorage.getItem(PROFILE_STORAGE_KEY)) {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({}));
  }
};

// Получение всех профилей из хранилища
const getAllProfiles = (): Record<string, UserProfile> => {
  initializeStorage();
  const data = localStorage.getItem(PROFILE_STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

// Сохранение всех профилей в хранилище
const saveAllProfiles = (profiles: Record<string, UserProfile>) => {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
};

// Создание или обновление профиля пользователя
export const saveProfile = (profile: ProfileInput): UserProfile => {
  const allProfiles = getAllProfiles();
  const now = new Date();
  
  // Генерируем ID если не предоставлен
  const id = profile.id || generateId();
  
  // Для существующего профиля сохраняем оригинальную дату создания
  const createdAt = allProfiles[id]?.createdAt || now;
  
  const newProfile: UserProfile = {
    ...profile,
    id,
    createdAt,
    updatedAt: now
  };
  
  allProfiles[id] = newProfile;
  saveAllProfiles(allProfiles);
  return newProfile;
};

// Получение профиля по ID
export const getProfile = (id: string): UserProfile | null => {
  const allProfiles = getAllProfiles();
  return allProfiles[id] || null;
};

// Обновление профиля
export const updateProfile = (updateData: ProfileUpdate): UserProfile => {
  const existing = getProfile(updateData.id);
  if (!existing) {
    throw new Error(`Profile with ID ${updateData.id} not found`);
  }
  
  // Обновляем только переданные поля
  const updatedProfile: ProfileInput = {
    ...existing,
    ...updateData
  };
  
  return saveProfile(updatedProfile);
};

// Обновление фото профиля
export const updateAvatar = (id: string, avatarUrl: string): UserProfile => {
  return updateProfile({ id, avatar: avatarUrl });
};

// Удаление фото профиля
export const removeAvatar = (id: string): UserProfile => {
  return updateProfile({ id, avatar: undefined });
};

// Получение всех профилей
export const listProfiles = (): UserProfile[] => {
  const allProfiles = getAllProfiles();
  return Object.values(allProfiles);
};

// Поиск профилей
export const searchProfiles = (query: string): UserProfile[] => {
  const profiles = listProfiles();
  const searchTerm = query.toLowerCase().trim();
  
  return profiles.filter(profile => 
    profile.name.toLowerCase().includes(searchTerm) ||
    profile.email.toLowerCase().includes(searchTerm) ||
    (profile.bio && profile.bio.toLowerCase().includes(searchTerm))
  );
};

// Удаление профиля
export const deleteProfile = (id: string): boolean => {
  const allProfiles = getAllProfiles();
  if (!allProfiles[id]) return false;
  
  delete allProfiles[id];
  saveAllProfiles(allProfiles);
  return true;
};

// Проверка уникальности email
export const isEmailUnique = (email: string, excludeId?: string): boolean => {
  const profiles = listProfiles();
  return !profiles.some(
    profile => profile.email === email && profile.id !== excludeId
  );
};

// Получение профиля по email
export const getProfileByEmail = (email: string): UserProfile | null => {
  const profiles = listProfiles();
  return profiles.find(profile => profile.email === email) || null;
};

// Создание нового профиля с автоматической генерацией ID
export const createProfile = (data: Omit<ProfileInput, 'id'>): UserProfile => {
  return saveProfile(data);
};