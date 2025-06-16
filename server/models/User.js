import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

export class User {
  static async create(userData) {
    const { username, email, password, bio = '', sports = [], tags = [] } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password: hashedPassword,
        bio,
        sports,
        tags,
        is_online: false,
        last_seen: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  static async findByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
  
  static async updateOnlineStatus(userId, isOnline) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async search(query, sport, tag) {
    let queryBuilder = supabase
      .from('users')
      .select('id, username, bio, sports, tags, is_online');
    
    if (query) {
      queryBuilder = queryBuilder.or(`username.ilike.%${query}%,bio.ilike.%${query}%`);
    }
    
    if (sport) {
      queryBuilder = queryBuilder.contains('sports', [sport]);
    }
    
    if (tag) {
      queryBuilder = queryBuilder.contains('tags', [tag]);
    }
    
    const { data, error } = await queryBuilder.limit(20);
    
    if (error) throw error;
    return data;
  }
  
  static async follow(followerId, followingId) {
    // Add to followers
    const { error: followerError } = await supabase
      .from('user_followers')
      .insert([{ follower_id: followerId, following_id: followingId }]);
    
    if (followerError) throw followerError;
    return true;
  }
  
  static async unfollow(followerId, followingId) {
    const { error } = await supabase
      .from('user_followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    
    if (error) throw error;
    return true;
  }
  
  static async getFollowers(userId) {
    const { data, error } = await supabase
      .from('user_followers')
      .select('follower_id, users!user_followers_follower_id_fkey(id, username)')
      .eq('following_id', userId);
    
    if (error) throw error;
    return data.map(item => item.users);
  }
  
  static async getFollowing(userId) {
    const { data, error } = await supabase
      .from('user_followers')
      .select('following_id, users!user_followers_following_id_fkey(id, username)')
      .eq('follower_id', userId);
    
    if (error) throw error;
    return data.map(item => item.users);
  }
}