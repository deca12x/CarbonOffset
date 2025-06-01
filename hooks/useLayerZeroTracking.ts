import { useState, useEffect, useCallback } from 'react';
import { layerZeroTracker, LayerZeroTrackingResult } from '../services/layerzero-tracker';

export interface LayerZeroTrackingState {
  isTracking: boolean;
  result: LayerZeroTrackingResult | null;
  progress: {
    step: 'waiting' | 'found' | 'delivered' | 'failed';
    message: string;
    timeElapsed: number;
  };
}

export const useLayerZeroTracking = () => {
  const [trackingState, setTrackingState] = useState<LayerZeroTrackingState>({
    isTracking: false,
    result: null,
    progress: {
      step: 'waiting',
      message: '',
      timeElapsed: 0
    }
  });

  const [startTime, setStartTime] = useState<number | null>(null);

  // Update time elapsed
  useEffect(() => {
    if (!trackingState.isTracking || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTrackingState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          timeElapsed: elapsed
        }
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [trackingState.isTracking, startTime]);

  const startTracking = useCallback(async (guid: string) => {
    setStartTime(Date.now());
    setTrackingState({
      isTracking: true,
      result: null,
      progress: {
        step: 'waiting',
        message: 'Starting LayerZero message tracking...',
        timeElapsed: 0
      }
    });

    try {
      const result = await layerZeroTracker.trackMessage(guid, (update) => {
        setTrackingState(prev => {
          let step: 'waiting' | 'found' | 'delivered' | 'failed' = 'waiting';
          let message = '';

          if (update.message) {
            step = 'found';
            if (update.status === 'delivered') {
              step = 'delivered';
              message = 'Message delivered to Polygon! Transaction confirmed.';
            } else if (update.status === 'failed') {
              step = 'failed';
              message = 'Message delivery failed.';
            } else {
              message = 'Message found, waiting for delivery to Polygon...';
            }
          } else {
            message = update.error || 'Waiting for LayerZero message to appear...';
          }

          return {
            ...prev,
            result: update,
            progress: {
              ...prev.progress,
              step,
              message
            }
          };
        });
      });

      // Final update
      setTrackingState(prev => ({
        ...prev,
        isTracking: false,
        result,
        progress: {
          ...prev.progress,
          step: result.status === 'delivered' ? 'delivered' : 
                result.status === 'failed' ? 'failed' : 'waiting',
          message: result.status === 'delivered' ? 'Message delivered to Polygon!' :
                  result.status === 'failed' ? 'Message delivery failed.' :
                  result.error || 'Tracking completed.'
        }
      }));

    } catch (error) {
      setTrackingState(prev => ({
        ...prev,
        isTracking: false,
        progress: {
          ...prev.progress,
          step: 'failed',
          message: `Tracking error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    }
  }, []);

  const stopTracking = useCallback(() => {
    setTrackingState(prev => ({
      ...prev,
      isTracking: false
    }));
    setStartTime(null);
  }, []);

  const reset = useCallback(() => {
    setTrackingState({
      isTracking: false,
      result: null,
      progress: {
        step: 'waiting',
        message: '',
        timeElapsed: 0
      }
    });
    setStartTime(null);
  }, []);

  return {
    trackingState,
    startTracking,
    stopTracking,
    reset
  };
}; 