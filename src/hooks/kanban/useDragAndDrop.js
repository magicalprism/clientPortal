// hooks/useDragAndDrop.js - Fixed intent detection and collision logic

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export const useDragAndDrop = ({ 
  tasks, 
  milestones, 
  groupedTasks, 
  updateTaskOptimistically 
}) => {
  const [activeTask, setActiveTask] = useState(null);
  const [dragIntent, setDragIntent] = useState(null);
  const [initialPointer, setInitialPointer] = useState(null);

  // Drag and drop sensors - Free movement
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Enhanced collision detection - NO setState calls here
  const customCollisionDetection = useCallback((args) => {
    const { active, droppableContainers } = args;
    
    if (!active || !droppableContainers.length) {
      console.log('🔍 Collision detection: no active or containers');
      return [];
    }

    console.log('🔍 Collision detection:', { 
      activeId: active.id, 
      dragIntent, 
      totalContainers: droppableContainers.length
    });

    // Filter containers based on current intent (don't update intent here)
    let relevantContainers = droppableContainers;
    
    if (dragIntent === 'parent') {
      // Only look for task containers (potential parents)
      relevantContainers = droppableContainers.filter(container => {
        const containerId = container.id.toString();
        return !containerId.startsWith('drop-') && 
               !containerId.startsWith('milestone-') &&
               !isNaN(parseInt(containerId));
      });
      console.log('🔍 Parent mode - relevant containers:', relevantContainers.length, 'task containers');
    } else {
      // Only look for drop zones and milestones (reorder intent)
      relevantContainers = droppableContainers.filter(container => {
        const containerId = container.id.toString();
        return containerId.startsWith('drop-') || 
               containerId.startsWith('milestone-');
      });
      console.log('🔍 Reorder mode - relevant containers:', relevantContainers.length, 'drop zones and milestones');
      console.log('🔍 Drop zones sample:', relevantContainers.filter(c => c.id.toString().startsWith('drop-')).map(c => c.id).slice(0, 10));
    }

    // Use pointerWithin for precise detection
    const collisions = pointerWithin({
      ...args,
      droppableContainers: relevantContainers
    });
    
    console.log('🔍 Collisions found:', collisions.length, collisions.map(c => c.id));
    
    if (collisions.length === 0) {
      const centerCollisions = closestCenter({
        ...args,
        droppableContainers: relevantContainers
      });
      console.log('🔍 Fallback to center collisions:', centerCollisions.length, 'found, first 5:', centerCollisions.slice(0, 5).map(c => c.id));
      return centerCollisions;
    }

    return collisions;
  }, [dragIntent]);

  // Get all sortable IDs
  const allSortableIds = useMemo(() => {
    const ids = [];
    
    // Add milestone drop zones
    milestones.forEach(milestone => {
      ids.push(`milestone-${milestone.id}`);
      ids.push(`drop-in-empty-${milestone.id}`);
    });
    ids.push('milestone-unassigned');
    ids.push('drop-in-empty-unassigned');
    
    // Add task IDs and drop zones
    const traverse = (tasks, parentId = null) => {
      tasks.forEach((task, index) => {
        ids.push(`drop-before-${task.id}`);
        ids.push(task.id.toString());
        
        if (task.children?.length > 0) {
          traverse(task.children, task.id);
        }
        
        if (index === tasks.length - 1) {
          ids.push(`drop-after-${task.id}`);
        }
      });
    };
    
    Object.values(groupedTasks).forEach(tree => {
      traverse(tree);
    });
    
    return ids;
  }, [groupedTasks, milestones]);

  // Helper function to check if a task is a descendant of another
  const isDescendantOf = useCallback((taskId, ancestorId, tasks) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.parent_id) return false;
    if (task.parent_id === ancestorId) return true;
    return isDescendantOf(task.parent_id, ancestorId, tasks);
  }, []);

  // Check for circular references
  const isCircularReference = useCallback((taskId, potentialParentId, tasks) => {
    if (taskId === potentialParentId) return true;
    const task = tasks.find(t => t.id === potentialParentId);
    if (!task) return false;
    if (!task.parent_id) return false;
    if (task.parent_id === taskId) return true;
    return isCircularReference(taskId, task.parent_id, tasks);
  }, []);

  // Drag start handler
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const task = tasks.find(t => t.id.toString() === active.id);
    setActiveTask(task);
    setDragIntent('reorder'); // Start with reorder intent
    setInitialPointer(null); // Will be set on first move
    console.log('🫳 Drag started:', task?.title, 'ID:', active.id);
  }, [tasks]);

  // Drag move handler to track movement and update intent
  const handleDragMove = useCallback((event) => {
    const { delta, activatorEvent } = event;
    
    console.log('👆 Drag move:', { delta, hasInitialPointer: !!initialPointer });
    
    // Set initial pointer on first move
    if (!initialPointer && activatorEvent) {
      const rect = activatorEvent.target.getBoundingClientRect();
      setInitialPointer({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      console.log('📍 Set initial pointer:', { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      return;
    }

    if (!initialPointer) return;

    // Calculate total movement from initial position
    const totalHorizontalMovement = Math.abs(delta.x);
    const totalVerticalMovement = Math.abs(delta.y);
    const rightwardMovement = delta.x;
    
    console.log('📐 Movement:', { 
      horizontal: totalHorizontalMovement, 
      vertical: totalVerticalMovement, 
      rightward: rightwardMovement,
      currentIntent: dragIntent
    });
    
    // Determine intent based on movement pattern
    let newIntent = 'reorder'; // default
    
    // If moved significantly to the right (more than 80px), it's parent intent
    if (rightwardMovement > 80 && totalHorizontalMovement > totalVerticalMovement) {
      newIntent = 'parent';
    }
    // If vertical movement dominates or minimal horizontal movement, it's reorder intent
    else if (totalVerticalMovement > totalHorizontalMovement || Math.abs(rightwardMovement) < 50) {
      newIntent = 'reorder';
    }
    
    // Update intent if changed
    if (newIntent !== dragIntent) {
      console.log('🎯 Intent changed:', dragIntent, '->', newIntent);
      setDragIntent(newIntent);
    }
  }, [initialPointer, dragIntent]);

  // Drag end handler
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    
    console.log('🏁 Drag end triggered:', { 
      activeId: active?.id, 
      overId: over?.id, 
      dragIntent,
      activeTaskTitle: activeTask?.title 
    });
    
    setActiveTask(null);
    setDragIntent(null);
    setInitialPointer(null);

    if (!over || active.id === over.id) {
      console.log('🫳 Drag cancelled or same position');
      return;
    }

    const activeTaskId = parseInt(active.id);
    const overString = over.id.toString();
    
    const draggedTask = tasks.find(t => t.id === activeTaskId);
    
    if (!draggedTask) {
      console.error('❌ Active task not found:', activeTaskId);
      return;
    }

    console.log(`🫳 Moving "${draggedTask.title}" to "${overString}" with intent: ${dragIntent}`);

    let updateData = {};

    // Handle based on drop target and intent
    if (dragIntent === 'parent' && !isNaN(parseInt(overString))) {
      console.log('🔗 Parent relationship logic...');
      // Parent relationship
      const parentTaskId = parseInt(overString);
      const parentTask = tasks.find(t => t.id === parentTaskId);
      
      if (parentTask && parentTask.id !== draggedTask.id) {
        // Check for circular reference
        if (isCircularReference(draggedTask.id, parentTaskId, tasks)) {
          console.warn('⚠️ Cannot create circular reference');
          return;
        }
        
        updateData = {
          parent_id: parentTaskId,
          milestone_id: parentTask.milestone_id, // Inherit parent's milestone
          order_index: 0 // Reset order as child
        };
        console.log(`🔗 Setting parent: ${parentTask.title}`);
      }
    }
    else if (overString.startsWith('milestone-') || overString.startsWith('drop-in-empty-')) {
      console.log('📋 Milestone assignment logic...');
      // Milestone assignment
      const milestoneId = overString.startsWith('drop-in-empty-') 
        ? overString.replace('drop-in-empty-', '')
        : overString.replace('milestone-', '');
      const newMilestoneId = milestoneId === 'unassigned' ? null : parseInt(milestoneId);
      updateData = {
        milestone_id: newMilestoneId,
        parent_id: null, // Reset parent when moving to different milestone
        order_index: 0 // Reset order
      };
      console.log(`📋 Moving to milestone: ${newMilestoneId}`);
    }
    else if (overString.startsWith('drop-before-') || overString.startsWith('drop-after-')) {
      console.log('📝 Reordering logic...');
      // Reordering
      const targetTaskId = parseInt(overString.replace(/^drop-(before|after)-/, ''));
      const targetTask = tasks.find(t => t.id === targetTaskId);
      
      if (targetTask) {
        const isBefore = overString.startsWith('drop-before-');
        
        console.log(`📝 Target task: "${targetTask.title}", position: ${isBefore ? 'before' : 'after'}`);
        
        // Get all siblings at the same level, excluding the task being moved
        const siblingsAtLevel = tasks
          .filter(t => 
            t.parent_id === targetTask.parent_id && 
            t.milestone_id === targetTask.milestone_id &&
            t.id !== activeTaskId // Exclude the task being moved
          )
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        
        console.log('👥 Siblings at level:', siblingsAtLevel.map(t => ({ 
          id: t.id, 
          title: t.title.substring(0, 20) + '...', 
          order_index: t.order_index,
          raw_order: t.order_index,
          sort_value: t.order_index || 0
        })));
        
        // Find target task's current position in the sorted list
        const targetIndex = siblingsAtLevel.findIndex(t => t.id === targetTaskId);
        console.log('🎯 Target index:', targetIndex, 'of', siblingsAtLevel.length, 'siblings');
        
        let newOrderIndex;
        
        // Check if all siblings have null order_index (common case)
        const allOrdersAreNull = siblingsAtLevel.every(t => t.order_index === null || t.order_index === undefined);
        
        if (allOrdersAreNull) {
          console.log('🔄 All orders are null, creating sequence...');
          // Create a proper sequence: assign orders based on desired position
          if (isBefore) {
            // Place before target: target gets (targetIndex * 1000), this task gets (targetIndex * 1000 - 500)
            newOrderIndex = (targetIndex * 1000) - 500;
          } else {
            // Place after target: target gets (targetIndex * 1000), this task gets ((targetIndex + 1) * 1000)
            newOrderIndex = (targetIndex + 1) * 1000;
          }
          console.log(`📍 Sequence-based order: ${newOrderIndex} (target at index ${targetIndex})`);
        } else {
          // Use the existing midpoint logic for tasks with actual order values
          if (isBefore) {
            // Insert before target
            if (targetIndex <= 0) {
              // Target is first item
              const targetOrder = targetTask.order_index || 0;
              newOrderIndex = targetOrder - 1000;
            } else {
              // Insert between previous task and target
              const prevTask = siblingsAtLevel[targetIndex - 1];
              if (prevTask) {
                const targetOrderIndex = targetTask.order_index || 0;
                const prevOrderIndex = prevTask.order_index || 0;
                newOrderIndex = Math.floor((prevOrderIndex + targetOrderIndex) / 2);
                // If they're too close, space them out
                if (Math.abs(newOrderIndex - targetOrderIndex) < 1) {
                  newOrderIndex = targetOrderIndex - 1000;
                }
              } else {
                newOrderIndex = (targetTask.order_index || 0) - 1000;
              }
            }
          } else {
            // Insert after target
            if (targetIndex >= siblingsAtLevel.length - 1) {
              // Target is last item
              const targetOrder = targetTask.order_index || 0;
              newOrderIndex = targetOrder + 1000;
            } else {
              // Insert between target and next task
              const nextTask = siblingsAtLevel[targetIndex + 1];
              if (nextTask) {
                const targetOrderIndex = targetTask.order_index || 0;
                const nextOrderIndex = nextTask.order_index || 0;
                newOrderIndex = Math.floor((targetOrderIndex + nextOrderIndex) / 2);
                // If they're too close, space them out
                if (Math.abs(newOrderIndex - targetOrderIndex) < 1) {
                  newOrderIndex = targetOrderIndex + 1000;
                }
              } else {
                newOrderIndex = (targetTask.order_index || 0) + 1000;
              }
            }
          }
        }
        
        updateData = {
          parent_id: targetTask.parent_id,
          milestone_id: targetTask.milestone_id,
          order_index: newOrderIndex
        };
        console.log(`📝 Reordering: ${isBefore ? 'before' : 'after'} "${targetTask.title}", new order=${newOrderIndex}, target order=${targetTask.order_index}, siblings=${siblingsAtLevel.length}`);
      }
    }
    else {
      console.log('🤷 Unknown drop target, skipping');
      return;
    }

    console.log('🔄 About to call updateTaskOptimistically with:', updateData);
    
    // Update UI immediately (optimistic)
    updateTaskOptimistically(activeTaskId, updateData);
    console.log('✅ Task moved (optimistic)');
  }, [tasks, updateTaskOptimistically, isCircularReference, dragIntent, activeTask]);

  // Check if a task can be a valid parent for the dragged task
  const canBeParent = useCallback((taskId, draggedTaskId) => {
    if (!draggedTaskId || draggedTaskId === taskId) return false;
    
    // Check if this would create a circular reference
    if (isCircularReference(draggedTaskId, taskId, tasks)) return false;
    
    // Check if the dragged task is already a parent of this task
    if (isDescendantOf(taskId, draggedTaskId, tasks)) return false;
    
    return true;
  }, [tasks, isDescendantOf, isCircularReference]);

  return {
    // State
    activeTask,
    dragIntent,
    
    // Configuration
    sensors,
    customCollisionDetection,
    allSortableIds,
    verticalListSortingStrategy,
    
    // Handlers
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    
    // Utilities
    canBeParent,
    isDescendantOf,
    isCircularReference,
    
    // DndContext props
    dndContextProps: {
      sensors,
      collisionDetection: customCollisionDetection,
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      // NO modifiers - allow free movement
      measuring: {
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      },
    }
  };
};