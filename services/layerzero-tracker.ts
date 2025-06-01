// LayerZero tracking service
export interface LayerZeroMessage {
  guid: string;
  srcChainId: number;
  dstChainId: number;
  srcTxHash: string;
  dstTxHash?: string;
  status: 'INFLIGHT' | 'DELIVERED' | 'FAILED';
  srcUaAddress: string;
  dstUaAddress?: string;
  created: number;
  updated: number;
  _mock?: boolean; // Flag for mock data
}

export interface LayerZeroTrackingResult {
  message?: LayerZeroMessage;
  polygonTxHash?: string;
  status: 'pending' | 'delivered' | 'failed' | 'not_found';
  error?: string;
  isMockData?: boolean;
}

class LayerZeroTracker {
  private readonly maxRetries = 30; // 5 minutes with 10s intervals
  private readonly retryInterval = 10000; // 10 seconds

  /**
   * Fetch LayerZero message details using our API route to avoid CORS
   */
  async fetchMessage(guid: string): Promise<LayerZeroMessage | null> {
    try {
      const response = await fetch(`/api/cross-chain?provider=layerzero&hash=${guid}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Message not found yet
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle error responses from our API
      if (data.error) {
        if (data.error.includes('404')) {
          return null; // Message not found yet
        }
        throw new Error(data.error);
      }
      
      return data as LayerZeroMessage;
    } catch (error) {
      console.error('Error fetching LayerZero message:', error);
      return null;
    }
  }

  /**
   * Poll LayerZeroScan until the message is delivered or timeout
   */
  async trackMessage(
    guid: string,
    onUpdate?: (result: LayerZeroTrackingResult) => void
  ): Promise<LayerZeroTrackingResult> {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        const message = await this.fetchMessage(guid);
        
        if (!message) {
          // Message not found yet, continue polling
          onUpdate?.({
            status: 'pending',
            error: retries === 0 ? 'Waiting for LayerZero message to appear...' : undefined
          });
        } else {
          const result: LayerZeroTrackingResult = {
            message,
            status: message.status === 'DELIVERED' ? 'delivered' : 
                   message.status === 'FAILED' ? 'failed' : 'pending',
            polygonTxHash: message.dstTxHash,
            isMockData: message._mock || false
          };
          
          onUpdate?.(result);
          
          // If using mock data, simulate progression
          if (message._mock && message.status === 'INFLIGHT' && retries > 2) {
            // After a few retries, simulate delivery for mock data
            message.status = 'DELIVERED';
            message.dstTxHash = guid.replace('0x', '0x1');
            result.status = 'delivered';
            result.polygonTxHash = message.dstTxHash;
          }
          
          // If delivered or failed, return the result
          if (message.status === 'DELIVERED' || message.status === 'FAILED') {
            return result;
          }
        }
        
        retries++;
        
        // Wait before next retry
        if (retries < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryInterval));
        }
      } catch (error) {
        console.error('Error in LayerZero tracking:', error);
        retries++;
        
        if (retries < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryInterval));
        }
      }
    }
    
    // Timeout reached
    return {
      status: 'pending',
      error: 'Timeout: LayerZero message delivery is taking longer than expected'
    };
  }

  /**
   * Get Blockscout link for Polygon transaction
   */
  getPolygonBlockscoutLink(txHash: string): string {
    return `https://polygon.blockscout.com/tx/${txHash}`;
  }

  /**
   * Get LayerZeroScan link for the message
   */
  getLayerZeroScanLink(guid: string): string {
    return `https://layerzeroscan.com/tx/${guid}`;
  }
}

export const layerZeroTracker = new LayerZeroTracker(); 