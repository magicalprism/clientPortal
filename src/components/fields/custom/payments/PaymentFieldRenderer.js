// src/components/fields/custom/payments/PaymentFieldRenderer.js
'use client';

import { PaymentThread } from '@/components/fields/custom/payments/PaymentThread';

/**
 * Payment field renderer for handling payment tables in collections.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.field - Field configuration
 * @param {Object} props.record - Current record data
 * @param {boolean} props.editable - Whether the field is editable
 * @param {string} props.mode - Display mode ('view', 'edit', 'create')
 * @param {Function} props.onChange - Change handler
 */
export const PaymentFieldRenderer = ({
  field,
  record,
  editable = false,
  mode = 'view',
  onChange = () => {}
}) => {
  // Extract configuration from field props
  const {
    pivotTable = 'contract_payment', // Default pivot table
    entityField = 'contract_id', // Default entity field
    label = 'Payment Schedule',
    showInvoiceButton = true
  } = field.props || {};

  if (!record?.id) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary">
        Save the contract before adding payments.
      </Typography>
    </Box>
  );
}


  return (
    <PaymentThread
      pivotTable={pivotTable}
      entityField={entityField}
      entityId={record.id}
      label={label}
      record={record}
      showInvoiceButton={showInvoiceButton}
      onCreatePendingPayment={(payment) =>
    setPendingPayments(prev => [...prev, payment])
  }
    />
  );
};

export default PaymentFieldRenderer;