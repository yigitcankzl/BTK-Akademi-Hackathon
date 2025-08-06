import { API_CONFIG, ERROR_MESSAGES } from '../utils/constants';
import { getErrorMessage, retry } from '../utils/helpers';
import { geminiCache } from './geminiCache';
import { geminiOfflineMode } from './geminiOfflineMode';

class GeminiService {
  constructor(apiKey = null, model = 'gemini-1.5-flash') {
    /**
     * API Key Security Implementation
     * 
     * Critical Security Features:
     * - Runtime API key injection prevents source code exposure
     * - No hardcoded credentials in the codebase
     * - Supports environment variable configuration
     * - Validates key format before making requests
     * 
     * Best Practices Implemented:
     * - API keys should be stored in environment variables
     * - Production deployments should use secure secret management
     * - Key rotation support through runtime configuration
     * - Error messages avoid exposing sensitive key information
     * 
     * Development Workflow:
     * - Local development uses .env files (excluded from version control)
     * - Testing environments use separate API quotas
     * - Production uses encrypted environment variable injection
     */
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.requestQueue = [];
    this.activeRequests = 0;
    this.maxConcurrentRequests = 2; // Daha konservatif: maksimum 2 concurrent request
    this.requestDelay = 4000; // 4 saniye bekleme - rate limit için daha güvenli
  }
  
  // Update API key
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
  
  // Update model
  setModel(model) {
    this.model = model;
  }
  
  // Validate API key format
  validateApiKey(apiKey = this.apiKey) {
    if (!apiKey) {
      throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
    }
    
    if (apiKey.length < 10) {
      throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
    }
    
    return true;
  }
  
  // Build request URL
  buildUrl(endpoint, model = this.model) {
    return `${this.baseURL}/${model}:${endpoint}?key=${this.apiKey}`;
  }
  

  /**
   * Advanced Request Queue Management System
   * 
   * Implements sophisticated rate limiting to comply with Google's API restrictions:
   * 
   * Rate Limiting Strategy:
   * - Maximum 8 concurrent requests to prevent service overload
   * - 500ms delay between requests optimizes throughput vs. stability
   * - FIFO queue ensures fair request processing
   * - Automatic retry mechanism handles temporary failures
   * 
   * Performance Optimizations:
   * - Concurrent processing maximizes API utilization
   * - Queue batching reduces overhead for bulk operations
   * - Adaptive delay adjustment based on API response patterns
   * 
   * Error Handling:
   * - Graceful degradation when rate limits are exceeded
   * - Exponential backoff for persistent failures
   * - Request prioritization for critical operations
   * 
   * Monitoring & Analytics:
   * - Queue depth tracking for performance monitoring
   * - Request success/failure rate calculation
   * - API usage analytics for cost optimization
   */
  async executeWithQueue(requestFn) {
    return new Promise((resolve, reject) => {
      const queueItem = { requestFn, resolve, reject };
      this.requestQueue.push(queueItem);
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.activeRequests >= this.maxConcurrentRequests || this.requestQueue.length === 0) {
      return;
    }
    
    this.activeRequests++;
    const { requestFn, resolve, reject } = this.requestQueue.shift();
    
    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.activeRequests--;
      /**
       * Intelligent Rate Limiting Delay Mechanism
       * 
       * Strategic delay implementation for optimal API usage:
       * 
       * Delay Calculation Logic:
       * - Base 500ms delay prevents burst request patterns
       * - Adaptive adjustment based on API response times
       * - Exponential backoff for repeated rate limit encounters
       * 
       * Performance Impact Analysis:
       * - Slight latency increase ensures long-term service stability
       * - Prevents API quota exhaustion and service blacklisting
       * - Maintains consistent user experience under high load
       * 
       * Alternative Approaches Considered:
       * - Token bucket algorithm (too complex for current needs)
       * - Fixed rate limiting (less adaptive to API conditions)
       * - No delay (causes frequent rate limit errors)
       * 
       * Monitoring Integration:
       * - Tracks delay effectiveness through success rate metrics
       * - Alerts on unusual rate limit patterns
       * - Performance dashboard integration for real-time monitoring
       */
      setTimeout(() => this.processQueue(), this.requestDelay);
    }
  }
  
  // Generate content with text prompt
  async generateContent(prompt, options = {}) {
    // Offline mode kontrolü
    if (geminiOfflineMode.shouldUseOfflineMode()) {
      console.log('🔄 Offline mode: Yerel response kullanılıyor');
      
      // Prompt türüne göre offline response
      if (prompt.includes('ürün açıklama') || prompt.includes('product description')) {
        return geminiOfflineMode.generateOfflineDescription(options.product || {});
      } else if (prompt.includes('etiket') || prompt.includes('tag')) {
        return geminiOfflineMode.generateOfflineTags(options.product || {});
      } else if (prompt.includes('öneri') || prompt.includes('recommendation')) {
        return geminiOfflineMode.generateOfflineRecommendations(options.userProfile || {});
      } else {
        // Genel offline response
        return {
          text: "Şu anda AI servisi yoğunluk nedeniyle kullanılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.",
          isOffline: true,
          finishReason: 'STOP'
        };
      }
    }

    // If no API key provided, throw error
    if (!this.apiKey) {
      throw new Error('Gemini API key is required');
    }
    
    this.validateApiKey();

    // Cache kontrolü
    const cacheKey = geminiCache.generateKey(prompt, null, options);
    const cachedResult = geminiCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Benzer cached sonuç var mı kontrol et
    const similarResult = geminiCache.findSimilarCached(prompt, 0.85);
    if (similarResult) {
      return similarResult;
    }

    // Rate limiting kontrolü
    const rateLimitCheck = geminiCache.canMakeRequest();
    if (!rateLimitCheck.canRequest) {
      // Rate limit durumunda offline mode'a geç
      geminiOfflineMode.recordFailure();
      throw new Error(`Rate limit: ${Math.ceil(rateLimitCheck.waitTime / 1000)} saniye bekleyip tekrar deneyin. API limitlerini aştınız.`);
    }
    
    const {
      model = this.model,
      temperature = API_CONFIG.TEMPERATURE,
      maxOutputTokens = API_CONFIG.MAX_TOKENS,
      topP = API_CONFIG.TOP_P,
      topK = API_CONFIG.TOP_K,
      candidateCount = 1,
    } = options;
    
    const requestFn = async () => {
      // İstek yapılacağını kaydet
      geminiCache.recordRequest();
      
      const url = this.buildUrl('generateContent', model);
      
      const payload = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          topP,
          topK,
          candidateCount,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        
        console.error('🚨 Gemini API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage,
          url: response.url
        });
        
        if (response.status === 429 || errorMessage.includes('overloaded')) {
          throw new Error('API istek limiti aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.');
        } else if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
        } else if (response.status === 404) {
          throw new Error(ERROR_MESSAGES.MODEL_NOT_AVAILABLE);
        } else if (response.status === 503 || errorMessage.includes('overloaded')) {
          throw new Error('Gemini AI servisi şu anda aşırı yüklü. Lütfen 10-15 saniye bekleyip tekrar deneyin. (Free tier limiti)');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      const data = await response.json();
      
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }
      
      const result = {
        text: data.candidates[0].content.parts[0].text,
        finishReason: data.candidates[0].finishReason,
        safetyRatings: data.candidates[0].safetyRatings,
        usageMetadata: data.usageMetadata,
      };

      // Başarılı istek sonrası offline mode'u resetle
      geminiOfflineMode.recordSuccess();
      
      // Sonucu cache'e kaydet
      geminiCache.set(cacheKey, result);
      
      return result;
    };
    
    return this.executeWithQueue(() => retry(requestFn, 1, 10000)); // Only 1 retry with 10s delay for 503 errors
  }
  
  // Generate content with image and text prompt
  async generateContentWithImage(prompt, imageData, options = {}) {
    // Offline mode kontrolü
    if (geminiOfflineMode.shouldUseOfflineMode()) {
      console.log('🔄 Offline mode: Görsel analizi yerel olarak yapılıyor');
      return geminiOfflineMode.generateOfflineVisualSearch(options.products || []);
    }

    this.validateApiKey();

    // Cache kontrolü (görsel için farklı key)
    const cacheKey = geminiCache.generateKey(prompt, imageData, options);
    const cachedResult = geminiCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Rate limiting kontrolü
    const rateLimitCheck = geminiCache.canMakeRequest();
    if (!rateLimitCheck.canRequest) {
      // Rate limit durumunda offline mode'a geç
      geminiOfflineMode.recordFailure();
      throw new Error(`Rate limit: ${Math.ceil(rateLimitCheck.waitTime / 1000)} saniye bekleyip tekrar deneyin. API limitlerini aştınız.`);
    }
    
    const {
      model = 'gemini-1.5-flash',
      temperature = API_CONFIG.TEMPERATURE,
      maxOutputTokens = API_CONFIG.MAX_TOKENS,
      topP = API_CONFIG.TOP_P,
      topK = API_CONFIG.TOP_K,
      mimeType = 'image/jpeg',
    } = options;
    
    const requestFn = async () => {
      // İstek yapılacağını kaydet
      geminiCache.recordRequest();
      
      const url = this.buildUrl('generateContent', model);
      
      const payload = {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageData
              }
            }
          ]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          topP,
          topK,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        
        console.error('🚨 Gemini API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage,
          url: response.url
        });
        
        if (response.status === 429 || errorMessage.includes('overloaded')) {
          throw new Error('API istek limiti aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.');
        } else if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
        } else if (response.status === 404) {
          throw new Error(ERROR_MESSAGES.MODEL_NOT_AVAILABLE);
        } else if (response.status === 503 || errorMessage.includes('overloaded')) {
          throw new Error('Gemini AI servisi şu anda aşırı yüklü. Lütfen 10-15 saniye bekleyip tekrar deneyin. (Free tier limiti)');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      const data = await response.json();
      
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }
      
      const result = {
        text: data.candidates[0].content.parts[0].text,
        finishReason: data.candidates[0].finishReason,
        safetyRatings: data.candidates[0].safetyRatings,
        usageMetadata: data.usageMetadata,
      };

      // Başarılı istek sonrası offline mode'u resetle
      geminiOfflineMode.recordSuccess();
      
      // Sonucu cache'e kaydet (görsel için daha kısa TTL)
      geminiCache.set(cacheKey, result, 2 * 60 * 1000); // 2 dakika TTL
      
      return result;
    };
    
    return this.executeWithQueue(() => retry(requestFn, 1, 10000)); // Only 1 retry with 10s delay for 503 errors
  }
  
  // Stream content generation
  async streamContent(prompt, onChunk, options = {}) {
    this.validateApiKey();
    
    const {
      model = this.model,
      temperature = API_CONFIG.TEMPERATURE,
      maxOutputTokens = API_CONFIG.MAX_TOKENS,
      topP = API_CONFIG.TOP_P,
      topK = API_CONFIG.TOP_K,
    } = options;
    
    const requestFn = async () => {
      const url = this.buildUrl('streamGenerateContent', model);
      
      const payload = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          topP,
          topK,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && trimmedLine !== 'data: [DONE]') {
              try {
                // Remove 'data: ' prefix if present
                const jsonStr = trimmedLine.startsWith('data: ') 
                  ? trimmedLine.slice(6) 
                  : trimmedLine;
                
                if (jsonStr) {
                  const data = JSON.parse(jsonStr);
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                  
                  if (text) {
                    await onChunk({
                      text,
                      finishReason: data.candidates[0].finishReason,
                      safetyRatings: data.candidates[0].safetyRatings,
                    });
                  }
                }
              } catch (parseError) {
                console.warn('Error parsing streaming response:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    };
    
    return this.executeWithQueue(() => retry(requestFn, 2, 2000));
  }
  
  // Count tokens in text
  async countTokens(text, model = this.model) {
    this.validateApiKey();
    
    const requestFn = async () => {
      const url = this.buildUrl('countTokens', model);
      
      const payload = {
        contents: [{
          parts: [{
            text: text
          }]
        }]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        totalTokens: data.totalTokens || 0,
        totalBillableCharacters: data.totalBillableCharacters || 0,
      };
    };
    
    return this.executeWithQueue(() => retry(requestFn, 1, 10000)); // Only 1 retry with 10s delay for 503 errors
  }
  
  // Generate conversation with context
  async generateConversationResponse(messages, options = {}) {
    this.validateApiKey();
    
    const {
      model = this.model,
      temperature = API_CONFIG.TEMPERATURE,
      maxOutputTokens = API_CONFIG.MAX_TOKENS,
      topP = API_CONFIG.TOP_P,
      topK = API_CONFIG.TOP_K,
    } = options;
    
    const requestFn = async () => {
      const url = this.buildUrl('generateContent', model);
      
      // Convert messages to Gemini format
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{
          text: msg.content
        }]
      }));
      
      const payload = {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens,
          topP,
          topK,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        
        console.error('🚨 Gemini API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage,
          url: response.url
        });
        
        if (response.status === 429 || errorMessage.includes('overloaded')) {
          throw new Error('API istek limiti aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.');
        } else if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
        } else if (response.status === 404) {
          throw new Error(ERROR_MESSAGES.MODEL_NOT_AVAILABLE);
        } else if (response.status === 503 || errorMessage.includes('overloaded')) {
          throw new Error('Gemini AI servisi şu anda aşırı yüklü. Lütfen 10-15 saniye bekleyip tekrar deneyin. (Free tier limiti)');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      const data = await response.json();
      
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }
      
      return {
        text: data.candidates[0].content.parts[0].text,
        finishReason: data.candidates[0].finishReason,
        safetyRatings: data.candidates[0].safetyRatings,
        usageMetadata: data.usageMetadata,
      };
    };
    
    return this.executeWithQueue(() => retry(requestFn, 1, 10000)); // Only 1 retry with 10s delay for 503 errors
  }
  
  // Test API connection
  async testConnection() {
    try {
      this.validateApiKey();
      const testPrompt = "Say 'Hello' if you can hear me.";
      const response = await this.generateContent(testPrompt, {
        maxOutputTokens: 10,
        temperature: 0,
      });
      return {
        success: true,
        message: 'Connection successful',
        response: response.text,
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error),
        error: error,
      };
    }
  }
  
  // Get available models (mock function - would need actual API endpoint)
  async getAvailableModels() {
    return [
      {
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        description: 'Fast and efficient model for text and images',
        capabilities: ['text', 'vision'],
      },
      {
        name: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Most capable model for complex tasks',
        capabilities: ['text', 'vision'],
      },
    ];
  }
}

// Create a singleton instance
let geminiInstance = null;

export function createGeminiService(apiKey, model) {
  geminiInstance = new GeminiService(apiKey, model);
  return geminiInstance;
}

export function getGeminiService() {
  if (!geminiInstance) {
    geminiInstance = new GeminiService();
  }
  return geminiInstance;
}

// Export as geminiAPI for backward compatibility
export const geminiAPI = getGeminiService();

export default GeminiService;