'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  User, 
  Envelope, 
  CreditCard, 
  Bell, 
  ShieldCheck,
  FloppyDisk,
  SpinnerGap,
  ArrowSquareOut,
  Calendar,
  CheckCircle,
  XCircle,
  Warning,
  Crown,
  Lightning,
  ArrowsClockwise,
  Receipt,
  GearSix,
  Clock,
  Infinity,
  Wallet,
  PencilSimple,
  ShareNetwork,
  Copy,
  Gift,
  Users,
  Check as CheckIcon
} from '@phosphor-icons/react';
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
  planType: 'free' | 'monthly' | 'unlimited';
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

interface ReferralData {
  code: string;
  creditsEarned: number;
  creditsUsed: number;
  creditsAvailable: number;
  referrals: Array<{
    id: string;
    status: string;
    email: string;
    qualifiedAt: string | null;
    createdAt: string;
  }>;
  maxCredits: number;
  creditsPerExport: number;
}

export default function SettingsPage() {
  const { user, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralLoading, setReferralLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchSubscriptionDetails();
    fetchReferralData();
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

  const fetchReferralData = async () => {
    setReferralLoading(true);
    try {
      const response = await fetch('/api/referral');
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleCopyReferralLink = async () => {
    if (!referralData?.code) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/?ref=${referralData.code}`);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-900">
          <Warning size={12} />
          Cancelling
        </span>
      );
    }
    
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-900">
            <CheckCircle size={12} weight="fill" />
            Active
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-900">
            <XCircle size={12} weight="fill" />
            Cancelled
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-900">
            <Warning size={12} />
            Past Due
          </span>
        );
      case 'on_trial':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-900">
            <Clock size={12} />
            Trial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'unlimited':
        return <Crown size={20} className="text-slate-900" />;
      case 'monthly':
        return <Lightning size={20} className="text-slate-900" />;
      default:
        return <CreditCard size={20} className="text-slate-600" />;
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
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <User size={20} className="text-slate-900" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Profile</h2>
            <p className="text-sm text-slate-600">Update your personal information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-slate-100"
            />
            <p className="text-xs text-slate-600 mt-1">Email cannot be changed</p>
          </div>

          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? (
              <>
                <SpinnerGap size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FloppyDisk size={16} className="mr-2" />
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
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <CreditCard size={20} className="text-slate-900" />
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
            <ArrowsClockwise size={16} className={loadingSubscription ? 'animate-spin' : ''} />
          </Button>
        </div>

        {loadingSubscription ? (
          <div className="flex items-center justify-center py-8">
            <SpinnerGap size={24} className="animate-spin text-slate-600" />
          </div>
        ) : subscriptionDetails ? (
          <div className="space-y-6">
            {/* Plan Overview */}
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100`}>
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
                  {subscriptionDetails.renewsAt && !subscriptionDetails.cancelAtPeriodEnd && (
                    <div>
                      <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Next Billing Date</p>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        <Calendar size={16} className="text-slate-600" />
                        {formatDate(subscriptionDetails.renewsAt)}
                      </p>
                    </div>
                  )}
                  
                  {subscriptionDetails.cancelAtPeriodEnd && subscriptionDetails.endsAt && (
                    <div>
                      <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Access Until</p>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        <Warning size={16} />
                        {formatDate(subscriptionDetails.endsAt)}
                      </p>
                    </div>
                  )}

                  {subscriptionDetails.currentPeriodStart && (
                    <div>
                      <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">
                        Current Period Started
                      </p>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        <Clock size={16} className="text-slate-600" />
                        {formatDate(subscriptionDetails.currentPeriodStart)}
                      </p>
                    </div>
                  )}

                  {subscriptionDetails.paymentMethod && (
                    <div>
                      <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Payment Method</p>
                      {subscriptionDetails.paymentMethod.type === 'paypal' ? (
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900 flex items-center gap-2">
                            <Wallet size={16} className="text-slate-600" />
                            PayPal {subscriptionDetails.paymentMethod.paypalEmail && (
                              <span className="text-slate-600 text-sm">({subscriptionDetails.paymentMethod.paypalEmail})</span>
                            )}
                          </p>
                          {subscriptionDetails.updatePaymentMethodUrl && (
                            <button
                              onClick={() => window.open(subscriptionDetails.updatePaymentMethodUrl!, '_blank')}
                              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                            >
                              <PencilSimple size={12} />
                              Update
                            </button>
                          )}
                        </div>
                      ) : subscriptionDetails.paymentMethod.type === 'card' ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900 flex items-center gap-2">
                              <CreditCard size={16} className="text-slate-600" />
                              {subscriptionDetails.paymentMethod.brand} •••• {subscriptionDetails.paymentMethod.lastFour}
                            </p>
                            {subscriptionDetails.paymentMethod.expiryMonth && subscriptionDetails.paymentMethod.expiryYear && (
                              <p className="text-xs text-slate-600 mt-0.5 ml-6">
                                Expires {subscriptionDetails.paymentMethod.expiryMonth}/{subscriptionDetails.paymentMethod.expiryYear}
                              </p>
                            )}
                          </div>
                          {subscriptionDetails.updatePaymentMethodUrl && (
                            <button
                              onClick={() => window.open(subscriptionDetails.updatePaymentMethodUrl!, '_blank')}
                              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                            >
                              <PencilSimple size={12} />
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
                  <Crown size={16} className="mr-2" />
                  Upgrade to Pro
                </Button>
              ) : (
                <>
                  {/* Manage Billing / Portal */}
                  {subscriptionDetails.customerPortalUrl && (
                    <Button variant="secondary" onClick={handleOpenPortal} disabled={actionLoading === 'portal'}>
                      {actionLoading === 'portal' ? (
                        <SpinnerGap size={16} className="mr-2 animate-spin" />
                      ) : (
                        <GearSix size={16} className="mr-2" />
                      )}
                      Manage Billing
                      <ArrowSquareOut size={16} className="ml-2" />
                    </Button>
                  )}

                  {/* View Invoices */}
                  {subscriptionDetails.customerPortalUrl && (
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(subscriptionDetails.customerPortalUrl + '?tab=invoices', '_blank')}
                    >
                      <Receipt size={16} className="mr-2" />
                      View Invoices
                    </Button>
                  )}

                  {/* Cancel / Resume */}
                  {
                    subscriptionDetails.cancelAtPeriodEnd ? (
                      <Button 
                        variant="outline" 
                        onClick={handleResumeSubscription}
                        disabled={actionLoading === 'resume'}
                        className="border-slate-300 text-slate-900 hover:bg-slate-100"
                      >
                        {actionLoading === 'resume' ? (
                          <SpinnerGap size={16} className="mr-2 animate-spin" />
                        ) : (
                          <ArrowsClockwise size={16} className="mr-2" />
                        )}
                        Resume Subscription
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        onClick={handleCancelSubscription}
                        disabled={actionLoading === 'cancel'}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      >
                        {actionLoading === 'cancel' ? (
                          <SpinnerGap size={16} className="mr-2 animate-spin" />
                        ) : (
                          <XCircle size={16} className="mr-2" />
                        )}
                        Cancel Subscription
                      </Button>
                    )
                  }
                </>
              )}
            </div>

            {/* Upgrade/Change Plan Notice */}
            {subscriptionDetails.planType === 'monthly' && (
              <div className="p-4 rounded-lg bg-white border border-slate-200">
                <p className="text-sm text-slate-900">
                  <strong>Want unlimited downloads?</strong> Upgrade to Pro Unlimited for $19/mo.
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
          <div className="text-center py-8 text-slate-600">
            Unable to load subscription details
          </div>
        )}
      </Card>

      {/* Referral Credits Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Gift size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Refer & Earn</h2>
            <p className="text-sm text-slate-600">Invite friends, earn free exports</p>
          </div>
        </div>

        {referralLoading ? (
          <div className="flex items-center justify-center py-8">
            <SpinnerGap size={24} className="animate-spin text-slate-600" />
          </div>
        ) : referralData ? (
          <div className="space-y-5">
            {/* Credits Overview */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-emerald-900">Your Credits</span>
                <span className="text-2xl font-bold text-emerald-700">
                  {referralData.creditsAvailable}
                </span>
              </div>
              <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min((referralData.creditsAvailable / referralData.creditsPerExport) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-emerald-700">
                {referralData.creditsAvailable >= referralData.creditsPerExport
                  ? `You can redeem ${Math.floor(referralData.creditsAvailable / referralData.creditsPerExport)} free export${Math.floor(referralData.creditsAvailable / referralData.creditsPerExport) > 1 ? 's' : ''}!`
                  : `${referralData.creditsPerExport - referralData.creditsAvailable} more referral${referralData.creditsPerExport - referralData.creditsAvailable === 1 ? '' : 's'} until your next free export`
                }
              </p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-emerald-200 text-xs text-emerald-700">
                <span>Earned: {referralData.creditsEarned}</span>
                <span>Used: {referralData.creditsUsed}</span>
                <span>{referralData.creditsPerExport} credits = 1 export</span>
              </div>
            </div>

            {/* Referral Link */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Your referral link</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                  <span className="text-sm text-slate-600 truncate">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/?ref={referralData.code}
                  </span>
                </div>
                <Button variant="secondary" onClick={handleCopyReferralLink}>
                  {copied ? <CheckIcon size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            {/* Referral History */}
            {referralData.referrals.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Referral history</label>
                <div className="space-y-2">
                  {referralData.referrals.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-600" />
                        <span className="text-sm text-slate-700">{ref.email}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        ref.status === 'qualified'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {ref.status === 'qualified' ? '+1 credit' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600">Unable to load referral data</p>
        )}
      </Card>

      {/* Notifications Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Bell size={20} className="text-slate-900" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-600">Configure email notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-600">Thesis generation complete</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-slate-900 accent-white" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-600">Weekly usage summary</span>
            <input type="checkbox" className="w-5 h-5 rounded text-slate-900 accent-white" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-600">Product updates & features</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-slate-900 accent-white" />
          </label>
        </div>
      </Card>

      {/* Security Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <ShieldCheck size={20} className="text-slate-900" />
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
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
