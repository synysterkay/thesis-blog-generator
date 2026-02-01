'use client';

import { useState, useEffect } from 'react';
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
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Crown,
  Zap,
  RefreshCw,
  Receipt,
  Settings2,
  Clock,
  Infinity,
  Wallet,
  PenLine
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
  type: 'card' | 'paypal' | 'unknown';
  brand: string | null;
  lastFour: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  paypalEmail: string | null;
}

interface SubscriptionDetails {
  id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused' | 'on_trial';
  planType: 'free' | 'monthly' | 'yearly' | 'lifetime';
  planName: string;
  price: number;
  currency: string;
  interval: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  renewsAt: string | null;
  endsAt: string | null;
  cancelledAt: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  paymentMethod: PaymentMethod | null;
  customerEmail: string | null;
  customerPortalUrl: string | null;
  updatePaymentMethodUrl: string | null;
}

export default function SettingsPage() {
  const { user, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const fetchSubscriptionDetails = async () => {
    setLoadingSubscription(true);
    try {
      const response = await fetch('/api/subscription/details');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionDetails(data);
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

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

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    setActionLoading('cancel');
    try {
      const response = await fetch('/api/subscription/cancel', { method: 'POST' });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      
      toast.success('Subscription cancelled. You will retain access until the end of your billing period.');
      await fetchSubscriptionDetails();
      await refreshSubscription();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeSubscription = async () => {
    setActionLoading('resume');
    try {
      const response = await fetch('/api/subscription/resume', { method: 'POST' });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resume subscription');
      }
      
      toast.success('Subscription resumed successfully!');
      await fetchSubscriptionDetails();
      await refreshSubscription();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resume subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenPortal = async () => {
    setActionLoading('portal');
    try {
      const response = await fetch('/api/subscription/portal');
      const data = await response.json();
      
      if (!response.ok || !data.url) {
        throw new Error('Could not open billing portal');
      }
      
      window.open(data.url, '_blank');
    } catch (error: any) {
      toast.error(error.message || 'Failed to open billing portal');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number, interval: string | null) => {
    if (interval === 'year') return `$${price}/year`;
    if (interval === 'month') return `$${price}/month`;
    return `$${price}`;
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <AlertTriangle className="w-3 h-3" />
          Cancelling
        </span>
      );
    }
    
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3" />
            Past Due
          </span>
        );
      case 'on_trial':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3" />
            Trial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'lifetime':
        return <Infinity className="w-5 h-5 text-purple-600" />;
      case 'yearly':
        return <Crown className="w-5 h-5 text-amber-600" />;
      case 'monthly':
        return <Zap className="w-5 h-5 text-blue-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage your account, subscription, and preferences</p>
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Subscription</h2>
              <p className="text-sm text-slate-600">Manage your plan and billing</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchSubscriptionDetails}
            disabled={loadingSubscription}
          >
            <RefreshCw className={`w-4 h-4 ${loadingSubscription ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loadingSubscription ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : subscriptionDetails ? (
          <div className="space-y-6">
            {/* Plan Overview */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    subscriptionDetails.planType === 'lifetime' ? 'bg-purple-100' :
                    subscriptionDetails.planType === 'yearly' ? 'bg-amber-100' :
                    subscriptionDetails.planType === 'monthly' ? 'bg-blue-100' :
                    'bg-slate-100'
                  }`}>
                    {getPlanIcon(subscriptionDetails.planType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">
                      {subscriptionDetails.planName}
                    </h3>
                    <p className="text-slate-600">
                      {subscriptionDetails.planType === 'free' 
                        ? 'Limited features' 
                        : formatPrice(subscriptionDetails.price, subscriptionDetails.interval)
                      }
                    </p>
                  </div>
                </div>
                {getStatusBadge(subscriptionDetails.status, subscriptionDetails.cancelAtPeriodEnd)}
              </div>

              {/* Subscription Details Grid */}
              {subscriptionDetails.planType !== 'free' && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                  {subscriptionDetails.planType !== 'lifetime' && subscriptionDetails.renewsAt && !subscriptionDetails.cancelAtPeriodEnd && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Next Billing Date</p>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(subscriptionDetails.renewsAt)}
                      </p>
                    </div>
                  )}
                  
                  {subscriptionDetails.cancelAtPeriodEnd && subscriptionDetails.endsAt && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Access Until</p>
                      <p className="font-medium text-amber-600 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {formatDate(subscriptionDetails.endsAt)}
                      </p>
                    </div>
                  )}

                  {subscriptionDetails.currentPeriodStart && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                        {subscriptionDetails.planType === 'lifetime' ? 'Member Since' : 'Current Period Started'}
                      </p>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {formatDate(subscriptionDetails.currentPeriodStart)}
                      </p>
                    </div>
                  )}

                  {subscriptionDetails.planType === 'lifetime' && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Access Duration</p>
                      <p className="font-medium text-purple-600 flex items-center gap-2">
                        <Infinity className="w-4 h-4" />
                        Forever
                      </p>
                    </div>
                  )}

                  {subscriptionDetails.paymentMethod && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Payment Method</p>
                      {subscriptionDetails.paymentMethod.type === 'paypal' ? (
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-blue-500" />
                            PayPal {subscriptionDetails.paymentMethod.paypalEmail && (
                              <span className="text-slate-500 text-sm">({subscriptionDetails.paymentMethod.paypalEmail})</span>
                            )}
                          </p>
                          {subscriptionDetails.updatePaymentMethodUrl && (
                            <button
                              onClick={() => window.open(subscriptionDetails.updatePaymentMethodUrl!, '_blank')}
                              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                            >
                              <PenLine className="w-3 h-3" />
                              Update
                            </button>
                          )}
                        </div>
                      ) : subscriptionDetails.paymentMethod.type === 'card' ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900 flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-slate-400" />
                              {subscriptionDetails.paymentMethod.brand} •••• {subscriptionDetails.paymentMethod.lastFour}
                            </p>
                            {subscriptionDetails.paymentMethod.expiryMonth && subscriptionDetails.paymentMethod.expiryYear && (
                              <p className="text-xs text-slate-500 mt-0.5 ml-6">
                                Expires {subscriptionDetails.paymentMethod.expiryMonth}/{subscriptionDetails.paymentMethod.expiryYear}
                              </p>
                            )}
                          </div>
                          {subscriptionDetails.updatePaymentMethodUrl && (
                            <button
                              onClick={() => window.open(subscriptionDetails.updatePaymentMethodUrl!, '_blank')}
                              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                            >
                              <PenLine className="w-3 h-3" />
                              Update
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {subscriptionDetails.planType === 'free' ? (
                <Button onClick={() => window.location.href = '/app/upgrade'}>
                  <Crown className="mr-2 w-4 h-4" />
                  Upgrade to Pro
                </Button>
              ) : (
                <>
                  {/* Manage Billing / Portal */}
                  {subscriptionDetails.customerPortalUrl && (
                    <Button variant="secondary" onClick={handleOpenPortal} disabled={actionLoading === 'portal'}>
                      {actionLoading === 'portal' ? (
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      ) : (
                        <Settings2 className="mr-2 w-4 h-4" />
                      )}
                      Manage Billing
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </Button>
                  )}

                  {/* View Invoices */}
                  {subscriptionDetails.customerPortalUrl && (
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(subscriptionDetails.customerPortalUrl + '?tab=invoices', '_blank')}
                    >
                      <Receipt className="mr-2 w-4 h-4" />
                      View Invoices
                    </Button>
                  )}

                  {/* Cancel / Resume */}
                  {subscriptionDetails.planType !== 'lifetime' && (
                    subscriptionDetails.cancelAtPeriodEnd ? (
                      <Button 
                        variant="outline" 
                        onClick={handleResumeSubscription}
                        disabled={actionLoading === 'resume'}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        {actionLoading === 'resume' ? (
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 w-4 h-4" />
                        )}
                        Resume Subscription
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        onClick={handleCancelSubscription}
                        disabled={actionLoading === 'cancel'}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {actionLoading === 'cancel' ? (
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 w-4 h-4" />
                        )}
                        Cancel Subscription
                      </Button>
                    )
                  )}
                </>
              )}
            </div>

            {/* Upgrade/Change Plan Notice */}
            {subscriptionDetails.planType === 'monthly' && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Save 33%</strong> by switching to yearly billing! 
                  <button 
                    onClick={() => window.location.href = '/app/upgrade'} 
                    className="ml-2 underline hover:no-underline"
                  >
                    View plans →
                  </button>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            Unable to load subscription details
          </div>
        )}
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
