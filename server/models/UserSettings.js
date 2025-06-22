import { supabase } from '../config/supabase.js';

export class UserSettings {
  static async getSettings(userId) {
    const { data, error } = await supabase
      .rpc('get_user_settings', { target_user_id: userId });
    
    if (error) throw error;
    return data[0] || null;
  }
  
  static async updateSettings(userId, settingsData) {
    const { data, error } = await supabase
      .rpc('upsert_user_settings', {
        target_user_id: userId,
        settings_data: settingsData
      });
    
    if (error) throw error;
    return data;
  }
  
  static async getSkills(userId) {
    const { data, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)
      .order('sport');
    
    if (error) throw error;
    return data;
  }
  
  static async updateSkills(userId, skills) {
    // Delete existing skills
    await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', userId);
    
    // Insert new skills
    if (skills.length > 0) {
      const { data, error } = await supabase
        .from('user_skills')
        .insert(skills.map(skill => ({
          user_id: userId,
          sport: skill.sport,
          skill_level: skill.skill_level
        })))
        .select();
      
      if (error) throw error;
      return data;
    }
    
    return [];
  }
  
  static async getAvailability(userId) {
    const { data, error } = await supabase
      .from('user_availability')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data;
  }
  
  static async updateAvailability(userId, availability) {
    // Delete existing availability
    await supabase
      .from('user_availability')
      .delete()
      .eq('user_id', userId);
    
    // Insert new availability
    if (availability.length > 0) {
      const { data, error } = await supabase
        .from('user_availability')
        .insert(availability.map(slot => ({
          user_id: userId,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available
        })))
        .select();
      
      if (error) throw error;
      return data;
    }
    
    return [];
  }
  
  static async uploadProfileMedia(userId, mediaType, fileData) {
    // In a real implementation, you would upload to a storage service
    // For now, we'll just store the URL
    const { data, error } = await supabase
      .from('user_profile_media')
      .insert([{
        user_id: userId,
        media_type: mediaType,
        file_name: fileData.fileName,
        file_size: fileData.fileSize,
        mime_type: fileData.mimeType,
        url: fileData.url,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update user settings with the new media URL
    const updateField = mediaType === 'profile_picture' ? 'profile_picture_url' : 'cover_photo_url';
    await this.updateSettings(userId, { [updateField]: fileData.url });
    
    return data;
  }
  
  static async changePassword(userId, currentPassword, newPassword) {
    // This would typically involve verifying the current password
    // and updating it in the auth system
    // For Supabase, you'd use the auth API
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return data;
  }
}