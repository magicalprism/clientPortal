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
import { 
  Box, 
  Switch, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Plus, X } from '@phosphor-icons/react';
import dagre from 'dagre';

import PageNode from '@/components/nodes/PageNode';
import FooterNode from '@/components/nodes/FooterNode';
import HeaderNode from '@/components/nodes/HeaderNode';
import EmailNode from '@/components/nodes/EmailNode';
import PopupNode from '@/components/nodes/PopupNode';
import { STATUS_COLORS } from '@/data/statusColors';
import NodeWrapper from '@/components/nodes/NodeWrapper';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';

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
    const title = page.title || 'title';
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
        title: title,
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
  const [companyId, setCompanyId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', type: 'page', create_folder: false });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  
  const supabase = createClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

const nodeTypes = useMemo(() => ({
  page: (props) => (
    <NodeWrapper
      {...props}
      mode={mode}
      collectionName="element"
      refField="element_map"
      data={{ ...props.data, label: props.data.title }}
      onRefresh={fetchPages} // Pass refresh function to enable delete
    />
  ),
  footer: (props) => (
    <FooterNode 
      {...props} 
      mode={mode} 
      onRefresh={fetchPages} // Pass refresh function
    />
  ),
  header: (props) => (
    <HeaderNode 
      {...props} 
      mode={mode} 
      onRefresh={fetchPages} // Pass refresh function
    />
  ),
  email: (props) => (
    <EmailNode 
      {...props} 
      mode={mode} 
      onRefresh={fetchPages} // Pass refresh function
    />
  ),
  popup: (props) => (
    <PopupNode 
      {...props} 
      mode={mode} 
      onRefresh={fetchPages} // Pass refresh function
    />
  ),
}), [mode]); // Add fetchPages to dependencies if it changes

  const layoutIfNeeded = (nodes, edges) => {
    const hasLayout = nodes.every((n) => typeof n.position?.x === 'number' && typeof n.position?.y === 'number');
    return hasLayout ? nodes : applyLayout(nodes, edges, 'TB');
  };

  const fetchPages = async () => {
    if (!projectId) return;
    
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

  // Fetch company_id from project
  const fetchProjectCompany = async () => {
    if (!projectId) return;
    
    const { data: project } = await supabase
      .from('project')
      .select('company_id')
      .eq('id', projectId)
      .single();
      
    if (project?.company_id) {
      setCompanyId(project.company_id);
    }
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
    await fetchPages();
  };

  // Add Element Modal Handlers
  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setFormData({ title: '', type: 'page', create_folder: false });
    setCreateError(null);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormData({ title: '', type: 'page', create_folder: false });
    setCreateError(null);
  };

  const handleCreateElement = async () => {
    if (!formData.title?.trim()) {
      setCreateError('Element name is required');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const now = getPostgresTimestamp();
      const currentContactId = await getCurrentContactId();

      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        company_id: companyId,
        project_id: projectId,
        status: 'plan',
        create_folder: formData.create_folder,
        created_at: now,
        updated_at: now,
      };

      if (currentContactId) {
        payload.author_id = currentContactId;
      }

      console.log('[ElementMap] Creating element:', payload);

      const { data: newElement, error: insertError } = await supabase
        .from('element')
        .insert([payload])
        .select(`id, title, status, parent_id, type, project_id, x, y, resource:resource_id (thumbnail:thumbnail_id (url))`)
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('[ElementMap] Element created successfully:', newElement);
      
      // Refresh the map
      await fetchPages();
      
      // Create Google Drive folder if requested
      if (newElement && formData.create_folder) {
        try {
          // First fetch the company and project details for the API call
          const { data: projectDetails } = await supabase
            .from('project')
            .select(`
              id,
              title,
              company:company_id (
                id,
                title
              )
            `)
            .eq('id', projectId)
            .single();

          if (projectDetails) {
            const response = await fetch('/api/google-drive', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'element',
                payload: {
                  ...newElement,
                  create_folder: true,
                  company_id_details: projectDetails.company,
                  project_id_details: { title: projectDetails.title },
                  companyTitle: projectDetails.company?.title,
                  projectTitle: projectDetails.title
                }
              })
            });
            
            if (response.ok) {
              console.log('[ElementMap] Google Drive folder created for element');
            } else {
              console.warn('[ElementMap] Google Drive folder creation failed');
            }
          }
        } catch (error) {
          console.log('[ElementMap] Google Drive folder creation error:', error);
        }
      }

      handleCloseAddModal();

    } catch (err) {
      console.error('[ElementMap] Error creating element:', err);
      setCreateError(err.message || 'An error occurred while creating the element');
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    fetchPages();
    fetchProjectCompany();
  }, [projectId]);

  return (
    <>
      <Box sx={{ height: '2000px', width: '100%', position: 'relative' }}>
        {/* Floating controls bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1300,
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            backgroundColor: 'background.paper',
            boxShadow: 2,
            px: 2,
            py: 1,
          }}
        >
          {/* Add Element Button */}
          <Button
            variant="outlined"
            size="small"
            onClick={handleOpenAddModal}
            startIcon={<Plus />}
            sx={{ minWidth: 'auto' }}
          >
            Add Element
          </Button>
          
          {/* Mode Switch */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch
              checked={mode === 'arrange'}
              onChange={() => setMode(mode === 'edit' ? 'arrange' : 'edit')}
              size="small"
            />
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', minWidth: 60 }}>
              {mode === 'arrange' ? 'Arrange' : 'Edit'}
            </Box>
          </Box>
        </Box>

        {/* React Flow Graph */}
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
          <Background gap={16} color="#e5e7eb" variant="dots" />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </Box>

      {/* Add Element Modal */}
      <Dialog 
        open={showAddModal} 
        onClose={handleCloseAddModal} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          Add New Element
          <IconButton 
            onClick={handleCloseAddModal}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <X />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {createError && (
            <Typography 
              color="error" 
              variant="body2" 
              sx={{ 
                mb: 2, 
                p: 1, 
                bgcolor: 'error.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'error.200'
              }}
            >
              {createError}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Element Name"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
              autoFocus
              placeholder="e.g. Homepage, About Page, Contact Form"
            />

            <FormControl fullWidth>
              <InputLabel>Element Type</InputLabel>
              <Select
                value={formData.type}
                label="Element Type"
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="page">Page</MenuItem>
                <MenuItem value="header">Header</MenuItem>
                <MenuItem value="footer">Footer</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="popup">Popup</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.create_folder}
                  onChange={(e) => setFormData(prev => ({ ...prev, create_folder: e.target.checked }))}
                />
              }
              label="Create Google Drive Folder?"
              sx={{ mt: 1 }}
            />

            {/* Show auto-filled context */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Auto-filled from current project:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                • Project ID: {projectId}
              </Typography>
              {companyId && (
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  • Company ID: {companyId}
                </Typography>
              )}
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                • Default Status: plan
              </Typography>
              {formData.create_folder && (
                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'success.main' }}>
                  • Google Drive folder will be created
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseAddModal} 
            disabled={isCreating}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateElement}
            variant="contained" 
            disabled={isCreating || !formData.title?.trim()}
            startIcon={isCreating ? <CircularProgress size={16} /> : <Plus />}
          >
            {isCreating ? 'Creating...' : 'Create Element'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};