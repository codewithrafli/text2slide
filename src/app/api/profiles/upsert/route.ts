import { getServiceClient } from '@/lib/db/client';
import { UserProfileInsert } from '@/lib/db/types';
import { uploadProfilePicture } from '@/lib/storage/upload';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/profiles/upsert
 * Create or update a user profile
 * - If handle exists: Update profile (and delete old photo if new one uploaded)
 * - If handle new: Create new profile
 */
import { RateLimitError } from '@/lib/errors';
import { checkRateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

/**
 * POST /api/profiles/upsert
 * Create or update a user profile
 */
export async function POST(request: NextRequest) {
  const serviceClient = getServiceClient();
  try {
    // Get IP for rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Check rate limit (reusing same limit as scrape for consistency)
    await checkRateLimit(`profile_${ip}`);

    const formData = await request.formData();
    const id = formData.get('id') as string | null;
    const handle = (formData.get('handle') as string) || '';
    const profilePicFile = formData.get('profilePic') as File | null;

    if (!handle.trim() && !id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_HANDLE', message: 'Handle is required' },
        },
        { status: 400 }
      );
    }

    const cleanHandle = handle.replace('@', '').trim().toLowerCase();

    // 1. Find profile by handle (this is the source of truth for "identity" in this app)
    const { data: profileByHandle } = await serviceClient
      .from('user_profiles')
      .select('*')
      .eq('handle', cleanHandle)
      .maybeSingle();

    // 2. Find profile by ID (if provided)
    let profileById = null;
    if (id) {
      const { data } = await serviceClient
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      profileById = data;
    }

    // Determine which record to update
    // Priority:
    // - If handle exists, update that record (handle ownership)
    // - Else if ID exists, update that record (updating handle)
    // - Else, create new
    const targetProfile = profileByHandle || profileById;

    let profilePicUrl: string | null = targetProfile?.profile_pic_url || null;

    // If new photo uploaded
    if (profilePicFile && profilePicFile.size > 0) {
      // CRITICAL: We NO LONGER delete the old photo here.
      // Why? Because older carousels point to the old photo's URL.
      // Deleting it would cause 'broken images' on all previous results.
      /* 
      if (targetProfile?.profile_pic_url) {
        await deleteProfilePicture(targetProfile.profile_pic_url);
      }
      */

      // Upload new photo
      const { url, error: uploadError } = await uploadProfilePicture(
        profilePicFile,
        `profile-${cleanHandle}`
      );

      if (uploadError) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'UPLOAD_FAILED', message: uploadError },
          },
          { status: 500 }
        );
      }

      profilePicUrl = url;
    }

    // Upsert data
    const upsertData: UserProfileInsert = {
      handle: cleanHandle,
      profile_pic_url: profilePicUrl,
      updated_at: new Date().toISOString(),
    };

    // If we have a target ID, use it to ensure update instead of insert
    if (targetProfile?.id) {
      upsertData.id = targetProfile.id;
    } else if (id) {
      // Fallback if targetProfile was null but we had an ID (shouldn't really happen with logic above)
      upsertData.id = id;
    }

    const { data: profile, error: upsertError } = await serviceClient
      .from('user_profiles')
      .upsert(upsertData)
      .select()
      .single();

    if (upsertError) {
      console.error('Profile upsert error:', upsertError);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: upsertError.message },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          handle: profile.handle,
          profilePicUrl: profile.profile_pic_url,
        },
      },
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RATE_LIMITED', message: error.message },
        },
        { status: 429, headers: { 'X-RateLimit-Reset': String(error.resetAt) } }
      );
    }
    console.error('Upsert profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to upsert profile',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profiles/upsert?id=xxx
 * Fetch a user profile by ID
 */
export async function GET(request: NextRequest) {
  const serviceClient = getServiceClient();
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('id');

    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_ID', message: 'Profile ID is required' },
        },
        { status: 400 }
      );
    }

    const { data: profile, error } = await serviceClient
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Profile not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          handle: profile.handle,
          profilePicUrl: profile.profile_pic_url,
        },
      },
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch profile',
        },
      },
      { status: 500 }
    );
  }
}
