'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Stack, Button, CircularProgress, TextField, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  InputAdornment, Chip
} from '@mui/material';
import { Plus, Trash, DotsSixVertical, CurrencyDollar, Receipt } from '@phosphor-icons/react';
import usePayments from '@/components/fields/custom/payments/usePayments';
import { useCurrentContact } from '@/hooks/useCurrentContact';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';

// Sortable Payment Row Component
const SortablePaymentRow = ({ payment, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: payment.id });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    zIndex: isDragging ? 10 : undefined
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      sx={{
        opacity: isDragging ? 0.7 : 1,
        backgroundColor: isDragging ? 'action.hover' : 'inherit',
      }}
    >
      {children({ listeners, attributes })}
    </TableRow>
  );
};

export const PaymentThread = ({ 
  pivotTable, 
  entityField, 
  entityId, 
  label = 'Payment Schedule',
  record,
  showInvoiceButton = true,
  onCreatePendingPayment
}) => {
  // Creation states
  const [creationStep, setCreationStep] = useState('none'); // 'none', 'form'
  const [newPaymentData, setNewPaymentData] = useState({
    title: '',
    amount: '',
    due_date: '',
    alt_due_date: ''
  });
  
  // Edit states
  const [editingPayment, setEditingPayment] = useState(null);
  const [editData, setEditData] = useState({
    title: '',
    amount: '',
    due_date: '',
    alt_due_date: ''
  });
  const [activePayment, setActivePayment] = useState(null);
  
  const { contact, loading: contactLoading } = useCurrentContact();
  const { 
    payments, 
    addPayment, 
    updatePayment, 
    deletePayment, 
    reorderPayments,
    calculateTotal,
    loading: paymentsLoading 
  } = usePayments({ pivotTable, entityField, entityId });

  const sensor = useSensor(PointerSensor);
  const sensors = useSensors(sensor);

  // Create new payment
  const handleCreatePayment = async () => {
  if (!newPaymentData.title.trim() || !newPaymentData.amount) return;

  const amount = parseFloat(newPaymentData.amount);
  if (isNaN(amount) || amount <= 0) return;

  const paymentPayload = {
    title: newPaymentData.title.trim(),
    amount,
    due_date: newPaymentData.due_date ? new Date(newPaymentData.due_date).toISOString() : null,
    alt_due_date: newPaymentData.alt_due_date.trim()
  };

  if (!record?.id && typeof onCreatePendingPayment === 'function') {
    console.log('[PaymentThread] Deferring payment creation until record is saved.');
    onCreatePendingPayment(paymentPayload);
  } else {
    const newPayment = await addPayment(
      paymentPayload.title,
      paymentPayload.amount,
      paymentPayload.due_date,
      paymentPayload.alt_due_date
    );

    if (!newPayment?.id) return;
  }

  // Reset creation state
  setCreationStep('none');
  setNewPaymentData({
    title: '',
    amount: '',
    due_date: '',
    alt_due_date: ''
  });
};


  // Cancel creation process
  const handleCancelCreation = () => {
    setCreationStep('none');
    setNewPaymentData({
      title: '',
      amount: '',
      due_date: '',
      alt_due_date: ''
    });
  };

  // Regular edit functions
  const handleStartEdit = (payment) => {
    setEditingPayment(payment.id);
    setEditData({
      title: payment.title || '',
      amount: payment.amount?.toString() || '',
      due_date: payment.due_date ? new Date(payment.due_date).toISOString().split('T')[0] : '',
      alt_due_date: payment.alt_due_date || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editData.title.trim() || !editData.amount) return;
    
    const amount = parseFloat(editData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const dueDate = editData.due_date ? new Date(editData.due_date).toISOString() : null;
    
    await updatePayment(
      editingPayment, 
      editData.title.trim(), 
      amount,
      dueDate,
      editData.alt_due_date.trim()
    );
    
    setEditingPayment(null);
    setEditData({
      title: '',
      amount: '',
      due_date: '',
      alt_due_date: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
    setEditData({
      title: '',
      amount: '',
      due_date: '',
      alt_due_date: ''
    });
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      await deletePayment(paymentId);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActivePayment(null);
    
    if (!active || !over || active.id === over.id) return;

    const oldIndex = payments.findIndex(payment => payment.id === active.id);
    const newIndex = payments.findIndex(payment => payment.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(payments, oldIndex, newIndex);
      await reorderPayments(newOrder);
    }
  };

  const handleDragStart = (event) => {
    setActivePayment(payments.find(payment => payment.id === event.active.id));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (paymentsLoading || contactLoading) return <CircularProgress size={24} />;

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{label}</Typography>
        <Stack direction="row" spacing={2}>
          {showInvoiceButton && payments.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<Receipt />}
              onClick={() => {
                // TODO: Implement invoice sending
                console.log('Send invoice clicked');
              }}
              size="small"
            >
              Send Invoice
            </Button>
          )}
          {contact && creationStep === 'none' && (
            <Button
              variant="outlined"
              startIcon={<Plus />}
              onClick={() => setCreationStep('form')}
              size="small"
            >
              Add Payment
            </Button>
          )}
        </Stack>
      </Box>
      
      {/* Creation Form */}
      {creationStep === 'form' && (
        <Paper sx={{ p: 3, mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
          <Typography variant="subtitle2" gutterBottom color="primary.main">
            Add New Payment
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Payment Title"
              value={newPaymentData.title}
              onChange={(e) => setNewPaymentData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Initial Deposit, Final Payment, Milestone 1..."
              autoFocus
            />
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={newPaymentData.amount}
              onChange={(e) => setNewPaymentData(prev => ({ ...prev, amount: e.target.value }))}
              InputProps={{
                startAdornment: <InputAdornment position="start"><CurrencyDollar size={20} /></InputAdornment>,
              }}
              placeholder="0.00"
            />
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={newPaymentData.due_date}
              onChange={(e) => setNewPaymentData(prev => ({ ...prev, due_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Alternative Due Date Text"
              value={newPaymentData.alt_due_date}
              onChange={(e) => setNewPaymentData(prev => ({ ...prev, alt_due_date: e.target.value }))}
              placeholder="e.g., 7 days before project launch, Upon completion..."
              helperText="Use this when you don't have an exact date yet"
            />
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained" 
                onClick={handleCreatePayment}
                disabled={!newPaymentData.title.trim() || !newPaymentData.amount}
              >
                Add Payment
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleCancelCreation}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Payments Table */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="40px"></TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Alternative Due Date</TableCell>
                {contact && <TableCell width="100px">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              <SortableContext items={payments.map(payment => payment.id)} strategy={verticalListSortingStrategy}>
                {payments.map((payment) => (
                  <SortablePaymentRow key={payment.id} payment={payment}>
                    {({ listeners, attributes }) => (
                      editingPayment === payment.id ? (
                        // Edit Mode Row
                        <>
                          <TableCell>
                            <IconButton size="small" disabled>
                              <DotsSixVertical size={16} />
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={editData.title}
                              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={editData.amount}
                              onChange={(e) => setEditData(prev => ({ ...prev, amount: e.target.value }))}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="date"
                              value={editData.due_date}
                              onChange={(e) => setEditData(prev => ({ ...prev, due_date: e.target.value }))}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={editData.alt_due_date}
                              onChange={(e) => setEditData(prev => ({ ...prev, alt_due_date: e.target.value }))}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button size="small" onClick={handleSaveEdit}>Save</Button>
                              <Button size="small" onClick={handleCancelEdit}>Cancel</Button>
                            </Stack>
                          </TableCell>
                        </>
                      ) : (
                        // View Mode Row
                        <>
                          <TableCell>
                            {contact && (
                              <IconButton
                                size="small"
                                {...listeners}
                                {...attributes}
                                sx={{ cursor: 'grab' }}
                              >
                                <DotsSixVertical size={16} />
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {payment.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium" color="success.main">
                              {formatCurrency(payment.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {payment.due_date ? (
                              <Chip 
                                label={formatDate(payment.due_date)} 
                                size="small" 
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {payment.alt_due_date ? (
                              <Typography variant="body2" color="text.secondary">
                                {payment.alt_due_date}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          {contact && (
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => handleStartEdit(payment)}
                                >
                                  Edit
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeletePayment(payment.id)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <Trash size={16} />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          )}
                        </>
                      )
                    )}
                  </SortablePaymentRow>
                ))}
              </SortableContext>
              
              {/* Total Row */}
              {payments.length > 0 && (
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell></TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      Total
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(calculateTotal())}
                    </Typography>
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  {contact && <TableCell></TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {payments.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No payments scheduled yet. Click "Add Payment" to create the first one!
              </Typography>
            </Box>
          )}
        </TableContainer>

        <DragOverlay dropAnimation={null}>
          {activePayment ? (
            <Paper sx={{ p: 2, boxShadow: 3, opacity: 0.95 }}>
              <Typography variant="body2" fontWeight="medium">
                {activePayment.title} - {formatCurrency(activePayment.amount)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Moving payment...
              </Typography>
            </Paper>
          ) : null}
        </DragOverlay>
      </DndContext>

      {!contact && !contactLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
          Please log in to manage payments.
        </Typography>
      )}
    </Box>
  );
};