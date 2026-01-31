'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  User, 
  Mail, 
  CreditCard, 
  Bell, 
  Shield,
  Save,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const supabase = createClient();

  const handleUpdateProfile = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name },
      });

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!subscription?.customerPortalUrl) {
      toast.error('No active subscription found');
      return;
    }

    window.open(subscription.customerPortalUrl, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Profile</h2>
            <p className="text-sm text-slate-600">Update your personal information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Subscription Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Subscription</h2>
            <p className="text-sm text-slate-600">Manage your billing and plan</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600">Current Plan</span>
            <span className="font-semibold text-slate-900">
              {subscription?.status === 'active' 
                ? (subscription.planType === 'lifetime' ? 'Lifetime' : 
                   subscription.planType === 'yearly' ? 'Pro (Yearly)' : 'Pro (Monthly)')
                : 'Free'
              }
            </span>
          </div>
          {subscription?.status === 'active' && subscription.planType !== 'lifetime' && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Renews On</span>
              <span className="font-medium text-slate-900">
                {subscription.renewsAt 
                  ? new Date(subscription.renewsAt).toLocaleDateString()
                  : 'N/A'
                }
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {subscription?.status === 'active' ? (
            <Button variant="secondary" onClick={handleManageBilling}>
              Manage Billing
              <ExternalLink className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => window.location.href = '/app/upgrade'}>
              Upgrade to Pro
            </Button>
          )}
        </div>
      </Card>

      {/* Notifications Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-600">Configure email notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-700">Thesis generation complete</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-700">Weekly usage summary</span>
            <input type="checkbox" className="w-5 h-5 rounded text-blue-600" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-700">Product updates & features</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600" />
          </label>
        </div>
      </Card>

      {/* Security Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Security</h2>
            <p className="text-sm text-slate-600">Manage your account security</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button variant="secondary" onClick={() => {
            supabase.auth.resetPasswordForEmail(user?.email || '', {
              redirectTo: `${window.location.origin}/auth/reset-password`,
            });
            toast.success('Password reset email sent');
          }}>
            Change Password
          </Button>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Danger Zone</p>
            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
