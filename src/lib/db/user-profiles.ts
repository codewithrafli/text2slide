/**
 * Database types for user profiles
 */

export interface UserProfile {
  id: string;
  handle: string;
  profile_pic_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInsert {
  id?: string;
  handle: string;
  profile_pic_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfileUpdate {
  handle?: string;
  profile_pic_url?: string | null;
  updated_at?: string;
}
