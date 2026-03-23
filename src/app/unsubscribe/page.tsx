'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-email'>('loading');

  useEffect(() => {
    if (!email) {
      setStatus('no-email');
      return;
    }

    async function unsubscribe() {
      try {
        const res = await fetch('/api/email/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      }
    }

    unsubscribe();
  }, [email]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f4f4f7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        margin: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h1 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '8px' }}>
              Processing...
            </h1>
            <p style={{ color: '#64748b', fontSize: '15px' }}>
              Unsubscribing you from our emails.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h1 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '8px' }}>
              You've been unsubscribed
            </h1>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
              You won't receive any more marketing emails from us.
              <br />
              If this was a mistake, you can always re-subscribe by signing up again.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h1 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '8px' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
              We couldn't process your unsubscribe request.
              <br />
              Please try again or contact us at passedai@gmail.com.
            </p>
          </>
        )}

        {status === 'no-email' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '8px' }}>
              Invalid unsubscribe link
            </h1>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
              This unsubscribe link appears to be invalid.
              <br />
              Please contact us at passedai@gmail.com if you need help.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f4f7',
      }}>
        <p>Loading...</p>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
