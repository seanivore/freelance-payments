import React, { useRef, useState } from 'react';
import { Calendar, Check } from 'lucide-react';
import { Button } from './ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer';
import { cn } from '@/lib/utils';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (legalName: string, signedDate: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSign
}) => {
  const [legalName, setLegalName] = useState('');
  // Default to today's date in YYYY-MM-DD format for native input
  const [signedDate, setSignedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof (input as HTMLInputElement).showPicker === 'function') {
      (input as HTMLInputElement).showPicker();
    } else {
      input.focus();
    }
  };

  const handleSave = () => {
    if (legalName && signedDate) {
      onSign(legalName, signedDate);
      // Reset form
      setLegalName('');
      setSignedDate(new Date().toISOString().split('T')[0]);
    }
  };

  const isValid = legalName.trim().length > 0 && signedDate.length > 0;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto w-screen max-w-none sm:max-w-md">
        <div className="mx-auto w-full max-w-none px-4 sm:max-w-md">
          <DrawerHeader className="text-center">
            <DrawerTitle className="font-agency text-2xl tracking-wide">
              Sign Contract
            </DrawerTitle>
            <DrawerDescription>
              By signing, you agree to the terms of this contract.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-6">
            {/* Legal Name Input */}
            <div className="space-y-2">
              <label 
                htmlFor="legal-name"
                className="text-sm font-medium text-portfolio-text-secondary"
              >
                Full Legal Name
              </label>
              <input
                id="legal-name"
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full bg-portfolio-bg-primary border border-portfolio-border rounded-lg px-4 py-3 text-portfolio-text-primary placeholder-portfolio-text-secondary/50 transition-all duration-300 focus:outline-none focus:border-portfolio-accent-mauve focus:shadow-glow"
                placeholder="Enter your full legal name"
                autoComplete="name"
              />
            </div>

            {/* Date Input - Native input for best mobile UX */}
            <div className="space-y-2">
              <label 
                htmlFor="signed-date"
                className="text-sm font-medium text-portfolio-text-secondary"
              >
                Date
              </label>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  id="signed-date"
                  type="date"
                  value={signedDate}
                  onChange={(e) => setSignedDate(e.target.value)}
                  onClick={openDatePicker}
                  className="w-full bg-portfolio-bg-primary border border-portfolio-border rounded-lg px-4 py-3 pr-12 text-portfolio-text-primary transition-all duration-300 focus:outline-none focus:border-portfolio-accent-mauve focus:shadow-glow"
                />
                <button
                  type="button"
                  onClick={openDatePicker}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-portfolio-text-secondary hover:text-portfolio-text-primary"
                  aria-label="Open date picker"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-3 bg-portfolio-bg-primary/50 rounded-lg border border-portfolio-border">
              <p className="text-xs text-portfolio-text-secondary text-center leading-relaxed">
                By clicking "Sign Contract" below, you acknowledge that you have read, 
                understood, and agree to be bound by the terms of this contract. 
                This constitutes a legally binding electronic signature.
              </p>
            </div>
          </div>

          <DrawerFooter className="pb-6">
            <Button
              onClick={handleSave}
              disabled={!isValid}
              className={cn(
                "w-full bg-portfolio-accent-mauve hover:bg-portfolio-accent-mauve/80 text-portfolio-bg-dark font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2",
                !isValid && "opacity-50 cursor-not-allowed"
              )}
            >
              <Check className="w-5 h-5" />
              Sign Contract
            </Button>
            <DrawerClose asChild>
              <Button 
                variant="outline" 
                className="w-full border-portfolio-border text-portfolio-text-secondary hover:text-portfolio-text-primary hover:bg-portfolio-bg-primary"
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
