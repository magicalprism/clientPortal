'use client';

import React from 'react';
import CreateForm from '@/components/create/CreateForm';
import { task } from '@/collections/task';

const CreateTaskPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Task</h1>
      <CreateForm config={task} />
    </div>
  );
};

export default CreateTaskPage;
