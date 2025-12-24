
import React, { useState, useEffect } from 'react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Request permission on mount
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  // Mocking the scan success for this environment as we don't have a physical QR to point at
  const simulateScan = () => {
    // In a real app, this would be a payload from html5-qrcode
    const mockPayload = btoa(JSON.stringify({
      salt: "AKTIVATE_BURUNDI_2024",
      validUntil: new Date(Date.now() + 1000000).toISOString(),
      week: Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    }));
    onScan(mockPayload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-xs aspect-square border-4 border-dashed border-indigo-500 rounded-2xl flex items-center justify-center relative overflow-hidden bg-slate-900 shadow-[0_0_50px_rgba(79,70,229,0.3)]">
        {hasPermission === false ? (
          <div className="text-center p-4">
            <i className="fas fa-camera-slash text-4xl mb-4 text-slate-500"></i>
            <p>Camera permission denied.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-pulse">
            <i className="fas fa-qrcode text-6xl text-indigo-400 mb-4"></i>
            <p className="text-slate-400 text-sm">Align QR code within the frame</p>
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-scan"></div>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-slate-300">
        Position the office QR code inside the frame to check in automatically.
      </p>

      <div className="mt-12 flex gap-4">
        <button 
          onClick={simulateScan}
          className="bg-indigo-600 px-6 py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition-transform"
        >
          <i className="fas fa-vial mr-2"></i>
          Simulate Success
        </button>
        <button 
          onClick={onClose}
          className="bg-slate-800 px-6 py-3 rounded-xl font-semibold text-slate-300"
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
