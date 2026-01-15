import React, { useState, useEffect } from 'react';

type SessionStatus = {
  status: string;
  payment_status: string;
  payment_intent_id: string | null;
  payment_intent_status: string | null;
};

export const Complete: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentIntentStatus, setPaymentIntentStatus] = useState('');
  const [iconColor, setIconColor] = useState('');
  const [icon, setIcon] = useState<React.ReactNode>(null);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const SuccessIcon = (
      <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M15.4695 0.232963C15.8241 0.561287 15.8454 1.1149 15.5171 1.46949L6.14206 11.5945C5.97228 11.7778 5.73221 11.8799 5.48237 11.8748C5.23253 11.8698 4.99677 11.7582 4.83452 11.5681L0.459523 6.44311C0.145767 6.07557 0.18937 5.52327 0.556912 5.20951C0.924454 4.89575 1.47676 4.93936 1.79051 5.3069L5.52658 9.68343L14.233 0.280522C14.5613 -0.0740672 15.1149 -0.0953599 15.4695 0.232963Z" fill="white"/>
      </svg>
    );
    
    const ErrorIcon = (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M1.25628 1.25628C1.59799 0.914573 2.15201 0.914573 2.49372 1.25628L8 6.76256L13.5063 1.25628C13.848 0.914573 14.402 0.914573 14.7437 1.25628C15.0854 1.59799 15.0854 2.15201 14.7437 2.49372L9.23744 8L14.7437 13.5063C15.0854 13.848 15.0854 14.402 14.7437 14.7437C14.402 15.0854 13.848 15.0854 13.5063 14.7437L8 9.23744L2.49372 14.7437C2.15201 15.0854 1.59799 15.0854 1.25628 14.7437C0.914573 14.402 0.914573 13.848 1.25628 13.5063L6.76256 8L1.25628 2.49372C0.914573 2.15201 0.914573 1.59799 1.25628 1.25628Z" fill="white"/>
      </svg>
    );

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');

    if (!sessionId) {
      setIconColor('#DF1B41');
      setIcon(ErrorIcon);
      setText('No session ID found');
      setIsLoading(false);
      return;
    }

    fetch(`/api/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data: SessionStatus) => {
        setStatus(data.status);
        setPaymentIntentId(data.payment_intent_id || '');
        setPaymentStatus(data.payment_status);
        setPaymentIntentStatus(data.payment_intent_status || '');

        if (data.status === 'complete') {
          setIconColor('#30B130');
          setIcon(SuccessIcon);
          setText('Payment succeeded');
        } else {
          setIconColor('#DF1B41');
          setIcon(ErrorIcon);
          setText('Something went wrong, please try again.');
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching session status:', error);
        setIconColor('#DF1B41');
        setIcon(ErrorIcon);
        setText('Failed to retrieve payment status');
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading payment status...</div>
      </div>
    );
  }

  return (
    <div id="payment-status" className="max-w-md mx-auto p-8 bg-slate-900 rounded-lg border border-slate-800 shadow-xl">
      <div 
        id="status-icon" 
        className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: iconColor }}
      >
        {icon}
      </div>
      
      <h2 id="status-text" className="text-2xl font-bold text-center mb-8 text-slate-100">
        {text}
      </h2>
      
      <div id="details-table" className="mb-6">
        <table className="w-full text-sm">
          <tbody className="space-y-2">
            <tr className="border-b border-slate-700">
              <td className="py-2 text-slate-400 font-medium">Payment Intent ID</td>
              <td id="intent-id" className="py-2 text-right text-slate-200 font-mono text-xs break-all">
                {paymentIntentId || 'N/A'}
              </td>
            </tr>
            <tr className="border-b border-slate-700">
              <td className="py-2 text-slate-400 font-medium">Status</td>
              <td id="intent-status" className="py-2 text-right text-slate-200">
                {status || 'N/A'}
              </td>
            </tr>
            <tr className="border-b border-slate-700">
              <td className="py-2 text-slate-400 font-medium">Payment Status</td>
              <td id="session-status" className="py-2 text-right text-slate-200">
                {paymentStatus || 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="py-2 text-slate-400 font-medium">Payment Intent Status</td>
              <td id="payment-intent-status" className="py-2 text-right text-slate-200">
                {paymentIntentStatus || 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {paymentIntentId && (
        <a 
          href={`https://dashboard.stripe.com/payments/${paymentIntentId}`} 
          id="view-details" 
          rel="noopener noreferrer" 
          target="_blank"
          className="block mb-4 text-center text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View details in Stripe Dashboard
          <svg 
            width="15" 
            height="14" 
            viewBox="0 0 15 14" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="inline-block ml-2"
          >
            <path fillRule="evenodd" clipRule="evenodd" d="M3.125 3.49998C2.64175 3.49998 2.25 3.89173 2.25 4.37498V11.375C2.25 11.8582 2.64175 12.25 3.125 12.25H10.125C10.6082 12.25 11 11.8582 11 11.375V9.62498C11 9.14173 11.3918 8.74998 11.875 8.74998C12.3582 8.74998 12.75 9.14173 12.75 9.62498V11.375C12.75 12.8247 11.5747 14 10.125 14H3.125C1.67525 14 0.5 12.8247 0.5 11.375V4.37498C0.5 2.92524 1.67525 1.74998 3.125 1.74998H4.875C5.35825 1.74998 5.75 2.14173 5.75 2.62498C5.75 3.10823 5.35825 3.49998 4.875 3.49998H3.125Z" fill="currentColor"/>
            <path d="M8.66672 0C8.18347 0 7.79172 0.391751 7.79172 0.875C7.79172 1.35825 8.18347 1.75 8.66672 1.75H11.5126L4.83967 8.42295C4.49796 8.76466 4.49796 9.31868 4.83967 9.66039C5.18138 10.0021 5.7354 10.0021 6.07711 9.66039L12.7501 2.98744V5.83333C12.7501 6.31658 13.1418 6.70833 13.6251 6.70833C14.1083 6.70833 14.5001 6.31658 14.5001 5.83333V0.875C14.5001 0.391751 14.1083 0 13.6251 0H8.66672Z" fill="currentColor"/>
          </svg>
        </a>
      )}
      
      {status !== 'complete' && (
        <a 
          id="retry-button" 
          href={window.location.pathname}
          className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-3 rounded-lg transition-colors"
        >
          Try again
        </a>
      )}
    </div>
  );
};
