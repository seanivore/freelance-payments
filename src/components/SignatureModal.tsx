import React, { useState } from 'react';
import { Check, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
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
  const [signedDate, setSignedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSave = () => {
    if (legalName && signedDate) {
      // Format date as YYYY-MM-DD for the API
      const formattedDate = format(signedDate, 'yyyy-MM-dd');
      onSign(legalName, formattedDate);
      // Reset form
      setLegalName('');
      setSignedDate(new Date());
    }
  };

  const isValid = legalName.trim().length > 0 && signedDate !== null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <div className="mx-auto w-full max-w-md px-4">
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

            {/* Date Input */}
            <div className="space-y-2">
              <label 
                className="text-sm font-medium text-portfolio-text-secondary"
              >
                Date
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full bg-portfolio-bg-primary border border-portfolio-border rounded-lg px-4 py-3 text-portfolio-text-primary transition-all duration-300 focus:outline-none focus:border-portfolio-accent-mauve focus:shadow-glow flex items-center justify-between"
                  >
                    <span>{signedDate ? format(signedDate, 'PPP') : 'Select date'}</span>
                    <CalendarIcon className="h-4 w-4 text-portfolio-text-secondary" />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 bg-portfolio-bg-dark border-portfolio-border" 
                  align="center"
                  side="top"
                  sideOffset={8}
                >
                  <Calendar
                    mode="single"
                    selected={signedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSignedDate(date);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                    className="rounded-md"
                  />
                </PopoverContent>
              </Popover>
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
