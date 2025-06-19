import { supabase } from '../config/supabase.js';

export class Review {
  static async create(reviewData) {
    const {
      author_id,
      title,
      content,
      rating,
      category = 'general',
      tags = []
    } = reviewData;
    
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        author_id,
        title,
        content,
        rating,
        category,
        tags,
        is_active: true
      }])
      .select(`
        *,
        author:users!reviews_author_id_fkey(id, username, bio)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async findAll(filters = {}) {
    const { category, limit = 20, user_id } = filters;
    
    const { data, error } = await supabase
      .rpc('get_reviews_with_votes', {
        requesting_user_id: user_id,
        category_filter: category,
        limit_count: limit
      });
    
    if (error) throw error;
    return data || [];
  }
  
  static async findById(id, userId = null) {
    const { data, error } = await supabase
      .rpc('get_reviews_with_votes', {
        requesting_user_id: userId,
        limit_count: 1
      })
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  static async findByAuthor(authorId) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        author:users!reviews_author_id_fkey(id, username, bio)
      `)
      .eq('author_id', authorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  static async vote(reviewId, userId, voteType) {
    const { error } = await supabase
      .rpc('vote_on_review', {
        review_id: reviewId,
        user_id: userId,
        vote_type: voteType
      });
    
    if (error) throw error;
    return true;
  }
  
  static async removeVote(reviewId, userId) {
    const { error } = await supabase
      .rpc('remove_vote_from_review', {
        review_id: reviewId,
        user_id: userId
      });
    
    if (error) throw error;
    return true;
  }
  
  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        author:users!reviews_author_id_fkey(id, username, bio)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async delete(id) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
  
  static async getStats() {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating, category')
      .eq('is_active', true);
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      averageRating: data.length > 0 ? data.reduce((sum, review) => sum + review.rating, 0) / data.length : 0,
      categories: {}
    };
    
    data.forEach(review => {
      if (!stats.categories[review.category]) {
        stats.categories[review.category] = 0;
      }
      stats.categories[review.category]++;
    });
    
    return stats;
  }
}