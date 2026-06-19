/**
 * Database queries
 */

import { getServiceClient, supabase } from './client';
import type { Generation, GenerationInsert } from './types';

export async function createGeneration(
  data: GenerationInsert
): Promise<Generation> {
  const client = getServiceClient();

  const { data: result, error } = await client
    .from('generations')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create generation: ${error.message}`);
  }

  return result as Generation;
}

export async function updateGeneration(
  id: string,
  data: Partial<GenerationInsert>
): Promise<Generation> {
  const client = getServiceClient();

  const { data: result, error } = await client
    .from('generations')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update generation: ${error.message}`);
  }

  return result as Generation;
}

export async function getGeneration(id: string): Promise<Generation | null> {
  const { data, error } = await supabase
    .from('generations')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get generation: ${error.message}`);
  }

  return data as Generation;
}
