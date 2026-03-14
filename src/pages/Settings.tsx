import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Signed in as <span className="font-medium text-foreground">{user?.email ?? '—'}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Log out to stop syncing your data to your Supabase account on this device.
        </p>
        <div className="mt-4">
          <Button variant="destructive" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
