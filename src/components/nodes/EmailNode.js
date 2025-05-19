// components/nodes/EmailNode.js
//seperated these so each could have a different look in the map - ie an eveloper for emails 
'use client';
import React from 'react';
import NodeWrapper from './NodeWrapper';
import { element as elementConfig } from '@/collections';
import { EnvelopeOpen } from '@phosphor-icons/react'; // ✅ email icon

const EmailNode = (props) => {
  return (
    <NodeWrapper
      {...props}
      config={elementConfig}
      backgroundColor="#d5bdffb3"
      icon={<EnvelopeOpen size={50} color="white" pt={5} />} // 👈 custom icon prop
      hasImage={false} // maybe no thumbnail, just icon
      height="120px"
      centerContentVertically={true}
      
    />
  );
};

export default EmailNode;
