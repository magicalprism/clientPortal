// TaskRelationshipDebugger.js - Debug parent-child relationships

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
} from '@mui/material';
import { Bug, Hierarchy } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';

const TaskRelationshipDebugger = () => {
  const supabase = createClient();
  const [tasks, setTasks] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [orphans, setOrphans] = useState([]);
  const [loading, setLoading] = useState(false);

  const debugRelationships = async () => {
    setLoading(true);
    
    try {
      // Fetch all task templates
      const { data: tasksData, error } = await supabase
        .from('task')
        .select('id, title, parent_id, milestone_id, is_template')
        .eq('is_template', true)
        .order('id');

      if (error) throw error;

      setTasks(tasksData || []);

      // Analyze relationships
      const taskMap = new Map();
      tasksData.forEach(task => {
        taskMap.set(task.id, task);
      });

      const relationshipIssues = [];
      const orphanedChildren = [];

      tasksData.forEach(task => {
        if (task.parent_id) {
          const parent = taskMap.get(task.parent_id);
          if (!parent) {
            orphanedChildren.push({
              child: task,
              missingParentId: task.parent_id,
              issue: 'Parent task not found'
            });
          } else if (parent.milestone_id !== task.milestone_id) {
            relationshipIssues.push({
              child: task,
              parent: parent,
              issue: 'Child and parent in different milestones'
            });
          } else {
            relationshipIssues.push({
              child: task,
              parent: parent,
              issue: 'Valid relationship'
            });
          }
        }
      });

      setRelationships(relationshipIssues);
      setOrphans(orphanedChildren);

      console.log('🔍 Relationship Analysis:', {
        total: tasksData.length,
        withParents: tasksData.filter(t => t.parent_id).length,
        orphans: orphanedChildren.length,
        crossMilestone: relationshipIssues.filter(r => r.issue.includes('different')).length
      });

    } catch (err) {
      console.error('Debug error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    debugRelationships();
  }, []);

  const fixOrphan = async (orphan) => {
    if (confirm(`Remove parent_id from "${orphan.child.title}"?`)) {
      const { error } = await supabase
        .from('task')
        .update({ parent_id: null })
        .eq('id', orphan.child.id);

      if (!error) {
        debugRelationships(); // Refresh
      }
    }
  };

  const buildTreeView = (tasks) => {
    const taskMap = new Map();
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] });
    });

    const roots = [];
    
    tasks.forEach(task => {
      const taskNode = taskMap.get(task.id);
      if (task.parent_id && taskMap.has(task.parent_id)) {
        taskMap.get(task.parent_id).children.push(taskNode);
      } else {
        roots.push(taskNode);
      }
    });

    return roots;
  };

  const renderTree = (node, depth = 0) => (
    <Box key={node.id} sx={{ ml: depth * 3 }}>
      <Typography variant="body2" sx={{ py: 0.5 }}>
        {'└─ '.repeat(depth)}{node.title} 
        <Chip size="small" label={`ID: ${node.id}`} sx={{ ml: 1, fontSize: '0.7rem' }} />
        {node.milestone_id && (
          <Chip size="small" label={`M: ${node.milestone_id}`} sx={{ ml: 0.5, fontSize: '0.7rem' }} />
        )}
      </Typography>
      {node.children?.map(child => renderTree(child, depth + 1))}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Hierarchy size={24} />
        <Typography variant="h5">Task Relationship Debugger</Typography>
        <Button
          variant="outlined"
          onClick={debugRelationships}
          disabled={loading}
          startIcon={<Bug size={16} />}
        >
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </Stack>

      {/* Summary Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" color="primary">Total Templates</Typography>
          <Typography variant="h3">{tasks.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" color="success.main">With Parents</Typography>
          <Typography variant="h3">{tasks.filter(t => t.parent_id).length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" color="error.main">Orphans</Typography>
          <Typography variant="h3">{orphans.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" color="warning.main">Issues</Typography>
          <Typography variant="h3">{relationships.filter(r => r.issue !== 'Valid relationship').length}</Typography>
        </Paper>
      </Stack>

      {/* Orphaned Children */}
      {orphans.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" color="error.main" gutterBottom>
            Orphaned Children (Parent Not Found)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Child Task</TableCell>
                  <TableCell>Missing Parent ID</TableCell>
                  <TableCell>Milestone</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orphans.map((orphan, index) => (
                  <TableRow key={index}>
                    <TableCell>{orphan.child.title}</TableCell>
                    <TableCell>{orphan.missingParentId}</TableCell>
                    <TableCell>{orphan.child.milestone_id || 'Unassigned'}</TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => fixOrphan(orphan)}
                      >
                        Remove Parent
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Relationship Issues */}
      {relationships.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Parent-Child Relationships
          </Typography>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Child Task</TableCell>
                  <TableCell>Parent Task</TableCell>
                  <TableCell>Child Milestone</TableCell>
                  <TableCell>Parent Milestone</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {relationships.map((rel, index) => (
                  <TableRow key={index}>
                    <TableCell>{rel.child.title}</TableCell>
                    <TableCell>{rel.parent?.title || 'N/A'}</TableCell>
                    <TableCell>{rel.child.milestone_id || 'Unassigned'}</TableCell>
                    <TableCell>{rel.parent?.milestone_id || 'Unassigned'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={rel.issue}
                        size="small"
                        color={rel.issue === 'Valid relationship' ? 'success' : 'warning'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Tree View */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tree Structure Preview
        </Typography>
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {buildTreeView(tasks).map(root => renderTree(root))}
        </Box>
      </Paper>

      {/* Quick Fixes */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={async () => {
              if (confirm('Remove ALL parent relationships? This will make all tasks root-level.')) {
                await supabase.from('task').update({ parent_id: null }).eq('is_template', true);
                debugRelationships();
              }
            }}
          >
            Clear All Parent Relationships
          </Button>
          
          <Button
            variant="outlined"
            onClick={async () => {
              if (confirm('Fix cross-milestone relationships by moving children to parent milestones?')) {
                for (const rel of relationships) {
                  if (rel.issue.includes('different') && rel.parent) {
                    await supabase
                      .from('task')
                      .update({ milestone_id: rel.parent.milestone_id })
                      .eq('id', rel.child.id);
                  }
                }
                debugRelationships();
              }
            }}
          >
            Fix Cross-Milestone Issues
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default TaskRelationshipDebugger;