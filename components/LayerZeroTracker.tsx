"use client";

import React from 'react';
import { useLayerZeroTracking } from '../hooks/useLayerZeroTracking';
import { layerZeroTracker } from '../services/layerzero-tracker';

interface LayerZeroTrackerProps {
  guid: string;
  autoStart?: boolean;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ProgressIndicator: React.FC<{ step: 'waiting' | 'found' | 'delivered' | 'failed'; isActive: boolean }> = ({ step, isActive }) => {
  const getStepInfo = () => {
    switch (step) {
      case 'waiting':
        return { icon: '🔍', label: 'Searching', color: 'text-yellow-400' };
      case 'found':
        return { icon: '📡', label: 'Found', color: 'text-blue-400' };
      case 'delivered':
        return { icon: '✅', label: 'Delivered', color: 'text-green-400' };
      case 'failed':
        return { icon: '❌', label: 'Failed', color: 'text-red-400' };
    }
  };

  const { icon, label, color } = getStepInfo();
  
  return (
    <div className={`flex flex-col items-center space-y-1 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
      <div className={`text-2xl ${isActive ? 'animate-pulse' : ''}`}>
        {icon}
      </div>
      <span className={`text-xs ${color} font-medium`}>
        {label}
      </span>
    </div>
  );
};

export const LayerZeroTracker: React.FC<LayerZeroTrackerProps> = ({ guid, autoStart = false }) => {
  const { trackingState, startTracking, stopTracking, reset } = useLayerZeroTracking();

  React.useEffect(() => {
    if (autoStart && guid && !trackingState.isTracking) {
      startTracking(guid);
    }
  }, [autoStart, guid, startTracking, trackingState.isTracking]);

  const handleStartTracking = () => {
    if (guid) {
      startTracking(guid);
    }
  };

  const layerZeroScanLink = layerZeroTracker.getLayerZeroScanLink(guid);
  const polygonBlockscoutLink = trackingState.result?.polygonTxHash 
    ? layerZeroTracker.getPolygonBlockscoutLink(trackingState.result.polygonTxHash)
    : null;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">Cross-Chain Tracking</h4>
        {trackingState.isTracking && (
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>⏱️</span>
            <span>{formatTime(trackingState.progress.timeElapsed)}</span>
          </div>
        )}
      </div>

      {/* GUID Display */}
      <div className="mb-4">
        <p className="text-sm text-gray-300 mb-1">LayerZero Message ID:</p>
        <p className="font-mono text-xs text-white bg-white/10 p-2 rounded break-all">
          {guid}
        </p>
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-between items-center mb-6 px-4">
        <ProgressIndicator 
          step="waiting" 
          isActive={trackingState.progress.step === 'waiting'} 
        />
        <div className="flex-1 h-0.5 bg-white/20 mx-4">
          <div 
            className={`h-full bg-gradient-to-r from-yellow-400 to-blue-400 transition-all duration-500 ${
              ['found', 'delivered', 'failed'].includes(trackingState.progress.step) ? 'w-full' : 'w-0'
            }`}
          />
        </div>
        <ProgressIndicator 
          step="found" 
          isActive={trackingState.progress.step === 'found'} 
        />
        <div className="flex-1 h-0.5 bg-white/20 mx-4">
          <div 
            className={`h-full bg-gradient-to-r from-blue-400 to-green-400 transition-all duration-500 ${
              ['delivered'].includes(trackingState.progress.step) ? 'w-full' : 'w-0'
            }`}
          />
        </div>
        <ProgressIndicator 
          step="delivered" 
          isActive={trackingState.progress.step === 'delivered'} 
        />
      </div>

      {/* Status Message */}
      <div className="mb-4">
        <p className="text-sm text-gray-300 mb-1">Status:</p>
        <p className={`text-sm p-3 rounded-lg ${
          trackingState.progress.step === 'delivered' ? 'bg-green-900/30 text-green-300' :
          trackingState.progress.step === 'failed' ? 'bg-red-900/30 text-red-300' :
          'bg-blue-900/30 text-blue-300'
        }`}>
          {trackingState.progress.message || 'Ready to track LayerZero message'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!trackingState.isTracking && !trackingState.result && (
          <button
            onClick={handleStartTracking}
            disabled={!guid}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Start Tracking
          </button>
        )}

        {trackingState.isTracking && (
          <button
            onClick={stopTracking}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Stop Tracking
          </button>
        )}

        {trackingState.result && !trackingState.isTracking && (
          <div className="space-y-2">
            <button
              onClick={reset}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Reset Tracker
            </button>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="mt-6 space-y-3">
        <div>
          <a
            href={layerZeroScanLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            <span>View on LayerZeroScan</span>
            <span>🔗</span>
          </a>
        </div>

        {polygonBlockscoutLink && (
          <div>
            <p className="text-sm text-gray-300 mb-2">Polygon Transaction:</p>
            <a
              href={polygonBlockscoutLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              <span>View on Polygon Blockscout</span>
              <span>🔗</span>
            </a>
            <p className="text-xs text-gray-400 mt-1 font-mono break-all">
              {trackingState.result?.polygonTxHash}
            </p>
          </div>
        )}
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && trackingState.result && (
        <details className="mt-4">
          <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
          <pre className="text-xs text-gray-400 mt-2 bg-black/20 p-2 rounded overflow-auto">
            {JSON.stringify(trackingState.result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}; 