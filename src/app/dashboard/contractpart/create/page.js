'use client';

import React from 'react';
import CreateForm from '@/components/create/CreateForm';
import { contractpart } from '@/collections/contractpart';

const CreateContractpartPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Contractpart</h1>
      <CreateForm config={contractpart} />
    </div>
  );
};

export default CreateContractpartPage;
