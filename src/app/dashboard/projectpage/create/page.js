'use client';

import React from 'react';
import CreateForm from '@/components/CreateForm';
import { projectpage } from '@/collections/projectpage';

const CreateProjectpagePage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Project Page</h1>
      <CreateForm config={projectpage} />
    </div>
  );
};

export default CreateProjectpagePage;
