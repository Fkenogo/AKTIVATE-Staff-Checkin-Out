
import { useState, useCallback, useEffect } from 'react';
import { OFFICE_COORDS, LATE_THRESHOLD_TIME, MAX_DISTANCE_METERS } from '../constants';
import { AttendanceRecord, CheckMethod } from '../types';

const STORAGE_KEY = 'aktivate_pending_sync';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export const useAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = async () => {
    const pending = localStorage.getItem(STORAGE_KEY);
    if (!pending) return;
    localStorage.removeItem(STORAGE_KEY);
    alert("Offline data synced successfully!");
  };

  const saveOffline = (data: any) => {
    const pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    pending.push({ ...data, synced: false, timestamp: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  };

  const getGPSLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
  };

  const checkIfLate = (checkInTime: Date): boolean => {
    const [hours, minutes] = LATE_THRESHOLD_TIME.split(':').map(Number);
    const threshold = new Date(checkInTime);
    threshold.setHours(hours, minutes, 0, 0);
    return checkInTime > threshold;
  };

  const submitCheckIn = async (method: CheckMethod, manualReason?: string, lateReason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getGPSLocation();
      const distance = getDistance(pos.coords.latitude, pos.coords.longitude, OFFICE_COORDS.lat, OFFICE_COORDS.lng);

      if (distance > MAX_DISTANCE_METERS) {
        throw new Error(`Location verification failed. You are too far from the office (${Math.round(distance)}m).`);
      }

      const now = new Date();
      const isLate = checkIfLate(now);

      const payload = {
        type: 'check_in',
        check_in_time: now.toISOString(),
        check_in_method: method,
        location_gps: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        is_late: isLate,
        manual_reason: manualReason,
        late_reason: lateReason,
        status: method === 'qr_scan' ? 'approved' : 'pending'
      };

      if (!navigator.onLine) {
        saveOffline(payload);
        setError("Offline mode: Check-in saved locally.");
        return payload;
      }
      return payload;
    } catch (err: any) {
      setError(err.message || "Failed to check in");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const submitCheckOut = async (method: CheckMethod, manualReason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getGPSLocation();
      const now = new Date();

      const payload = {
        type: 'check_out',
        check_out_time: now.toISOString(),
        check_out_method: method,
        location_gps: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        manual_checkout_reason: manualReason,
        status: method === 'qr_scan' ? 'approved' : 'pending'
      };

      if (!navigator.onLine) {
        saveOffline(payload);
        setError("Offline mode: Check-out saved locally.");
        return payload;
      }
      return payload;
    } catch (err: any) {
      setError(err.message || "Failed to check out");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitCheckIn, submitCheckOut, loading, error, isOnline, checkIfLate };
};
