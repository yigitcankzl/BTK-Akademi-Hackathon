import { useState, useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { getGeminiService, createGeminiService } from '../services/geminiAPI';
import { getErrorMessage } from '../utils/helpers';
import { MESSAGE_TYPES, ERROR_MESSAGES } from '../utils/constants';

export function useGemini() {
  const { state, dispatch, actionTypes } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Initialize Gemini service with current settings
  const getService = useCallback(() => {
    const { settings } = state;
    if (!settings.geminiApiKey) {
      console.error('No Gemini API key found in settings:', settings);
      throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
    }
    console.log('Initializing Gemini service with API key:', settings.geminiApiKey.substring(0, 10) + '...');
    return createGeminiService(settings.geminiApiKey, settings.selectedModel);
  }, [state.settings]);

  // Generate content with text prompt
  const generateContent = useCallback(async (prompt, options = {}) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const service = getService();
      const response = await service.generateContent(prompt, {
        ...state.settings,
        ...options,
      });


      return response;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      

      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [state.settings, dispatch, actionTypes, getService]);

  // Generate content with image
  const generateContentWithImage = useCallback(async (prompt, imageData, mimeType, options = {}) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const service = getService();
      const response = await service.generateContentWithImage(prompt, imageData, {
        ...state.settings,
        mimeType,
        model: state.settings.selectedModel.includes('vision') 
          ? state.settings.selectedModel 
          : 'gemini-pro-vision',
        ...options,
      });


      return response;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      

      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [state.settings, dispatch, actionTypes, getService]);

  // Stream content generation
  const streamContent = useCallback(async (prompt, onChunk, options = {}) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const service = getService();
      
      abortControllerRef.current = new AbortController();
      
      await service.streamContent(prompt, onChunk, {
        ...state.settings,
        ...options,
      });

      // Update analytics
      dispatch({
        type: actionTypes.INCREMENT_REQUEST_COUNT,
        payload: { success: true },
      });

    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Stream was aborted, don't treat as error
      }
      
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      

      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [state.settings, dispatch, actionTypes, getService]);

  // Send message in conversation
  const sendMessage = useCallback(async (message, conversationId, options = {}) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const startTime = Date.now();
      
      // Find conversation
      const conversation = state.conversations.find(conv => conv.id === conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Add user message to conversation
      const userMessage = {
        id: Date.now().toString(),
        type: MESSAGE_TYPES.USER,
        content: message,
        timestamp: new Date().toISOString(),
      };

      dispatch({
        type: actionTypes.ADD_MESSAGE,
        payload: {
          conversationId,
          message: userMessage,
        },
      });

      // Prepare conversation history for context
      const messages = [...conversation.messages, userMessage].map(msg => ({
        role: msg.type === MESSAGE_TYPES.USER ? 'user' : 'assistant',
        content: msg.content,
      }));

      const service = getService();
      const response = await service.generateConversationResponse(messages, {
        ...state.settings,
        ...options,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Add assistant response to conversation
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: MESSAGE_TYPES.ASSISTANT,
        content: response.text,
        timestamp: new Date().toISOString(),
        metadata: {
          finishReason: response.finishReason,
          safetyRatings: response.safetyRatings,
          responseTime,
        },
      };

      dispatch({
        type: actionTypes.ADD_MESSAGE,
        payload: {
          conversationId,
          message: assistantMessage,
        },
      });

      // Update analytics
      dispatch({
        type: actionTypes.INCREMENT_REQUEST_COUNT,
        payload: { success: true },
      });

      dispatch({
        type: actionTypes.ADD_RESPONSE_TIME,
        payload: responseTime,
      });

      if (response.usageMetadata) {
        dispatch({
          type: actionTypes.UPDATE_ANALYTICS,
          payload: {
            tokensUsed: state.analyticsData.tokensUsed + (response.usageMetadata.totalTokenCount || 0),
          },
        });
      }

      return assistantMessage;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      
      // Add error message to conversation
      const errorMessage_obj = {
        id: (Date.now() + 2).toString(),
        type: MESSAGE_TYPES.ERROR,
        content: errorMessage,
        timestamp: new Date().toISOString(),
      };

      dispatch({
        type: actionTypes.ADD_MESSAGE,
        payload: {
          conversationId,
          message: errorMessage_obj,
        },
      });


      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [state.conversations, state.settings, dispatch, actionTypes, getService]);

  // Count tokens
  const countTokens = useCallback(async (text, model = null) => {
    try {
      const service = getService();
      return await service.countTokens(text, model || state.settings.selectedModel);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [state.settings, getService]);

  // Test connection
  const testConnection = useCallback(async () => {
    try {
      setError(null);
      const service = getService();
      return await service.testConnection();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        error: err,
      };
    }
  }, [getService]);

  // Abort current generation
  const abortGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isGenerating,
    error,
    
    // Methods
    generateContent,
    generateContentWithImage,
    streamContent,
    sendMessage,
    countTokens,
    testConnection,
    abortGeneration,
    clearError,
  };
}

export default useGemini;
