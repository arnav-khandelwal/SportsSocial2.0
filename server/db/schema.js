import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  bio: text('bio'),
  profilePicture: text('profile_picture'),
  favoriteTeams: text('favorite_teams'), // JSON string
  favoriteSports: text('favorite_sports'), // JSON string
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  sport: text('sport'),
  team: text('team'),
  imageUrl: text('image_url'),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  senderId: integer('sender_id').notNull().references(() => users.id),
  receiverId: integer('receiver_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  read: integer('read').default(0), // 0 for false, 1 for true
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const groupChats = sqliteTable('group_chats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  sport: text('sport'),
  team: text('team'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  members: text('members'), // JSON string of user IDs
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});