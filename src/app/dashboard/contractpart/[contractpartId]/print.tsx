import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { BrandBoardPreview } from '@/components/fields/custom/BrandBoardPreview';
import { createClient } from '@/lib/supabase/browser';

export default function BrandPrintPage() {
  const router = useRouter();
  const { id } = router.query;
  const [brand, setBrand] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('brands').select('*').eq('id', id).single();
        setBrand(data);
      };
      fetchData();
    }
  }, [id]);

  if (!brand) return null;

  return <BrandBoardPreview brand={brand} />;
}
