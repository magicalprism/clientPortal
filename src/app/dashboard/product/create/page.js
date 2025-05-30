'use client';

import React from 'react';
import CreateForm from '@/components/create/CreateForm';
import { product } from '@/collections/product';

const CreateProductPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Product</h1>
      <CreateForm config={product} />
    </div>
  );
};

export default CreateProductPage;
