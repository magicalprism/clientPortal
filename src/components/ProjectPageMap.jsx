'use client';
import React, { useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { createClient } from '@/lib/supabase/browser';
import { fileTypeIcons } from '@/data/fileTypeIcons';
import { Box, Typography } from '@mui/material';
import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getIcon = (iconKey) => {
  const Icon = fileTypeIcons[iconKey] || fileTypeIcons.default;
  return <Icon size={90} weight="duotone" />;
};

const buildNodes = (pages) => {
  return pages.map((page) => ({
    id: page.id.toString(),
    type: 'custom',
    position: { x: 0, y: 0 },
    style: { width: 140, height: 170 },
    data: {
      title: page.title,
      icon: page.resource?.icon,
    },
  }));
};

const buildEdges = (pages) => {
  const edges = pages
    .filter((page) => page.parent_id)
    .map((page) => ({
      id: `edge-${page.parent_id}-${page.id}`,
      source: page.parent_id.toString(),
      target: page.id.toString(),
      animated: true,
      style: { stroke: '#9ca3af' },
    }));

  const edgeCountPerTarget = {};
  edges.forEach((e) => {
    edgeCountPerTarget[e.target] = (edgeCountPerTarget[e.target] || 0) + 1;
  });

  Object.entries(edgeCountPerTarget).forEach(([targetId, count]) => {
    if (count > 1) {
      console.warn(`⚠️ Node ${targetId} has multiple parents (${count})`);
    }
  });

  return edges;
};

const applyLayout = (nodes, edges, direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 140, height: 170 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const laidOut = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    if (!pos) {
      console.warn(`⚠️ Layout missing position for node ${node.id}`);
      return node;
    }
    return {
      ...node,
      position: { x: pos.x, y: pos.y },
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
    };
  });

  console.log('🧭 Final node positions:', laidOut.map(n => ({ id: n.id, pos: n.position })));
  return laidOut;
};

const CustomNode = React.memo(({ data, id, isConnectable }) => {
  console.log(`🔧 Rendering node ${id} | isConnectable:`, isConnectable);

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 1,
        position: 'relative',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={true}
        style={{ background: 'blue', zIndex: 10, width: 10, height: 10 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={true}
        style={{ background: 'red', zIndex: 10, width: 10, height: 10 }}
      />

      <Box
        onClick={(e) => {
          e.stopPropagation();
          const url = new URL(window.location.href);
          url.searchParams.set('modal', 'edit');
          url.searchParams.set('id', id);
          window.history.pushState({}, '', url);
        }}
        sx={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& svg': {
            width: '90px !important',
            height: '90px !important',
          },
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
        {getIcon(data.icon)}
      </Box>
      <Typography
        variant="caption"
        sx={{
          mt: 1,
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'text.secondary',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          maxWidth: 140,
        }}
      >
        {data.title} ({id})
      </Typography>
    </Box>
  );
});

export const ProjectPageMap = ({ projectId }) => {
  const [pages, setPages] = useState([]);
  const supabase = createClient();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => {
    console.log('🧠 Memoizing nodeTypes');
    return { custom: CustomNode };
  }, []);

  const handleConnect = async ({ source, target }) => {
    console.log('⛓️ Attempting connection:', source, '→', target);
  
    // Always overwrite the parent_id of the child (target)
    const { error: updateError } = await supabase
      .from('projectpage')
      .update({ parent_id: parseInt(source) })
      .eq('id', parseInt(target));
  
    if (updateError) {
      console.error('❌ Error saving connection:', updateError);
      return;
    }
  
    const { data: updatedPages, error: updatedFetchError } = await supabase
      .from('projectpage')
      .select(`id, title, parent_id, project_id, resource:resource_id (icon)`)
      .eq('project_id', projectId);
  
    if (updatedFetchError) {
      console.error('❌ Error fetching updated pages:', updatedFetchError);
      return;
    }
  
    console.log('📥 Pages after new connection:', updatedPages);
  
    const newNodes = buildNodes(updatedPages || []);
    const newEdges = buildEdges(updatedPages || []);
    const laidOut = applyLayout(newNodes, newEdges, 'TB');
  
    setNodes(laidOut);
    setEdges(newEdges);
  };
  

  useEffect(() => {
    if (!projectId) return;

    console.log('📡 Fetching pages for project:', projectId);

    const fetchPages = async () => {
      const { data, error } = await supabase
        .from('projectpage')
        .select(`id, title, parent_id, project_id, resource:resource_id (icon)`)
        .eq('project_id', projectId);

      if (error) {
        console.error('❌ Error fetching project pages:', error);
        return;
      }

      console.log('📁 Raw page data:', data);

      const rawNodes = buildNodes(data || []);
      const rawEdges = buildEdges(data || []);
      const laidOutNodes = applyLayout(rawNodes, rawEdges, 'TB');

      setPages(data || []);
      setNodes(laidOutNodes);
      setEdges(rawEdges);
    };

    fetchPages();
  }, [projectId]);

  return (
    <Box sx={{ height: '500px', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          console.log('🧩 Node changes:', changes);
          onNodesChange(changes);
        }}
        onEdgesChange={(changes) => {
          console.log('🧩 Edge changes:', changes);
          onEdgesChange(changes);
        }}
        onConnect={(params) => {
          console.log('⚡ onConnect triggered with:', params);
          handleConnect(params);
        }}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background gap={16} color="#e5e7eb" variant="dots" />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </Box>
  );
};
