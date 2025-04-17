'use client';

import React from 'react';
import CreateForm from '@/components/CreateForm';
import { task } from '@/collections/task';

const CreateTaskPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Project</h1>
      <CreateForm config={project} />
    </div>
  );
};

export default CreateTaskPage;
