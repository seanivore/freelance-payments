// filename: src/components/GateBar.tsx
import React from 'react';
import { Button } from '@/components/ui/button';

type Section =
  | 'contract'
  | 'invoice'     // payment_1 doc step
  | 'payment1'
  | 'completion1'
  | 'balance'     // payment_2 doc step
  | 'payment2'
  | 'completion2';

type GateBarProps = {
  section: Section;
  onSign?: () => void;
  onDownloadDocs?: (choice: 'yes' | 'no') => void;
  onContinue?: () => void;
  onPay?: () => void;
};

export const GateBar: React.FC<GateBarProps> = ({
  section,
  onSign,
  onDownloadDocs,
  onContinue,
  onPay
}) => {
  // Contract signing gate
  if (section === 'contract') {
    return (
      <div className="flex items-center gap-2 p-2">
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onSign}>
          Sign Contract
        </Button>
      </div>
    );
  }

  // Invoice (payment_1 doc) or Balance (payment_2 doc) acknowledge/download gates
  if (section === 'invoice' || section === 'balance') {
    const label = section === 'invoice' ? 'Invoice' : 'Balance';
    return (
      <div className="flex items-center gap-2 p-2">
        <span className="text-sm text-muted-foreground">{label} documents:</span>
        <Button variant="outline" onClick={() => onDownloadDocs?.('yes')}>
          Download: Yes
        </Button>
        <Button variant="outline" onClick={() => onDownloadDocs?.('no')}>
          Download: No
        </Button>
        <Button className="bg-slate-900 hover:bg-slate-800" onClick={onContinue}>
          Continue
        </Button>
      </div>
    );
  }

  // Payment gates (checkout page actions)
  if (section === 'payment1' || section === 'payment2') {
    return (
      <div className="flex items-center gap-2 p-2">
        <Button className="bg-primary hover:bg-primary/90" onClick={onPay}>
          Pay
        </Button>
      </div>
    );
  }

  // Completion pages
  if (section === 'completion1') {
    return (
      <div className="flex items-center gap-2 p-2">
        <span className="text-sm text-muted-foreground">
          Thank you — you can continue to Balance whenever you’re ready.
        </span>
      </div>
    );
  }
  if (section === 'completion2') {
    return (
      <div className="flex items-center gap-2 p-2">
        <span className="text-sm text-muted-foreground">
          Finalized — contract, invoice, and balance PDFs are available anytime.
        </span>
      </div>
    );
  }

  return null;
};
