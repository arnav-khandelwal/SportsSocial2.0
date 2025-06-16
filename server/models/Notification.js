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
        user_id: userId,
        limit_count: limit
      });
    
    if (error) throw error;
    return data;
  }
  
  static async markAsRead(userId, notificationIds = null) {
    const { data, error } = await supabase
      .rpc('mark_notifications_as_read', {
        user_id: userId,
        notification_ids: notificationIds
      });
    
    if (error) throw error;
    return data;
  }
  
  static async getUnreadCount(userId) {
    const { data, error } = await supabase
      .rpc('get_unread_notification_count', {
        user_id: userId
      });
    
    if (error) throw error;
    return data;
  }
  
  static async markAllAsRead(userId) {
    return await this.markAsRead(userId, null);
  }
}