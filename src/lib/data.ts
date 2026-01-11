export type JobData = {
  id: string;
  client: { name: string; email: string };
  project: { name: string; total_amount: number };
  state: {
    client_status: {
      logged_in: string | null;
      contract_signed: string | null;
      invoice: string | null;
      payment_1: string | null;
      balance: string | null;
      payment_2: string | null;
    };
  };
  docs: {
    contract: { url: string };
    invoice: { url: string };
    balance: { url: string };
  };
  product: {
    id: string;
    total_payments: number;
    active: boolean;
    price1: { id: string; amount: number; active: boolean };
    price2: { id: string; amount: number; active: boolean };
  };
};

export async function fetchJobData(): Promise<JobData | null> {
  const params = new URLSearchParams(window.location.search);
  let id = params.get('id');
  
  if (!id) {
    // Try to get ID from path (e.g. /uid-123)
    const path = window.location.pathname;
    if (path && path !== '/' && path !== '/index.html' && path !== '/job.html') {
      id = path.replace(/^\//, '');
    }
  }

  if (!id) return null;

  try {
    const res = await fetch(`/assets/jobs/${id}.json`);
    if (!res.ok) throw new Error('Job not found');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}
