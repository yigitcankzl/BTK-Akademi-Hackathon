import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { NOTIFICATION_TYPES } from '../../utils/constants';

const NotificationContainer = () => {
  const { state, dispatch, actionTypes } = useApp();
  const { notifications } = state;

  const removeNotification = (id) => {
    dispatch({
      type: actionTypes.REMOVE_NOTIFICATION,
      payload: id,
    });
  };

  const getIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return CheckCircle;
      case NOTIFICATION_TYPES.ERROR:
        return AlertCircle;
      case NOTIFICATION_TYPES.WARNING:
        return AlertTriangle;
      case NOTIFICATION_TYPES.INFO:
        return Info;
      default:
        return Info;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return {
          container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          icon: 'text-green-400',
          title: 'text-green-800 dark:text-green-200',
          message: 'text-green-600 dark:text-green-300',
          button: 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300'
        };
      case NOTIFICATION_TYPES.ERROR:
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: 'text-red-400',
          title: 'text-red-800 dark:text-red-200',
          message: 'text-red-600 dark:text-red-300',
          button: 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
        };
      case NOTIFICATION_TYPES.WARNING:
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-400',
          title: 'text-yellow-800 dark:text-yellow-200',
          message: 'text-yellow-600 dark:text-yellow-300',
          button: 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
        };
      case NOTIFICATION_TYPES.INFO:
      default:
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-400',
          title: 'text-blue-800 dark:text-blue-200',
          message: 'text-blue-600 dark:text-blue-300',
          button: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
        };
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-4 max-w-sm w-full">
      {notifications.map((notification) => {
        const Icon = getIcon(notification.type);
        const styles = getStyles(notification.type);
        
        return (
          <NotificationItem
            key={notification.id}
            notification={notification}
            Icon={Icon}
            styles={styles}
            onRemove={removeNotification}
          />
        );
      })}
    </div>
  );
};

const NotificationItem = ({ notification, Icon, styles, onRemove }) => {
  const { id, title, message, type, duration = 5000, persistent = false } = notification;

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, persistent, onRemove]);

  return (
    <div className={`border rounded-lg p-4 shadow-lg backdrop-blur-sm transition-all duration-300 animate-slide-in-right ${styles.container}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title}`}>
              {title}
            </h3>
          )}
          {message && (
            <p className={`text-sm ${title ? 'mt-1' : ''} ${styles.message}`}>
              {message}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={() => onRemove(id)}
            className={`inline-flex rounded-md p-1.5 transition-colors duration-200 ${styles.button}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for adding notifications
export const useNotification = () => {
  const { dispatch, actionTypes } = useApp();

  const addNotification = (notification) => {
    const id = Date.now().toString();
    dispatch({
      type: actionTypes.ADD_NOTIFICATION,
      payload: {
        id,
        ...notification,
        timestamp: new Date().toISOString(),
      },
    });
    return id;
  };

  const removeNotification = (id) => {
    dispatch({
      type: actionTypes.REMOVE_NOTIFICATION,
      payload: id,
    });
  };

  const success = (title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title,
      message,
      ...options,
    });
  };

  const error = (title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title,
      message,
      persistent: true, // Errors are persistent by default
      ...options,
    });
  };

  const warning = (title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      title,
      message,
      ...options,
    });
  };

  const info = (title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title,
      message,
      ...options,
    });
  };

  return {
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
  };
};

export default NotificationContainer;
