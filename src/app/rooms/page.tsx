import { createClient } from '../../lib/supabaseServer';
import { redirect } from 'next/navigation';
import RoomsLobby from '../../components/rooms/RoomsLobby';

export default async function RoomsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch active rooms, joining profiles to get the host's username
  const { data: rooms, error } = await supabase
    .from('study_rooms')
    .select(`
      id,
      name,
      is_private,
      created_at,
      host_id,
      host:profiles!host_id (
        username,
        rank_title
      )
    `)
    .order('created_at', { ascending: false });

  // Map the nested join to a flat structure for the client
  const formattedRooms = (rooms || []).map((room: any) => {
    const hostData = Array.isArray(room.host) ? room.host[0] : room.host;
    return {
      id: room.id,
      name: room.name,
      is_private: room.is_private,
      created_at: room.created_at,
      host_id: room.host_id,
      host_username: hostData?.username || 'Unknown Host',
      host_rank: hostData?.rank_title || 'Unranked'
    };
  });

  return <RoomsLobby initialRooms={formattedRooms} userId={user.id} />;
}
