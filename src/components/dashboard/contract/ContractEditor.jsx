'use client';
import React from 'react';
import ContractCreateForm from './ContractCreateForm';

const ContractEditor = ({ config, record, onSave }) => {
  return (
    <ContractCreateForm
      config={config}
      record={record}
      mode="edit"
      onSave={onSave}
    />
  );
};

export default ContractEditor;
