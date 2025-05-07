'use client';
import React from 'react';
import NodeWrapper from './NodeWrapper';

const FooterNode = ({ data = {}, ...props }) => {
  return (
    <NodeWrapper
      {...props}
      data={data}
      label="Footer"
      hasImage={false}
      width={200}
      height={50}
      centerContentVertically={true}
    />
  );
};

export default FooterNode;
