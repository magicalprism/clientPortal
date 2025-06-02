'use client';

import React from 'react';
import CreateForm from '@/components/create/CreateForm';
import { proposal } from '@/collections/proposal';

const CreateProposalPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Proposal</h1>
      <CreateForm config={proposal} />
    </div>
  );
};

export default CreateProposalPage;
