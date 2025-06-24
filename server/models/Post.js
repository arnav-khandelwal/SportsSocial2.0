import { supabase } from '../config/supabase.js';

export class Post {
  // Helper constants and functions for sport matching
  static TRADITIONAL_SPORTS = [
    'Football', 'Basketball', 'Tennis', 'Soccer', 'Baseball', 'Volleyball',
    'Swimming', 'Running', 'Cycling', 'Golf', 'Hockey', 'Cricket', 'Rugby',
    'Badminton', 'Table Tennis'
  ];
  
  static ESPORTS = [
    'Valorant', 'BGMI', 'EAFC', 'NBA 2K', 'League of Legends',
    'Call of Duty', 'Minecraft', 'Apex Legends', 'Other Online Games'
  ];
  
  // Case-insensitive sport matching
  static matchSport(sportName) {
    const lowerSportName = sportName.toLowerCase();
    
    // Try to find in traditional sports first
    const traditionalMatch = this.TRADITIONAL_SPORTS.find(
      s => s.toLowerCase() === lowerSportName
    );
    if (traditionalMatch) {
      return {
        normalizedName: traditionalMatch,
        type: 'TRADITIONAL'
      };
    }
    
    // Try to find in esports
    const esportMatch = this.ESPORTS.find(
      s => s.toLowerCase() === lowerSportName
    );
    if (esportMatch) {
      return {
        normalizedName: esportMatch,
        type: 'ESPORT'
      };
    }
    
    // Default fallback
    return {
      normalizedName: sportName,
      type: 'OTHER'
    };
  }
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
    
    // Ensure sport is always an array format
    const sportArray = Array.isArray(sport) ? sport : [sport];
    
    // Use our helper to determine sport type and get normalized name
    const { type: sportType, normalizedName } = Post.matchSport(sportArray[0]);
    
    // Update the sport array with the normalized name
    const normalizedSportArray = [normalizedName];
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        author_id,
        sport: normalizedSportArray,
        sport_type: sportType,
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
    // Use the static sport lists
    const TRADITIONAL_SPORTS = Post.TRADITIONAL_SPORTS;
    const ESPORTS = Post.ESPORTS;
    
    // Debug logging
    console.log("Filters received:", JSON.stringify(filters));
    
    // Debug logging 
    console.log("Filters received:", JSON.stringify(filters));
    
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
      
      // Process and apply filtering - make case-insensitive
      let sportsArray = Array.isArray(filters.sports) ? 
        filters.sports.filter(s => {
          return TRADITIONAL_SPORTS.some(sport => sport.toLowerCase() === s.toLowerCase());
        }) : [];
      let esportsArray = Array.isArray(filters.esports) ? 
        filters.esports.filter(s => {
          return ESPORTS.some(esport => esport.toLowerCase() === s.toLowerCase());
        }) : [];
      let filterType = filters.filterType || 'ALL';
      let sportFilterArr = [];
      let sportTypeFilter = undefined;
      
      if (filterType === 'SPORTS_ONLY') {
        sportFilterArr = sportsArray.length > 0 ? sportsArray : TRADITIONAL_SPORTS;
        sportTypeFilter = 'TRADITIONAL';
      } else if (filterType === 'ESPORTS_ONLY') {
        sportFilterArr = esportsArray.length > 0 ? esportsArray : ESPORTS;
        sportTypeFilter = 'ESPORT';
      } else {
        // When not using toggles, use exactly what was selected
        sportFilterArr = [...sportsArray, ...esportsArray];
        
        // Only apply sport type filter if only one type is selected
        if (sportsArray.length > 0 && esportsArray.length === 0) {
          sportTypeFilter = 'TRADITIONAL';
        } else if (esportsArray.length > 0 && sportsArray.length === 0) {
          sportTypeFilter = 'ESPORT';
        }
      }
      
      console.log("Sport filter array:", sportFilterArr);
      console.log("Sport type filter:", sportTypeFilter);
      
      if (sportFilterArr.length > 0) {
        // For all sport filtering cases, use individual ilike queries with OR
        console.log(`Using ilike for sports filtering with ${sportFilterArr.length} sports`);
        
        if (sportFilterArr.length === 1) {
          // Single sport case
          query = query.ilike('sport', `%${sportFilterArr[0]}%`);
        } else {
          // Multiple sports case - build OR conditions
          let filterString = sportFilterArr.map((sport, index) => {
            return `sport.ilike.%${sport}%`;
          }).join(',');
          
          console.log(`Using or filter string: ${filterString}`);
          query = query.or(filterString);
        }
      }
      
      // Apply sport type filter if specified (and we aren't already filtering by specific sports)
      if (sportTypeFilter && (filterType === 'SPORTS_ONLY' || filterType === 'ESPORTS_ONLY' || sportFilterArr.length === 0)) {
        console.log(`Applying sport_type filter: ${sportTypeFilter}`);
        query = query.eq('sport_type', sportTypeFilter);
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
      
      if (postsError) {
        console.error("Query error:", postsError);
        throw postsError;
      }
      
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
      
      // Process and apply filtering - make case-insensitive
      let sportsArray = Array.isArray(filters.sports) ? 
        filters.sports.filter(s => {
          return TRADITIONAL_SPORTS.some(sport => sport.toLowerCase() === s.toLowerCase());
        }) : [];
      let esportsArray = Array.isArray(filters.esports) ? 
        filters.esports.filter(s => {
          return ESPORTS.some(esport => esport.toLowerCase() === s.toLowerCase());
        }) : [];
      let filterType = filters.filterType || 'ALL';
      let sportFilterArr = [];
      let sportTypeFilter = undefined;
      
      if (filterType === 'SPORTS_ONLY') {
        sportFilterArr = sportsArray.length > 0 ? sportsArray : TRADITIONAL_SPORTS;
        sportTypeFilter = 'TRADITIONAL';
      } else if (filterType === 'ESPORTS_ONLY') {
        sportFilterArr = esportsArray.length > 0 ? esportsArray : ESPORTS;
        sportTypeFilter = 'ESPORT';
      } else {
        // When not using toggles, use exactly what was selected
        sportFilterArr = [...sportsArray, ...esportsArray];
        
        // Only apply sport type filter if only one type is selected
        if (sportsArray.length > 0 && esportsArray.length === 0) {
          sportTypeFilter = 'TRADITIONAL';
        } else if (esportsArray.length > 0 && sportsArray.length === 0) {
          sportTypeFilter = 'ESPORT';
        }
      }
      
      console.log("Sport filter array (no geo):", sportFilterArr);
      console.log("Sport type filter (no geo):", sportTypeFilter);
      
      if (sportFilterArr.length > 0) {
        // For all sport filtering cases, use individual ilike queries with OR
        console.log(`Using ilike for sports filtering with ${sportFilterArr.length} sports (no geo)`);
        
        if (sportFilterArr.length === 1) {
          // Single sport case
          query = query.ilike('sport', `%${sportFilterArr[0]}%`);
        } else {
          // Multiple sports case - build OR conditions
          let filterString = sportFilterArr.map((sport, index) => {
            return `sport.ilike.%${sport}%`;
          }).join(',');
          
          console.log(`Using or filter string: ${filterString}`);
          query = query.or(filterString);
        }
      }
      
      // Apply sport type filter if specified (and we aren't already filtering by specific sports)
      if (sportTypeFilter && (filterType === 'SPORTS_ONLY' || filterType === 'ESPORTS_ONLY' || sportFilterArr.length === 0)) {
        console.log(`Applying sport_type filter (no geo): ${sportTypeFilter}`);
        query = query.eq('sport_type', sportTypeFilter);
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
      
      if (error) {
        console.error("Query error (no geo):", error);
        throw error;
      }
      
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