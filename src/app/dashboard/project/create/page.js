'use client';

import React from 'react';
import CreateForm from '@/components/create/CreateForm';
import { project } from '@/collections/project';

const CreateProjectPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Project</h1>
      <CreateForm config={project} />
    </div>
  );
};

export default CreateProjectPage;
