import { supabase } from '../config/supabase.js';

export class GroupChat {
  static async create(groupData) {
    const { name, post_id, admin_id, member_ids = [] } = groupData;
    
    const { data, error } = await supabase
      .from('group_chats')
      .insert([{
        name,
        post_id,
        admin_id,
        member_ids: [...new Set([admin_id, ...member_ids])], // Ensure admin is included
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async findById(id) {
    const { data, error } = await supabase
      .from('group_chats')
      .select(`
        *,
        admin:users!group_chats_admin_id_fkey(id, username),
        post:posts!group_chats_post_id_fkey(id, heading),
        last_message:messages!group_chats_last_message_id_fkey(*)
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  static async findByPost(postId) {
    const { data, error } = await supabase
      .from('group_chats')
      .select('*')
      .eq('post_id', postId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  static async addMember(groupId, userId) {
    // First get current members
    const { data: group, error: fetchError } = await supabase
      .from('group_chats')
      .select('member_ids')
      .eq('id', groupId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const updatedMembers = [...new Set([...group.member_ids, userId])];
    
    const { data, error } = await supabase
      .from('group_chats')
      .update({ member_ids: updatedMembers })
      .eq('id', groupId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async removeMember(groupId, userId) {
    // First get current members
    const { data: group, error: fetchError } = await supabase
      .from('group_chats')
      .select('member_ids')
      .eq('id', groupId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const updatedMembers = group.member_ids.filter(id => id !== userId);
    
    const { data, error } = await supabase
      .from('group_chats')
      .update({ member_ids: updatedMembers })
      .eq('id', groupId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async updateLastMessage(groupId, messageId) {
    const { data, error } = await supabase
      .from('group_chats')
      .update({ 
        last_message_id: messageId,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}