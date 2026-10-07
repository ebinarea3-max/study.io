export default function StudyRoomsTab({ onBackToDashboard }: { onBackToDashboard?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] bg-[#07090e] border-2 border-amber-500/50 rounded-xl p-8">
      <h2 className="text-3xl font-bold text-amber-500 mb-4">Study Rooms Lobby</h2>
      <p className="text-gray-400">If you can see this, the tab routing is working perfectly.</p>
    </div>
  );
}
