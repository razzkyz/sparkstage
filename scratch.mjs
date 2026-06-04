import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hogzjapnkvsihvvbgcdb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZ3pqYXBua3ZzaWh2dmJnY2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNzkyNTYsImV4cCI6MjA4Mzg1NTI1Nn0.R5aWWG8FY9lNlIh3FCKFWaz0zYkm78KyrbO_CA2Grlc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const invoiceId = 'SPK-1780459228502-YUSX3';
  console.log(`Querying orders for invoice: ${invoiceId}`);
  let { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        purchased_tickets (*)
      )
    `)
    .eq('order_number', invoiceId);
    
  if (error) {
    console.error('Error fetching from orders:', error);
  } else {
    console.log('orders:', JSON.stringify(data, null, 2));
  }
}

main();
