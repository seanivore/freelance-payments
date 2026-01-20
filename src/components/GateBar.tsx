import React from 'react';
import { Download } from 'lucide-react';
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
  onDownload?: () => void;
};

// Context-aware messaging for each section
const SECTION_MESSAGES: Record<string, string> = {
  contract: 'Contract for your review.',
  invoice: 'Invoice for your records.',
  balance: 'Balance statement for final payment.',
};

export const GateBar: React.FC<GateBarProps> = ({
  section,
  onSign,
  onConfirm,
  onDownload,
}) => {
  // Only show for PDF viewing sections
  const isPdfSection = section === 'contract' || section === 'invoice' || section === 'balance';
  
  if (!isPdfSection) {
    return null;
  }

  const message = SECTION_MESSAGES[section] || '';

  return (
    <div 
      className="bg-portfolio-bg-dark/80 border-b-2"
      style={{
        borderColor: 'rgb(192 189 189 / 34%)',
        filter: 'drop-shadow(2px 4px 6px #0f0f0f47)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Message */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-agency text-lg md:text-xl text-portfolio-text-primary tracking-wide truncate">
              {message}
            </span>
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Download icon - always visible, subtle */}
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 text-portfolio-text-secondary hover:text-portfolio-text-primary transition-colors rounded-lg hover:bg-white/5"
                aria-label="Download document"
                title="Download PDF"
              >
                <Download className="w-5 h-5" />
              </button>
            )}

            {/* Contract section: Sign button */}
            {section === 'contract' && onSign && (
              <Button
                onClick={onSign}
                className="bg-portfolio-accent-mauve hover:bg-portfolio-accent-mauve/80 text-portfolio-bg-dark font-semibold px-4 py-2 rounded-lg transition-all duration-300"
              >
                Sign Contract
              </Button>
            )}

            {/* Invoice/Balance sections: Confirm button */}
            {(section === 'invoice' || section === 'balance') && onConfirm && (
              <Button
                onClick={onConfirm}
                className="bg-portfolio-accent-mauve hover:bg-portfolio-accent-mauve/80 text-portfolio-bg-dark font-semibold px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Confirm & Continue to Payment</span>
                <span className="sm:hidden">Continue to Payment</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
