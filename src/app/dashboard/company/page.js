'use client';

import dynamic from 'next/dynamic';
import { company } from '@/collections/company';

// Static map to supported views
const viewMap = {
  PrimaryTableView: dynamic(() =>
    import('@/components/views/PrimaryTableView')
  ),
  // Add more views here if needed
};

export default function CompanyPage() {
  if (!company?.views || !company?.defaultView) {
    return <div>Invalid company config</div>;
  }

  const viewConfig = company.views[company.defaultView];
  const ViewComponent = viewMap[viewConfig.component];

  if (!ViewComponent) {
    return <div>View component not found: {viewConfig.component}</div>;
  }

  return <ViewComponent config={company} />;
}
