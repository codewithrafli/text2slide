/**
 * API for generation results
 */

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/db/client';
import { GenerationInsert } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/result/[id] - Fetch saved generation result
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const client = getServiceClient(); // Use service role for guaranteed fresh data

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_INPUT', message: 'ID is required' },
        },
        { status: 400 }
      );
    }

    const { data: generation, error } = await client
      .from('generations')
      .select()
      .eq('id', id)
      .single();

    if (error || !generation) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Result not found' },
        },
        { status: 404 }
      );
    }

    // Return with no-cache headers
    return new NextResponse(
      JSON.stringify({
        success: true,
        data: {
          id: generation.id,
          sourceUrl: generation.source_url,
          slides: generation.slides_json,
          captions: generation.captions,
          hashtags: generation.hashtags,
          createdAt: generation.created_at,
          personalization: {
            handle: generation.branding_handle,
            style: generation.branding_style,
            profilePic: generation.profile_pic_url,
            showSource: generation.show_source ?? false,
          },
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Get result error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/result/[id] - Update generation result
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getServiceClient();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_INPUT', message: 'ID is required' },
        },
        { status: 400 }
      );
    }

    const updateData: Partial<GenerationInsert> = {};
    if (body.slides) updateData.slides_json = body.slides;
    if (body.personalization) {
      const p = body.personalization;
      if (p.handle !== undefined) updateData.branding_handle = p.handle;
      if (p.style !== undefined) updateData.branding_style = p.style;
      if (p.profilePic !== undefined) updateData.profile_pic_url = p.profilePic;
      if (p.showSource !== undefined) updateData.show_source = p.showSource;
    }

    const { data, error } = await client
      .from('generations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] DB Update Error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Update result error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update result' },
      },
      { status: 500 }
    );
  }
}
