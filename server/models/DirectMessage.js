import { supabase } from '../config/supabase.js';

export class DirectMessage {
  static async sendMessage(senderId, recipientId, content) {
    try {
      const { data, error } = await supabase
        .rpc('send_direct_message', {
          sender_id: senderId,
          recipient_id: recipientId,
          message_content: content
        });
      
      if (error) {
        console.error('Send direct message error:', error);
        throw error;
      }
      
      // Get the created message with sender info
      const { data: messageData, error: fetchError } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:users!direct_messages_sender_id_fkey(id, username)
        `)
        .eq('id', data)
        .single();
      
      if (fetchError) {
        console.error('Fetch message error:', fetchError);
        throw fetchError;
      }
      
      return messageData;
    } catch (error) {
      console.error('DirectMessage sendMessage error:', error);
      throw error;
    }
  }
  
  static async getConversationMessages(conversationId, userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_direct_conversation_messages', {
          conversation_id: conversationId,
          requesting_user_id: userId
        });
      
      if (error) {
        console.error('Get conversation messages error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('DirectMessage getConversationMessages error:', error);
      throw error;
    }
  }
  
  static async markMessagesAsRead(conversationId, userId) {
    try {
      const { error } = await supabase
        .rpc('mark_direct_messages_as_read', {
          conversation_id: conversationId,
          reader_id: userId
        });
      
      if (error) {
        console.error('Mark messages as read error:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('DirectMessage markMessagesAsRead error:', error);
      throw error;
    }
  }
  
  static async getUserConversations(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_direct_conversations', {
          user_id: userId
        });
      
      if (error) {
        console.error('Get user conversations error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('DirectMessage getUserConversations error:', error);
      throw error;
    }
  }
  
  static async getUnreadCount(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_direct_messages_unread_count', {
          user_id: userId
        });
      
      if (error) {
        console.error('Get unread count error:', error);
        throw error;
      }
      
      return data || 0;
    } catch (error) {
      console.error('DirectMessage getUnreadCount error:', error);
      throw error;
    }
  }
  
  static async getOrCreateConversation(user1Id, user2Id) {
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_direct_conversation', {
          user1_id: user1Id,
          user2_id: user2Id
        });
      
      if (error) {
        console.error('Get or create conversation error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('DirectMessage getOrCreateConversation error:', error);
      throw error;
    }
  }
}