import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://teigfsfnqxribndceogj.supabase.co';
const supabaseKey = 'sb_publishable_BnDSSvSFKmxTXPrQDBGkag_EysfY9Yr';

export const supabase = createClient(supabaseUrl, supabaseKey);
