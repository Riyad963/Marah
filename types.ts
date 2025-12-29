
import React from 'react';

export type AuthMode = 'login' | 'signup' | 'authenticated';
export type ActivePage = 'الرئيسية' | 'القطيع' | 'أعلاف' | 'GPS' | 'اجهزة' | 'السلالة' | 'تقارير' | 'إعدادات' | 'العمال';
export type LivestockCategory = 'أغنام' | 'ماعز' | 'أبقار';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: 'مجاني' | 'ذهبي';
  role: 'مالك' | 'مشرف' | 'عامل' | 'بيطري';
  farmId: string;
  currency: 'USD';
}

export interface Shepherd {
  id: string;
  userId: string;
  deviceId: string; // Linked to Real GPS Device
  name: string;
  phone: string;
  status: 'online' | 'offline' | 'warning';
  lastLat: number;
  lastLng: number;
}

export interface Livestock {
  id: string;
  tagId: string;
  deviceId?: string; // Real GPS Tracking Device ID
  shepherdId?: string; // Linked Shepherd
  category: LivestockCategory;
  healthStatus: string;
  isPregnant: boolean;
  // ... other fields
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'view' | 'usage' | 'error' | 'performance';
  eventName: string;
  metadata?: any;
}
