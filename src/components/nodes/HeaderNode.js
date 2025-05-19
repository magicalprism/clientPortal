'use client';
import React from 'react';
import NodeWrapper from './NodeWrapper';
import { element as elementConfig } from '@/collections';

const HeaderNode = ({ data = {}, ...props }) => {
  return (
    <NodeWrapper
      {...props}
      config={elementConfig}
      label="Header"
      hasImage={false}
      width={200}
      height={50}
      centerContentVertically={true}
    />
  );
};

export default HeaderNode;



