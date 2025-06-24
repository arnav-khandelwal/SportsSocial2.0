import { supabase } from '../config/supabase.js';

export class Post {
  static async create(postData) {
    const {
      author_id,
      sport,
      heading,
      description,
      tags = [],
      location,
      location_name,
      event_time,
      players_needed
    } = postData;
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        author_id,
        sport,
        heading,
        description,
        tags,
        location: `POINT(${location.coordinates[0]} ${location.coordinates[1]})`,
        location_name,
        event_time,
        players_needed,
        is_active: true
      }])
      .select(`
        *,
        author:users!posts_author_id_fkey(id, username, bio),
        interested_users:post_interests(user_id, users(id, username))
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async findNearby(lat, lng, radius = 25000, filters = {}) {
    // If geolocation is provided, use RPC function first to get post IDs with distances
    if (lat && lng) {
      // First, get post IDs within radius using RPC
      const { data: nearbyPostIds, error: rpcError } = await supabase
        .rpc('posts_within_radius', {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius_meters: parseInt(radius)
        });
      
      if (rpcError) throw rpcError;
      
      if (!nearbyPostIds || nearbyPostIds.length === 0) {
        return [];
      }
      
      // Extract post IDs from RPC result
      const postIds = nearbyPostIds.map(item => item.id);
      
      // Now fetch full post details with relationships
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(id, username, bio),
          interested_users:post_interests(user_id, users(id, username))
        `)
        .in('id', postIds)
        .eq('is_active', true)
        .gte('event_time', new Date().toISOString());
      
      // Apply filters
      if (filters.sport && filters.sport.trim() !== '') {
        // Handle comma-separated list of sports/games for multi-select filtering
        const sportsArray = filters.sport.split(',').filter(s => s.trim() !== '');
        
        if (sportsArray.length === 1) {
          // Single sport/game selected
          query = query.ilike('sport', `%${sportsArray[0].trim()}%`);
        } else if (sportsArray.length > 1) {
          // Multiple sports/games selected - build OR filter
          // Note: Limited OR support in Supabase requires creating a filter string
          const filterString = sportsArray.map(sport => 
            `sport.ilike.%${sport.trim()}%`).join(',');
          query = query.or(filterString);
        }
      }
      
      if (filters.date) {
        const startDate = new Date(filters.date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        
        query = query
          .gte('event_time', startDate.toISOString())
          .lt('event_time', endDate.toISOString());
      }
      
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      
      const { data: posts, error: postsError } = await query
        .order('event_time', { ascending: true })
        .limit(parseInt(filters.limit) || 10);
      
      if (postsError) throw postsError;
      
      // Merge distance information back into posts
      const postsWithDistance = posts.map(post => {
        const nearbyPost = nearbyPostIds.find(item => item.id === post.id);
        return {
          ...post,
          distance: nearbyPost ? nearbyPost.distance : null
        };
      });
      
      return postsWithDistance;
    } else {
      // No geolocation provided, use regular query
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(id, username, bio),
          interested_users:post_interests(user_id, users(id, username))
        `)
        .eq('is_active', true)
        .gte('event_time', new Date().toISOString());
      
      // Apply filters
      if (filters.sport && filters.sport.trim() !== '') {
        // Handle comma-separated list of sports/games for multi-select filtering
        const sportsArray = filters.sport.split(',').filter(s => s.trim() !== '');
        
        if (sportsArray.length === 1) {
          // Single sport/game selected
          query = query.ilike('sport', `%${sportsArray[0].trim()}%`);
        } else if (sportsArray.length > 1) {
          // Multiple sports/games selected - build OR filter
          const filterString = sportsArray.map(sport => 
            `sport.ilike.%${sport.trim()}%`).join(',');
          query = query.or(filterString);
        }
      }
      
      if (filters.date) {
        const startDate = new Date(filters.date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        
        query = query
          .gte('event_time', startDate.toISOString())
          .lt('event_time', endDate.toISOString());
      }
      
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      
      const { data, error } = await query
        .order('event_time', { ascending: true })
        .limit(parseInt(filters.limit) || 10);
      
      if (error) throw error;
      return data;
    }
  }
  
  static async findById(id) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, username, bio),
        interested_users:post_interests(user_id, users(id, username))
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  static async findByAuthor(authorId) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, username, bio),
        interested_users:post_interests(user_id, users(id, username))
      `)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  static async addInterest(postId, userId) {
    const { data, error } = await supabase
      .from('post_interests')
      .insert([{ post_id: postId, user_id: userId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async removeInterest(postId, userId) {
    const { error } = await supabase
      .from('post_interests')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }
  
  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        author:users!posts_author_id_fkey(id, username, bio),
        interested_users:post_interests(user_id, users(id, username))
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async delete(id) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}