import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Leaderboard from './Leaderboard';
import RpgStatusBar from './RpgStatusBar';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { leaderboard, users } = useApp();
  const me = users.find((u) => u.id === user?.id) || user;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full max-w-full bg-transparent p-3 sm:p-4 pb-24 md:pb-4 space-y-4">
      <RpgStatusBar users={users} currentUser={me} />
      <Leaderboard leaderboard={leaderboard} />
    </div>
  );
}
