'use client';
import React from 'react';
import NodeWrapper from './NodeWrapper';
import { element as elementConfig } from '@/collections';


const FooterNode = ({ data = {}, ...props }) => {
  return (
    <NodeWrapper
      {...props}
      config={elementConfig}
      label="Footer"
      hasImage={false}
      width={200}
      height={50}
      centerContentVertically={true}
    />
  );
};

export default FooterNode;



