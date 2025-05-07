'use client';
import React, { useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { createClient } from '@/lib/supabase/browser';
import { Box, Switch } from '@mui/material';
import dagre from 'dagre';

import PageNode from '@/components/nodes/PageNode';
import FooterNode from '@/components/nodes/FooterNode';
import HeaderNode from '@/components/nodes/HeaderNode';
import EmailNode from '@/components/nodes/EmailNode';
import PopupNode from '@/components/nodes/PopupNode';
import { STATUS_COLORS } from '@/data/statusColors';
import NodeWrapper from '@/components/nodes/NodeWrapper';


const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getNodeRank = (type) => {
  switch (type) {
    case 'header':
      return 0;
    case 'page':
      return 1;
    case 'popup':
    case 'email':
      return 2;
    case 'footer':
      return 3;
    default:
      return 1;
  }
};


const buildNodes = (pages) => {
  const customSize = {
    page: { width: 140, height: 170 },
    footer: { width: 1000, height: 100 },
    header: { width: 1000, height: 100 },
    email: { width: 160, height: 160 },
    popup: { width: 160, height: 140 },
  };

  return pages.map((page) => {
    const type = page.type || 'page';
    const status = page.status || 'default';
    const size = customSize[type] || customSize.page;

    return {
      id: page.id.toString(),
      type,
      position: {
        x: page.x ?? 0,
        y: page.y ?? 0,
      },
      style: { ...size },
      data: {
        title: page.title,
        thumbnailUrl: page.resource?.thumbnail?.url || null,
        status,
        backgroundColor: STATUS_COLORS[status] || STATUS_COLORS.default,
      },
    };
  });
};


const buildEdges = (pages) =>
  pages
    .filter((page) => page.parent_id)
    .map((page) => ({
      id: `edge-${page.parent_id}-${page.id}`,
      source: page.parent_id.toString(),
      target: page.id.toString(),
      animated: false,
      style: { stroke: '#6366f1', strokeWidth: 1 },
    }));

const applyLayout = (nodes, edges, direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.style?.width || 140,
      height: node.style?.height || 170,
      rank: getNodeRank(node.type),
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x: pos.x, y: pos.y },
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
    };
  });
};

export const ElementMap = ({ projectId }) => {
  const [pages, setPages] = useState([]);
  const [mode, setMode] = useState('edit');
  const supabase = createClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({
    page: (props) => (
      <NodeWrapper
        {...props}
        mode={mode}
        collectionName="element" // 👈 make sure this matches your actual route
        refField="element_map"   // 👈 this should match your schema config
      />
    ),
    footer: (props) => <FooterNode {...props} mode={mode} />,
    header: (props) => <HeaderNode {...props} mode={mode} />,
    email: (props) => <EmailNode {...props} mode={mode} />,
    popup: (props) => <PopupNode {...props} mode={mode} />,
  }), [mode]);
  
  

  const layoutIfNeeded = (nodes, edges) => {
    const hasLayout = nodes.every((n) => typeof n.position?.x === 'number' && typeof n.position?.y === 'number');
    return hasLayout ? nodes : applyLayout(nodes, edges, 'TB');
  };
  

  const handleNodeChange = async (changes) => {
    if (mode !== 'arrange') return;

    const updatedNodes = applyNodeChanges(changes, nodes);
    setNodes(updatedNodes);

    const positionUpdates = updatedNodes.map((node) => ({
      id: parseInt(node.id),
      x: node.position.x,
      y: node.position.y,
    }));

    const updates = positionUpdates.map(({ id, x, y }) =>
      supabase.from('element').update({ x, y }).eq('id', id)
    );

    console.log('💾 Updating nodes:', positionUpdates);
    await Promise.all(updates);
  };

  const handleConnect = async ({ source, target }) => {
    await supabase.from('element').update({ parent_id: parseInt(source) }).eq('id', parseInt(target));
    const { data } = await supabase
      .from('element')
      .select(`id, title, parent_id, status, type, project_id, x, y, resource:resource_id (thumbnail:thumbnail_id (url))`)
      .eq('project_id', projectId);

    const newNodes = buildNodes(data || []);
    const newEdges = buildEdges(data || []);
    const finalNodes = layoutIfNeeded(newNodes, newEdges);

    setNodes(finalNodes);
    setEdges(newEdges);
  };

  useEffect(() => {
    if (!projectId) return;

    const fetchPages = async () => {
      const { data } = await supabase
        .from('element')
        .select(`id, title, status, parent_id, type, project_id, x, y, resource:resource_id (thumbnail:thumbnail_id (url))`)
        .eq('project_id', projectId);

      const rawNodes = buildNodes(data || []);
      const rawEdges = buildEdges(data || []);
      const finalNodes = layoutIfNeeded(rawNodes, rawEdges);

      setPages(data || []);
      setNodes(finalNodes);
      setEdges(rawEdges);
    };

    fetchPages();
  }, [projectId]);

  return (
    <Box sx={{ height: '2000px', width: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodeChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        fitViewOptions={{ padding: 0.1 }}
        nodeExtent={[[0, 0], [5000, 10000]]}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderRadius: '999px',
            paddingRight: '15px',
          }}
        >
          <Switch
            checked={mode === 'arrange'}
            onChange={() => setMode(mode === 'edit' ? 'arrange' : 'edit')}
          />
        </Box>
        <Background gap={16} color="#e5e7eb" variant="dots" />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </Box>
  );
};
