'use client';

import React from 'react';
import CreateForm from '@/components/CreateForm';
import { element } from '@/collections/element';

const CreateElementPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Website Element</h1>
      <CreateForm config={element} />
    </div>
  );
};

export default CreateElementPage;
