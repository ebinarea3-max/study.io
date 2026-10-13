'use server';

import { createClient, createAdminClient } from '@/lib/supabaseServer';

export interface UpdateRoomParams {
  roomId: string;
  name: string;
  password: string | null;
  is_private: boolean;
  max_capacity: number;
}

export async function updateRoomSettingsAction(params: UpdateRoomParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'User session not found on server.' };
    }

    const trimmedName = params.name?.trim() || '';
    if (!trimmedName) {
      return { success: false, error: 'Room name cannot be empty.' };
    }

    const trimmedPass = params.password?.trim() || '';
    const willBePrivate = Boolean(params.is_private && trimmedPass.length > 0);
    const capacity = Math.max(2, Math.min(100, Number(params.max_capacity) || 4));

    // 1. Try with admin service client if available
    const admin = createAdminClient();
    if (admin) {
      const { data: room, error: roomErr } = await admin
        .from('study_rooms')
        .select('id, host_id')
        .eq('id', params.roomId)
        .maybeSingle();

      if (roomErr || !room) {
        return { success: false, error: 'Study room not found.' };
      }

      if (room.host_id !== user.id) {
        return { success: false, error: 'Only the room host can update settings.' };
      }

      const { data: updated, error: updateErr } = await admin
        .from('study_rooms')
        .update({
          name: trimmedName,
          password: willBePrivate ? trimmedPass : null,
          is_private: willBePrivate,
          max_capacity: capacity,
        })
        .eq('id', params.roomId)
        .select()
        .single();

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      return { success: true, room: updated };
    }

    // 2. Otherwise run using authenticated user context
    const { data, error } = await supabase
      .from('study_rooms')
      .update({
        name: trimmedName,
        password: willBePrivate ? trimmedPass : null,
        is_private: willBePrivate,
        max_capacity: capacity,
      })
      .eq('id', params.roomId)
      .eq('host_id', user.id)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Database permission error: No rows updated. public.study_rooms lacks an UPDATE policy in Supabase.',
      };
    }

    return { success: true, room: data[0] };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred while updating room.' };
  }
}

export interface BanMemberParams {
  roomId: string;
  targetUserId: string;
  targetUsername?: string;
}

export async function banRoomMemberAction(params: BanMemberParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'User session not found on server.' };
    }

    if (user.id === params.targetUserId) {
      return { success: false, error: 'The room host cannot ban themselves.' };
    }

    const admin = createAdminClient();
    const client = admin || supabase;

    // Verify user is host
    const { data: room, error: roomErr } = await client
      .from('study_rooms')
      .select('id, host_id')
      .eq('id', params.roomId)
      .maybeSingle();

    if (roomErr || !room) {
      return { success: false, error: 'Study room not found.' };
    }

    if (room.host_id !== user.id) {
      return { success: false, error: 'Only the room host can ban members.' };
    }

    // 1. Remove from room_members
    await client
      .from('room_members')
      .delete()
      .eq('room_id', params.roomId)
      .eq('user_id', params.targetUserId);

    // 2. Remove from room_presence
    await client
      .from('room_presence')
      .delete()
      .eq('room_id', params.roomId)
      .eq('user_id', params.targetUserId);

    // 3. Post system ban message in room_messages
    const banPayload = JSON.stringify({
      type: 'ban',
      userId: params.targetUserId,
      username: params.targetUsername || 'Scholar',
      timestamp: Date.now(),
    });

    await client
      .from('room_messages')
      .insert([
        {
          room_id: params.roomId,
          user_id: user.id,
          content: `[SYSTEM_BAN]:${banPayload}`,
        },
      ]);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to ban room member.' };
  }
}

export async function unbanRoomMemberAction(params: BanMemberParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'User session not found on server.' };
    }

    const admin = createAdminClient();
    const client = admin || supabase;

    // Verify user is host
    const { data: room, error: roomErr } = await client
      .from('study_rooms')
      .select('id, host_id')
      .eq('id', params.roomId)
      .maybeSingle();

    if (roomErr || !room) {
      return { success: false, error: 'Study room not found.' };
    }

    if (room.host_id !== user.id) {
      return { success: false, error: 'Only the room host can unban members.' };
    }

    // Post system unban message in room_messages
    const unbanPayload = JSON.stringify({
      type: 'unban',
      userId: params.targetUserId,
      username: params.targetUsername || 'Scholar',
      timestamp: Date.now(),
    });

    await client
      .from('room_messages')
      .insert([
        {
          room_id: params.roomId,
          user_id: user.id,
          content: `[SYSTEM_UNBAN]:${unbanPayload}`,
        },
      ]);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to unban room member.' };
  }
}

