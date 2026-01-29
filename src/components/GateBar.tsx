import React from 'react';
import { Button } from '@/components/ui/button';

type Section =
  | 'contract'
  | 'invoice'
  | 'payment1'
  | 'completion1'
  | 'balance'
  | 'payment2'
  | 'completion2';

type GateBarProps = {
  section: Section;
  onSign?: () => void;
  onConfirm?: () => void;
  customerName?: string;
  paymentAmount?: number;
};

// Format currency from cents
const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
};

export const GateBar: React.FC<GateBarProps> = ({
  section,
  onSign,
  onConfirm,
  customerName,
  paymentAmount,
}) => {
  // Only show for PDF viewing sections
  const isPdfSection = section === 'contract' || section === 'invoice' || section === 'balance';

  if (!isPdfSection) {
    return null;
  }

  // Generate context-aware messages
  const getMessage = () => {
    if (section === 'contract') {
      const firstName = customerName?.split(' ')[0] || '';
      return firstName ? `Hi, ${firstName}.` : 'Contract for your review.';
    }
    if (section === 'invoice' && paymentAmount) {
      return `You owe ${formatCurrency(paymentAmount)}`;
    }
    if (section === 'balance' && paymentAmount) {
      return `${formatCurrency(paymentAmount)} remaining.`;
    }
    return '';
  };

  const message = getMessage();

  return (
    <div 
      className="border-b-2"
      style={{
        backgroundColor: 'rgb(15 15 15 / 95%)',
        borderColor: 'rgb(192 189 189 / 34%)',
        filter: 'drop-shadow(2px 4px 6px #0f0f0f47)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Message */}
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="font-agency text-portfolio-text-primary tracking-wide truncate"
              style={{ fontSize: '1.5rem', textTransform: 'none' }}
            >
              {message}
            </span>
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Contract section: Sign button */}
            {section === 'contract' && onSign && (
              <Button
                onClick={onSign}
                className="bg-portfolio-accent-mauve hover:bg-portfolio-accent-mauve/80 text-portfolio-bg-dark font-semibold px-4 py-2 rounded-lg transition-all duration-300"
              >
                Sign Contract
              </Button>
            )}

            {/* Invoice/Balance sections: Pay Now button */}
            {(section === 'invoice' || section === 'balance') && onConfirm && (
              <Button
                onClick={onConfirm}
                className="bg-portfolio-accent-mauve hover:bg-portfolio-accent-mauve/80 text-portfolio-bg-dark font-semibold px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap"
              >
                Pay Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
