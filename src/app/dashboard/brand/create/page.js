'use client';

import React from 'react';
import CreateForm from '@/components/CreateForm';
import { project } from '@/collections/brand';

const CreateBrandPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Brand</h1>
      <CreateForm config={brand} />
    </div>
  );
};

export default CreateBrandPage;
