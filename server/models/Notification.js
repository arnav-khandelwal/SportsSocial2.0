import { supabase } from '../config/supabase.js';

export class Notification {
  static async create(notificationData) {
    const { user_id, type, title, message, data = {} } = notificationData;
    
    const { data: notification, error } = await supabase
      .rpc('create_notification', {
        recipient_id: user_id,
        notification_type: type,
        notification_title: title,
        notification_message: message,
        notification_data: data
      });
    
    if (error) throw error;
    return notification;
  }
  
  static async getUserNotifications(userId, limit = 20) {
    const { data, error } = await supabase
      .rpc('get_user_notifications', {
        uid: userId,
        limit_count: limit
      });
    
    if (error) {
      console.error('getUserNotifications error:', error);
      throw error;
    }
    return data;
  }
  
  static async markAsRead(userId, notificationIds = null) {
    const { data, error } = await supabase
      .rpc('mark_notifications_as_read', {
        uid: userId,
        notification_ids: notificationIds
      });
    
    if (error) {
      console.error('markAsRead error:', error);
      throw error;
    }
    return data;
  }
  
  static async getUnreadCount(userId) {
    const { data, error } = await supabase
      .rpc('get_unread_notification_count', {
        uid: userId
      });
    
    if (error) {
      console.error('getUnreadCount error:', error);
      throw error;
    }
    return data;
  }
  
  static async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .rpc('mark_all_notifications_as_read', {
          uid: userId
        });
      
      if (error) {
        console.error('markAllAsRead error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('markAllAsRead error:', error);
      // Fallback to using the markAsRead method if the dedicated function fails
      return await this.markAsRead(userId, null);
    }
  }
}