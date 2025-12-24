
import { QRCodeData } from '../types';

const SALT = "AKTIVATE_BURUNDI_2024_SECURE_v2";

/**
 * Backend Simulation: This represents the logic that would run in a 
 * Supabase Edge Function to generate the encrypted weekly QR payload.
 */
export const generateWeeklyQR = (expiryDate: Date): string => {
  const payload = {
    iss: 'AKTIVATE_AUTH_SERVER',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiryDate.getTime() / 1000),
    // A unique identifier for the current active rotation
    rotationId: `rot_${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))}`,
    // Office location binding
    loc: 'BUJUMBURA_HQ_1',
    // High-entropy salt
    checksum: Math.random().toString(36).substring(2, 15)
  };
  
  // In a real edge function, we would sign this using a secret key (JWT style)
  // For simulation, we use a salted Base64 approach
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "QR" }));
  const data = btoa(JSON.stringify(payload));
  return `${header}.${data}.${btoa(SALT)}`;
};

/**
 * Validates the QR string against simulation logic.
 */
export const validateQRCode = (qrString: string, activeQR?: QRCodeData): boolean => {
  try {
    const parts = qrString.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    const saltCheck = atob(parts[2]);

    // Validate Signature simulation
    if (saltCheck !== SALT) return false;

    // Validate Expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return false;

    // Validate if it matches the current active QR in DB
    if (activeQR && qrString !== activeQR.qr_data) return false;

    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Schedule Logic: Returns the timestamp for the next automated rotation.
 * Typically used by a pg_cron or Edge Function scheduler.
 */
export const getNextRotationSchedule = (): Date => {
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
};
