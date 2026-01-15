import React, { useState } from 'react';
import {
  PaymentElement,
  useCheckout
} from '@stripe/react-stripe-js/checkout';

const validateEmail = async (email: string, checkout: any) => {
  const updateResult = await checkout.updateEmail(email);
  const isValid = updateResult.type !== 'error';

  return { isValid, message: !isValid ? updateResult.error.message : null };
};

type EmailInputProps = {
  checkout: any;
  email: string;
  setEmail: (email: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
};

const EmailInput: React.FC<EmailInputProps> = ({ checkout, email, setEmail, error, setError }) => {
  const handleBlur = async () => {
    if (!email) {
      return;
    }

    const { isValid, message } = await validateEmail(email, checkout);
    if (!isValid) {
      setError(message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setEmail(e.target.value);
  };

  return (
    <>
      <label className="block mb-2 text-sm font-medium text-slate-300">
        Email
        <input
          id="email"
          type="email"
          value={email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`mt-1 w-full px-3 py-2 bg-slate-800 border rounded-lg text-slate-100 ${
            error ? 'border-red-500' : 'border-slate-700'
          } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          placeholder="your@email.com"
        />
      </label>
      {error && <div id="email-errors" className="mt-1 text-sm text-red-400">{error}</div>}
    </>
  );
};

export const CheckoutForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkoutState = useCheckout();

  if (checkoutState.type === 'loading') {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-slate-400">Loading checkout...</div>
      </div>
    );
  }

  if (checkoutState.type === 'error') {
    return (
      <div className="p-8 text-center text-red-400 bg-red-900/20 rounded-lg border border-red-900/50">
        Error: {checkoutState.error.message}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { checkout } = checkoutState;
    setIsSubmitting(true);

    const { isValid, message: errorMessage } = await validateEmail(email, checkout);
    if (!isValid) {
      setEmailError(errorMessage);
      setMessage(errorMessage);
      setIsSubmitting(false);
      return;
    }

    const confirmResult = await checkout.confirm();

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (confirmResult.type === 'error') {
      setMessage(confirmResult.error.message);
    }

    setIsSubmitting(false);
  };

  const totalAmount = checkoutState.checkout.total?.total?.amount;
  const formattedAmount = totalAmount ? (Number(totalAmount) / 100).toFixed(2) : '0.00';

  return (
    <div className="max-w-md mx-auto p-8 bg-slate-900 rounded-lg border border-slate-800 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <EmailInput
          checkout={checkoutState.checkout}
          email={email}
          setEmail={setEmail}
          error={emailError}
          setError={setEmailError}
        />
        
        <div>
          <h4 className="mb-3 text-lg font-semibold text-slate-200">Payment</h4>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <PaymentElement id="payment-element" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          id="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            `Pay $${formattedAmount} now`
          )}
        </button>

        {/* Show any error or success messages */}
        {message && (
          <div id="payment-message" className="p-4 text-sm text-center bg-red-900/20 border border-red-900/50 rounded-lg text-red-400">
            {message}
          </div>
        )}
      </form>
    </div>
  );
};
