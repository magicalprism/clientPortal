'use client';

import React from 'react';
import CreateForm from '@/components/create/CreateForm';
import { resource } from '@/collections/resource';

const CreateResourcePage = () => {
  return (
	<div style={{ padding: '2rem' }}>
	  <h1>Create Resource</h1>
	  <CreateForm config={resource} />
	</div>
  );
};

export default CreateResourcePage;
