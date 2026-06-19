/**
 * Database type definitions
 */

export interface Generation {
  id: string;
  source_url: string;
  extracted_content: string | null;
  slides_json: unknown | null;
  captions: unknown | null;
  hashtags: string[] | null;
  ip_hash: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  branding_handle: string | null;
  branding_style: string | null;
  profile_pic_url: string | null;
  show_source: boolean | null;
  user_profile_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface GenerationInsert {
  id?: string;
  source_url: string;
  extracted_content?: string | null;
  slides_json?: unknown | null;
  captions?: unknown | null;
  hashtags?: string[] | null;
  ip_hash: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  branding_handle?: string | null;
  branding_style?: string | null;
  profile_pic_url?: string | null;
  show_source?: boolean | null;
  user_profile_id?: string | null;
  created_at?: string;
  completed_at?: string | null;
}

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
