// components/nodes/PageNode.js
'use client';
import React from 'react';
import NodeWrapper from './NodeWrapper';
import { element as elementConfig } from '@/collections';
import { ProjectorScreen } from '@phosphor-icons/react';

const PopupNode = ({ data = {}, ...props }) => {
  return (
    <NodeWrapper
      {...props}
      config={elementConfig}
      label="Popup"
      backgroundColor="#d5bdffb3"
      icon={<ProjectorScreen size={50} color="white" pt={5} />} // 👈 custom icon prop
      hasImage={false} // maybe no thumbnail, just icon
      height="120px"
      centerContentVertically={true}
    />
  );
};

export default PopupNode;




