import React from 'react';
import { JobData } from '@/lib/data';
import { GateBar } from './GateBar';

type CompletionViewProps = {
  data: JobData;
  completionType: 'completion1' | 'completion2';
};

export const CompletionView: React.FC<CompletionViewProps> = ({
  data,
  completionType
}) => {
  return (
    <div className="mx-auto max-w-[1100px] px-4 text-slate-100">
      <div className="mt-4 p-8 bg-slate-900 rounded-lg border border-slate-800 shadow-xl">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            {completionType === 'completion1' 
              ? 'Payment Received' 
              : 'All Payments Complete'}
          </h2>
          
          <p className="text-slate-400 text-lg">
            {completionType === 'completion1'
              ? 'Thank you for your payment. You can continue to the balance whenever you\'re ready.'
              : 'Thank you! Your contract, invoice, and balance PDFs are available for download below.'}
          </p>

          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-semibold text-slate-200">Available Documents</h3>
            <div className="flex flex-col gap-3 items-center">
              <a
                href={data.docs.contract.url}
                download
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                Download Contract PDF
              </a>
              <a
                href={data.docs.invoice.url}
                download
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                Download Invoice PDF
              </a>
              {completionType === 'completion2' && (
                <a
                  href={data.docs.balance.url}
                  download
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  Download Balance PDF
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <GateBar section={completionType} />
        </div>
      </div>
    </div>
  );
};
