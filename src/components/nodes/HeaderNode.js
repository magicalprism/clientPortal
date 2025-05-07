'use client';
import React from 'react';
import NodeWrapper from './NodeWrapper';

const HeaderNode = ({ data = {}, ...props }) => {
  return (
    <NodeWrapper
      {...props}
      data={data}
      label="Header"
      hasImage={false}
      width={200}
      height={50}
      centerContentVertically={true}
    />
  );
};

export default HeaderNode;
