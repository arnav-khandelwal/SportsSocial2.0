import { supabase } from '../config/supabase.js';

export class Message {
  static async create(messageData) {
    try {
      const { sender_id, recipient_id, group_chat_id, content, message_type } = messageData;
      
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id,
          recipient_id,
          group_chat_id,
          content,
          message_type,
          is_deleted: false,
          is_read: false
        }])
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, username)
        `)
        .single();
      
      if (error) {
        console.error('Some Message create error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Message create catch error:', error);
      throw error;
    }
  }
  
  static async findDirectMessages(userId1, userId2) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, username)
        `)
        .eq('message_type', 'direct')
        .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Find direct messages error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Find direct messages catch error:', error);
      throw error;
    }
  }
  
  static async findGroupMessages(groupChatId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, username)
        `)
        .eq('group_chat_id', groupChatId)
        .eq('message_type', 'group')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Find group messages error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Find group messages catch error:', error);
      throw error;
    }
  }
  
  static async markAsRead(messageId, userId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Mark as read error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Mark as read catch error:', error);
      throw error;
    }
  }
  
  static async markDirectMessagesAsRead(userId1, userId2) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('message_type', 'direct')
        .eq('sender_id', userId2)
        .eq('recipient_id', userId1)
        .eq('is_read', false);
      
      if (error) {
        console.error('Mark direct messages as read error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Mark direct messages as read catch error:', error);
      throw error;
    }
  }
  
  static async markGroupMessagesAsRead(groupChatId, userId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('group_chat_id', groupChatId)
        .eq('message_type', 'group')
        .neq('sender_id', userId)
        .eq('is_read', false);
      
      if (error) {
        console.error('Mark group messages as read error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Mark group messages as read catch error:', error);
      throw error;
    }
  }
  
  static async getUnreadCount(userId) {
    try {
      // Get unread direct messages count
      const { data: directUnread, error: directError } = await supabase
        .from('messages')
        .select('id')
        .eq('message_type', 'direct')
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .eq('is_deleted', false);
      
      if (directError) {
        console.error('Get unread direct messages error:', directError);
        throw directError;
      }
      
      // Get unread group messages count using a simpler query
      const { data: groupUnread, error: groupError } = await supabase
        .from('messages')
        .select('id, group_chat_id')
        .eq('message_type', 'group')
        .neq('sender_id', userId)
        .eq('is_read', false)
        .eq('is_deleted', false);
      
      if (groupError) {
        console.error('Get unread group messages error:', groupError);
        // Don't throw error for group messages, just return 0
        return {
          direct: directUnread?.length || 0,
          group: 0,
          total: directUnread?.length || 0
        };
      }
      
      // Filter group messages where user is a member
      let groupCount = 0;
      if (groupUnread && groupUnread.length > 0) {
        const groupIds = [...new Set(groupUnread.map(m => m.group_chat_id))];
        const { data: userGroups, error: userGroupsError } = await supabase
          .from('group_chats')
          .select('id')
          .in('id', groupIds)
          .contains('member_ids', [userId]);
        
        if (!userGroupsError && userGroups) {
          const userGroupIds = userGroups.map(g => g.id);
          groupCount = groupUnread.filter(m => userGroupIds.includes(m.group_chat_id)).length;
        }
      }
      
      return {
        direct: directUnread?.length || 0,
        group: groupCount,
        total: (directUnread?.length || 0) + groupCount
      };
    } catch (error) {
      console.error('Get unread count catch error:', error);
      throw error;
    }
  }
  
  static async getConversations(userId) {
    try {
      // Get direct message conversations with unread counts using the function
      const { data: directMessages, error: dmError } = await supabase
        .rpc('get_direct_conversations_with_unread', { user_id: userId });
      
      if (dmError) {
        console.error('Get direct conversations error:', dmError);
        // If function doesn't exist, fall back to basic query
        const { data: fallbackDM, error: fallbackError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!messages_sender_id_fkey(id, username),
            recipient:users!messages_recipient_id_fkey(id, username)
          `)
          .eq('message_type', 'direct')
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (fallbackError) {
          throw fallbackError;
        }
        
        // Process fallback data to get unique conversations
        const conversations = new Map();
        (fallbackDM || []).forEach(msg => {
          const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
          const partner = msg.sender_id === userId ? msg.recipient : msg.sender;
          
          if (!conversations.has(partnerId)) {
            conversations.set(partnerId, {
              id: partnerId,
              username: partner?.username || 'Unknown',
              is_online: false,
              last_message_content: msg.content,
              last_message_time: msg.created_at,
              unread_count: 0
            });
          }
        });
        
        return {
          directMessages: Array.from(conversations.values()),
          groupChats: []
        };
      }
      
      // Get group chat conversations
      const { data: groupChats, error: gcError } = await supabase
        .from('group_chats')
        .select(`
          *,
          last_message:messages!group_chats_last_message_id_fkey(*)
        `)
        .contains('member_ids', [userId])
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      
      if (gcError) {
        console.error('Get group chats error:', gcError);
        return {
          directMessages: directMessages || [],
          groupChats: []
        };
      }
      
      // Add unread count for each group chat
      const groupChatsWithUnread = await Promise.all(
        (groupChats || []).map(async (group) => {
          try {
            const { data: unreadCount, error } = await supabase
              .from('messages')
              .select('id')
              .eq('group_chat_id', group.id)
              .eq('message_type', 'group')
              .neq('sender_id', userId)
              .eq('is_read', false)
              .eq('is_deleted', false);
            
            return {
              ...group,
              unread_count: unreadCount?.length || 0
            };
          } catch (error) {
            console.error('Error getting unread count for group:', group.id, error);
            return {
              ...group,
              unread_count: 0
            };
          }
        })
      );
      
      return {
        directMessages: directMessages || [],
        groupChats: groupChatsWithUnread || []
      };
    } catch (error) {
      console.error('Get conversations catch error:', error);
      throw error;
    }
  }
}