export type JobData = {
  project: string;
  customer: {
    name: string;
    email: string;
    business?: string;
    title?: string;
    phone?: string;
    id?: string;
    address?: {
      city: string;
      line1: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  state: {
    client_status: {
      logged_in: string | null;
      contract_signed: string | null;
      invoice: string | null;
      payment_1: string | null;
      balance: string | null;
      payment_2: string | null;
    };
    objects?: {
      created?: string;
      product?: string;
      price_1?: string;
      price_2?: string;
      customer?: string;
      coupon?: string;
    };
  };
  docs: {
    contract: { url: string; id?: string; pdf?: string };
    invoice: { url: string; id?: string; pdf?: string };
    balance: { url: string; id?: string; pdf?: string };
  };
  product: {
    id: string;
    name: string;
    total_payments: number;
    active: boolean;
    description?: string;
    login_name?: string;
    login_keyword?: string;
    service_usd?: number;
    discount_usd?: number;
    type?: string;
    unit_label?: string;
  };
  price1: {
    id: string;
    unit_amount: number;
    active: boolean;
    currency: string;
    count?: number;
    billing_scheme?: string;
    pay_by?: string;
    pay_days?: number;
    late_fee?: number;
    nickname?: string;
  };
  price2: {
    id: string;
    unit_amount: number;
    active: boolean;
    currency: string;
    count?: number;
    billing_scheme?: string;
    pay_by?: string;
    pay_days?: number;
    late_fee?: number;
    nickname?: string;
  };
  coupon?: {
    id?: string;
    amount_off?: number;
    name?: string;
    currency?: string;
    duration?: string;
    max_redemptions?: number;
    applies_to?: {
      products?: string[];
    };
  };
};

/**
 * Fetches job data fresh from JSON file using job_id from URL path.
 * Always fetches fresh - never uses sessionStorage or cache.
 * 
 * @returns JobData if found, null if not found or error
 */
export async function fetchJobData(): Promise<JobData | null> {
  // Extract job_id from URL path (e.g., /uid-ilt-036 -> uid-ilt-036)
  const path = window.location.pathname;
  
  // Remove leading slash and filter out root/index paths
  let jobId = path.replace(/^\//, '').replace(/\/$/, '');
  
  // Filter out known HTML files and empty paths
  if (!jobId || jobId === 'index.html' || jobId === 'job.html' || jobId === '404.html') {
    return null;
  }

  // Remove .html extension if present (shouldn't be, but handle it)
  jobId = jobId.replace(/\.html$/, '');

  if (!jobId) return null;

  try {
    // Always fetch fresh JSON from server
    const res = await fetch(`/assets/jobs/${jobId}.json`);
    if (!res.ok) {
      console.error(`Failed to fetch job data: ${res.status} ${res.statusText}`);
      return null;
    }
    
    const data = await res.json();
    return data as JobData;
  } catch (err) {
    console.error('Error fetching job data:', err);
    return null;
  }
}
