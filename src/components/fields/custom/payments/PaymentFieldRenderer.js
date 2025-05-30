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
    return null; // Don't render if we don't have a record ID
  }

  return (
    <PaymentThread
      pivotTable={pivotTable}
      entityField={entityField}
      entityId={record.id}
      label={label}
      record={record}
      showInvoiceButton={showInvoiceButton}
    />
  );
};

export default PaymentFieldRenderer;