'use client';

import React from 'react';
import CreateForm from '@/components/create/CreateForm';
import { contract } from '@/collections/contract';

const CreateContractPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ padding: '1rem' }}>Create Contract</h1>
      <CreateForm config={contract} />
    </div>
  );
};

export default CreateContractPage;
