import React from 'react';
import { JobData } from '@/lib/data';
import { Download, CheckCircle2, ArrowRight, LogOut } from 'lucide-react';

type CompletionViewProps = {
  data: JobData;
  completionType: 'completion1' | 'completion2';
};

export const CompletionView: React.FC<CompletionViewProps> = ({
  data,
  completionType
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100);
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (completionType === 'completion1') {
    // After Payment 1 - show once, then user goes to balance
    return (
      <div className="relative min-h-screen">
        {/* Background Art */}
        <div className="fixed inset-0 -z-20">
          <img
            src="/assets/media/pdf-viewer-bg-art-1.webp"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(15, 15, 15, 0.8) 0%, rgba(15, 15, 15, 0.6) 50%, rgba(15, 15, 15, 0.8) 100%)',
            }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-lg animate-fade-in-up">
            <div className="bg-portfolio-bg-dark/90 backdrop-blur-sm p-8 rounded-2xl border border-portfolio-border shadow-2xl">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-portfolio-accent-mauve/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-portfolio-accent-mauve" />
                </div>
              </div>

              {/* Thank You Message */}
              <div className="text-center mb-8">
                <h1 className="font-agency text-3xl text-portfolio-text-primary mb-3 tracking-wide">
                  Thank You!
                </h1>
                <p className="text-portfolio-text-secondary text-lg">
                  Your payment has been received.
                </p>
                <p className="text-portfolio-text-secondary/80 mt-2">
                  We're excited to begin work on <span className="text-portfolio-text-primary">{data.project}</span>.
                </p>
              </div>

              {/* Next Steps */}
              <div className="bg-portfolio-bg-primary/50 rounded-xl p-6 mb-8 border border-portfolio-border">
                <h3 className="font-agency text-lg text-portfolio-text-primary mb-3 tracking-wide flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-portfolio-accent-blue" />
                  What's Next
                </h3>
                <p className="text-portfolio-text-secondary text-sm leading-relaxed">
                  You'll receive an email when your final balance is ready for payment.
                  Simply return to this portal and log in again to complete your final payment.
                </p>
                {data.price2?.pay_by && (
                  <p className="text-portfolio-text-secondary/80 text-sm mt-3">
                    Final payment due by: <span className="text-portfolio-accent-terracotta font-medium">{data.price2.pay_by}</span>
                  </p>
                )}
              </div>

              {/* Download Documents */}
              <div className="space-y-3">
                <h3 className="font-agency text-lg text-portfolio-text-primary tracking-wide text-center mb-4">
                  Save Your Documents
                </h3>
                <p className="text-portfolio-text-secondary/70 text-xs text-center mb-4">
                  Download copies of your signed contract and invoice for your records.
                </p>
                <button
                  onClick={() => handleDownload(data.docs.contract.url, 'contract.pdf')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-portfolio-bg-primary hover:bg-portfolio-bg-secondary text-portfolio-text-primary rounded-lg transition-colors border border-portfolio-border"
                >
                  <Download className="w-5 h-5 text-portfolio-accent-mauve" />
                  Download Contract
                </button>
                <button
                  onClick={() => handleDownload(data.docs.invoice.url, 'invoice.pdf')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-portfolio-bg-primary hover:bg-portfolio-bg-secondary text-portfolio-text-primary rounded-lg transition-colors border border-portfolio-border"
                >
                  <Download className="w-5 h-5 text-portfolio-accent-mauve" />
                  Download Invoice
                </button>
              </div>

              {/* Log Out */}
              <div className="mt-8 pt-6 border-t border-portfolio-border">
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-portfolio-accent-mauve/20 hover:bg-portfolio-accent-mauve/30 text-portfolio-text-primary rounded-lg transition-colors border border-portfolio-accent-mauve/30"
                >
                  <LogOut className="w-5 h-5 text-portfolio-accent-mauve" />
                  Log Out
                </button>
                <p className="text-portfolio-text-secondary/60 text-xs text-center mt-2">
                  Return anytime to make your final payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completion2 - All payments complete, final thank you
  return (
    <div className="relative min-h-screen">
      {/* Background Art */}
      <div className="fixed inset-0 -z-20">
        <img
          src="/assets/media/pdf-viewer-bg-art-1.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(15, 15, 15, 0.8) 0%, rgba(15, 15, 15, 0.6) 50%, rgba(15, 15, 15, 0.8) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg animate-fade-in-up">
          <div className="bg-portfolio-bg-dark/90 backdrop-blur-sm p-8 rounded-2xl border border-portfolio-border shadow-2xl">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-portfolio-accent-mauve/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-portfolio-accent-mauve" />
              </div>
            </div>

            {/* Thank You Message */}
            <div className="text-center mb-8">
              <h1 className="font-agency text-3xl text-portfolio-text-primary mb-3 tracking-wide">
                Project Complete!
              </h1>
              <p className="text-portfolio-text-secondary text-lg">
                Thank you, {data.customer.name}!
              </p>
              <p className="text-portfolio-text-secondary/80 mt-2">
                All payments for <span className="text-portfolio-text-primary">{data.product.name}</span> have been received.
              </p>
              {data.product.service_usd && (
                <p className="text-portfolio-accent-mauve font-semibold mt-3 text-xl">
                  Total: {formatCurrency(data.product.service_usd)}
                </p>
              )}
            </div>

            {/* Important Notice */}
            <div className="bg-portfolio-accent-terracotta/10 rounded-xl p-4 mb-8 border border-portfolio-accent-terracotta/30">
              <p className="text-portfolio-text-secondary text-sm text-center leading-relaxed">
                Please download your documents below before leaving this page. 
                Access to this portal may not be available after this session.
              </p>
            </div>

            {/* Download All Documents */}
            <div className="space-y-3">
              <h3 className="font-agency text-lg text-portfolio-text-primary tracking-wide text-center mb-4">
                Your Documents
              </h3>
              <button
                onClick={() => handleDownload(data.docs.contract.url, 'contract.pdf')}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-portfolio-bg-primary hover:bg-portfolio-bg-secondary text-portfolio-text-primary rounded-lg transition-colors border border-portfolio-border"
              >
                <Download className="w-5 h-5 text-portfolio-accent-mauve" />
                Download Contract
              </button>
              <button
                onClick={() => handleDownload(data.docs.invoice.url, 'invoice.pdf')}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-portfolio-bg-primary hover:bg-portfolio-bg-secondary text-portfolio-text-primary rounded-lg transition-colors border border-portfolio-border"
              >
                <Download className="w-5 h-5 text-portfolio-accent-mauve" />
                Download Invoice
              </button>
              {data.docs.balance?.url && (
                <button
                  onClick={() => handleDownload(data.docs.balance.url, 'balance.pdf')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-portfolio-bg-primary hover:bg-portfolio-bg-secondary text-portfolio-text-primary rounded-lg transition-colors border border-portfolio-border"
                >
                  <Download className="w-5 h-5 text-portfolio-accent-mauve" />
                  Download Balance Statement
                </button>
              )}
            </div>

            {/* Contact Info & Safe to Close */}
            <div className="mt-8 pt-6 border-t border-portfolio-border text-center">
              <p className="text-portfolio-text-secondary/80 text-sm mb-4">
                Questions about your service?{' '}
                <a 
                  href="mailto:sean@august.style" 
                  className="text-portfolio-accent-mauve hover:text-portfolio-accent-mauve/80 transition-colors"
                >
                  sean@august.style
                </a>
              </p>
              
              {/* Log Out */}
              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-portfolio-accent-mauve/20 hover:bg-portfolio-accent-mauve/30 text-portfolio-text-primary rounded-lg transition-colors border border-portfolio-accent-mauve/30"
              >
                <LogOut className="w-5 h-5 text-portfolio-accent-mauve" />
                Log Out
              </button>
              <p className="text-portfolio-text-secondary/60 text-xs text-center mt-2">
                Thank you for your business!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
