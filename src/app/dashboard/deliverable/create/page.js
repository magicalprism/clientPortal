'use client';

import React from 'react';
import CreateForm from '@/components/CreateForm';
import { deliverable } from '@/collections/deliverable';

const CreateDeliverablePage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Deliverable</h1>
      <CreateForm config={deliverable} />
    </div>
  );
};

export default CreateDeliverablePage;
