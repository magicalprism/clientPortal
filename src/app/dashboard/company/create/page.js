'use client';

import React from 'react';
import CreateForm from '@/components/create/CreateForm';
import { company } from '@/collections/company';

const CreateCompanyPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Company</h1>
      <CreateForm config={company} />
    </div>
  );
};

export default CreateCompanyPage;
