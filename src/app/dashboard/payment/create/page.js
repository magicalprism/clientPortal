'use client';

import React from 'react';
import CreateForm from '@/components/create/CreateForm';
import { payment } from '@/collections/payment';

const CreatePaymentPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create Payment</h1>
      <CreateForm config={payment} />
    </div>
  );
};

export default CreatePaymentPage;
