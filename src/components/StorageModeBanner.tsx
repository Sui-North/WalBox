import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Cloud, Shield, AlertTriangle } from 'lucide-react';

/**
 * Check if Web Crypto API is available
 */
const isCryptoAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.crypto && 
         window.crypto.subtle !== undefined;
};

/**
 * Banner to inform users about storage mode (Mock vs Walrus) and encryption status
 */
export const StorageModeBanner = () => {
  const walrusEndpoint = import.meta.env.VITE_WALRUS_ENDPOINT || 'https://walrus-api.example.com';
  const isMockMode = walrusEndpoint.includes('example.com');
  const cryptoAvailable = isCryptoAvailable();
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div className="space-y-3 mb-6">
      {/* Storage Mode Banner */}
      {isMockMode && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <span>
                <strong>Development Mode:</strong> Files are stored locally in your browser (IndexedDB).
                For production, configure Walrus storage endpoint in <code className="bg-blue-100 px-1 rounded">.env</code>
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Encryption Status Banner */}
      {!cryptoAvailable && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>
                <strong>Encryption Disabled:</strong> Web Crypto API requires HTTPS or localhost.
                {!isLocalhost && ' Files are uploaded without encryption in development mode.'}
                {isLocalhost && ' This should work on localhost - try restarting your browser.'}
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Encryption Enabled Banner */}
      {cryptoAvailable && (
        <Alert className="bg-green-50 border-green-200">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 text-sm">
            <div className="flex items-center gap-2">
              <span>
                <strong>Encryption Active:</strong> Files are encrypted with AES-256 before upload.
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
