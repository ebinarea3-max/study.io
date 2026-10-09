const channelRef = useRef<any>(null);
const isSubscribedRef = useRef<boolean>(false); // <-- 1. NEW REF: The Traffic Light
const messagesEndRef = useRef<HTMLDivElement>(null);

// Fetch Room Details
useEffect(() => {
  const fetchRoom = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.from('study_rooms').select('name').eq('id', roomId).single();
    if (data) setRoomName(data.name);
  };
  fetchRoom();
}, [roomId]);

// 1. Establish the Realtime channels (Presence and Chat isolated)
useEffect(() => {
  if (!user?.id) return;

  const supabase = getSupabase();
  if (!supabase) return;

  // Reset traffic light on mount
  isSubscribedRef.current = false;

  // Channel 1 (Avatars/Presence):
  const presenceChannel = supabase.channel(`presence_room_${roomId}`, {
    config: { presence: { key: user.id } }
  });
  channelRef.current = presenceChannel;

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      setPresentUsers(Object.values(state).flat());
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true; // <-- 2. LIGHT TURNS GREEN
        await presenceChannel.track({
          user_id: user.id,
          username: profile?.username || user?.email || 'Scholar',
          avatar_url: profile?.avatar_url || null,
          is_studying: isTimerRunning,
          session_start_time: isTimerRunning ? Date.now() : null
        });
      }
    });

  // Channel 2 (Chat Messages):
  const chatChannel = supabase.channel(`chat_room_${roomId}`);

  chatChannel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
      const fetchNewMsg = async () => {
        const { data } = await supabase
          .from('room_messages')
          .select(`id, content, created_at, user_id, profiles ( username, avatar_url )`)
          .eq('id', payload.new.id)
          .single();
        if (data) setMessages(prev => [...prev, data]);
      };
      fetchNewMsg();
    })
    .subscribe();

  // Clean up both channels on unmount
  return () => {
    isSubscribedRef.current = false; // <-- 3. LIGHT TURNS RED
    supabase.removeChannel(presenceChannel);
    supabase.removeChannel(chatChannel);
    channelRef.current = null;
  };
}, [roomId, user?.id]);

// 2. Update tracking state WITHOUT destroying the channel
useEffect(() => {
  // 4. CRITICAL FIX: Only fire track if the traffic light is GREEN
  if (channelRef.current && user?.id && isSubscribedRef.current) {
    channelRef.current.track({
      user_id: user.id,
      username: profile?.username || user?.email || 'Scholar',
      avatar_url: profile?.avatar_url || null,
      is_studying: isTimerRunning,
      session_start_time: isTimerRunning ? Date.now() : null
    }).catch(console.error);
  }
}, [isTimerRunning, user?.id]);