import { supabase } from '../config/supabase.js';

export class UserPreferences {
  static async create(preferencesData) {
    const {
      user_id,
      notification_follows = true,
      notification_interests = true,
      notification_nearby_posts = true,
      notification_messages = true,
      location = null,
      location_name = null,
      nearby_radius = 25000
    } = preferencesData;
    
    const { data, error } = await supabase
      .from('user_preferences')
      .insert([{
        user_id,
        notification_follows,
        notification_interests,
        notification_nearby_posts,
        notification_messages,
        location: location ? `POINT(${location.coordinates[0]} ${location.coordinates[1]})` : null,
        location_name,
        nearby_radius
      }])
      .select()
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  static async update(userId, updateData) {
    const { data, error } = await supabase
      .from('user_preferences')
      .update({
        ...updateData,
        location: updateData.location ? `POINT(${updateData.location.coordinates[0]} ${updateData.location.coordinates[1]})` : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async upsert(preferencesData) {
    const existing = await this.findByUserId(preferencesData.user_id);
    
    if (existing) {
      return await this.update(preferencesData.user_id, preferencesData);
    } else {
      return await this.create(preferencesData);
    }
  }
}