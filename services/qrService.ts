
import { QRCodeData } from '../types';

/**
 * This service now simulates the interaction with the Supabase Edge Function.
 * In production, 'generateWeeklyQR' would be a wrapper around a fetch() call to the API.
 */

export const generateWeeklyQR = async (expiryDate: Date): Promise<QRCodeData> => {
  // Simulate network latency for the Edge Function call
  await new Promise(resolve => setTimeout(resolve, 800));

  const now = new Date();
  const weekNumber = Math.ceil(now.getDate() / 7);
  const rotationId = `ROT_${now.getFullYear()}_W${weekNumber}_${Math.random().toString(36).substring(7).toUpperCase()}`;
  
  // This matches the logic implemented in the Supabase Edge Function
  const payload = {
    iss: 'AKTIVATE_AUTH_PROD',
    iat: Math.floor(now.getTime() / 1000),
    exp: Math.floor(expiryDate.getTime() / 1000),
    rid: rotationId,
    loc: 'BUJ_HQ_MAIN'
  };

  const data = btoa(JSON.stringify(payload));
  // Mocking the server-side HMAC signature
  const signature = btoa(`${data}.PROD_SECRET`).substring(0, 32);
  const qrString = `${data}.${signature}`;

  const qrData: QRCodeData = {
    id: `qr_${Math.random().toString(36).substring(2, 11)}`,
    qr_data: qrString,
    valid_from: now.toISOString(),
    valid_until: expiryDate.toISOString(),
    is_active: true,
    rotation_id: rotationId,
    checksum: signature
  };

  // Persist the "current active" state locally for simulated validation
  localStorage.setItem('aktivate_active_qr', JSON.stringify(qrData));
  
  return qrData;
};

export const validateQRCode = (qrString: string): boolean => {
  try {
    const saved = localStorage.getItem('aktivate_active_qr');
    if (!saved) return false;
    
    const activeQR: QRCodeData = JSON.parse(saved);
    if (qrString !== activeQR.qr_data) return false;

    const now = new Date();
    if (now > new Date(activeQR.valid_until)) return false;

    return true;
  } catch (e) {
    return false;
  }
};

export const getNextRotationSchedule = (): Date => {
  const d = new Date();
  const day = d.getDay();
  // Set to next Monday at 00:00:00
  const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
  const nextMonday = new Date(d.setDate(diff));
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
};

export const getActiveQR = (): QRCodeData | null => {
  const saved = localStorage.getItem('aktivate_active_qr');
  return saved ? JSON.parse(saved) : null;
};
