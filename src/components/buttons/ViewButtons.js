// Updated ViewButtons.jsx using centralized query system
'use client';

import { IconButton, Box, Tooltip } from '@mui/material';
import { Eye, CornersOut } from '@phosphor-icons/react';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';
import { DeleteRecordButton } from '@/components/buttons/DeleteRecordButton';
import Image from 'next/image';
import {
  Globe,
  Envelope,
  Phone,
  Folder,
  LinkSimple,
  Hash,
  Palette,
  DownloadSimple,
  Printer,
  PaintBrush,
  Blueprint,
  SignIn,
  Link,
} from '@phosphor-icons/react';
import { generateElementorExportZip } from '@/lib/utils/exports/elementorExport';
import { table } from '@/lib/supabase/queries';

export const ViewButtons = ({ 
  config, 
  id, 
  record,
  onRefresh,
  onDeleteSuccess, // ✅ Custom delete success handler
  showDelete = true,
  showFullView = true,
  showModal = true,
  showExport = true,
  size = 'small',
  isInModal = false
}) => {
  const { openModal, closeModal } = useModal();
  const fullConfig = collections[config.name] || config;

  // ✅ Fetch record using centralized query system
  const fetchRecordById = async (entityId) => {
    try {
      const entityQueries = table[fullConfig.name];
      
      if (!entityQueries) {
        console.error(`[ViewButtons] No queries found for entity: ${fullConfig.name}`);
        return null;
      }

      // Use standard SOP naming pattern
      const fetchFunction = entityQueries[`fetch${capitalizeFirst(fullConfig.name)}ById`] || 
                           entityQueries[`fetch${capitalizeFirst(fullConfig.singularLabel || fullConfig.name)}ById`];
      
      if (!fetchFunction) {
        console.error(`[ViewButtons] Fetch function not found for entity: ${fullConfig.name}`);
        return null;
      }

      const { data, error } = await fetchFunction(entityId);
      
      if (error) {
        console.error(`[ViewButtons] Failed to fetch record ${entityId}:`, error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error(`[ViewButtons] Error fetching record:`, err);
      return null;
    }
  };

  // Open modal view
  const handleOpenModal = async () => {
    let recordData = record;
    
    // ✅ Fetch record using query system if not provided
    if (!recordData && id) {
      recordData = await fetchRecordById(id);
      
      if (!recordData) {
        console.error('[ViewButtons] No record data available');
        return;
      }
    }

    if (!recordData) {
      console.error('[ViewButtons] No record data available');
      return;
    }

    openModal('edit', {
      config: fullConfig,
      defaultValues: recordData,
      onRefresh: onRefresh
    });
  };

  // Open full page view
  const handleOpenFullView = () => {
    if (fullConfig.editPathPrefix && id) {
      window.open(`${fullConfig.editPathPrefix}/${id}`, '_blank');
    }
  };

  // Handle delete success
  const handleDeleteSuccess = (deletedId) => {
    console.log('[ViewButtons] Record deleted:', deletedId);
    
    // ✅ If custom onDeleteSuccess provided, use it immediately (for tasks)
    if (onDeleteSuccess) {
      console.log('[ViewButtons] Using custom onDeleteSuccess callback');
      onDeleteSuccess(deletedId);
      return;
    }
    
    // ✅ Otherwise use default behavior (for regular records)
    if (isInModal) {
      closeModal();
    }
    
    if (onRefresh) {
      setTimeout(() => {
        onRefresh();
      }, 100);
    }
  };

  // Get collection-specific buttons (including export buttons)
  const specificButtons = getCollectionSpecificButtons(
    config.name || config.key, 
    record || { id }, 
    showExport
  );

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {/* Modal View Button */}
      {showModal && !isInModal && (
        <Tooltip title="Quick view">
          <IconButton size={size} onClick={handleOpenModal}>
            <Eye size={size === 'small' ? 16 : 20} />
          </IconButton>
        </Tooltip>
      )}

      {/* Full Page View Button */}
      {showFullView && fullConfig.editPathPrefix && (
        <Tooltip title="Open full view">
          <IconButton size={size} onClick={handleOpenFullView}>
            <CornersOut size={size === 'small' ? 16 : 20} />
          </IconButton>
        </Tooltip>
      )}

      {/* Collection-specific buttons (including exports) */}
      {specificButtons.map((btn, i) => (
        <Tooltip title={btn.label} key={`specific-${i}`}>
          <IconButton
            size={size}
            onClick={btn.action}
            sx={{ mx: 0 }}
          >
            <btn.icon size={size === 'small' ? 16 : 20} />
          </IconButton>
        </Tooltip>
      ))}

      {/* Delete Button */}
      {showDelete && (record || id) && (
        <DeleteRecordButton
          record={record || { id }}
          config={fullConfig}
          onDeleteSuccess={handleDeleteSuccess}
          iconOnly={true}
          size={size}
          tooltip={`Delete ${fullConfig?.singularLabel || 'item'}`}
        />
      )}
    </Box>
  );
};

/**
 * ✅ Helper function to capitalize first letter (for SOP naming)
 */
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get collection-specific action buttons (now includes export buttons)
 */
function getCollectionSpecificButtons(collectionName, item, showExport = true) {
  const buttons = [];

  const ElementorIcon = ({ size = 16 }) => (
    <Image
      src="/images/elementor.svg"
      alt="Elementor"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  );

  switch (collectionName) {
    case 'brand':
      // Export buttons for brand
      if (showExport && item?.id) {
        buttons.push({
          icon: ElementorIcon,
          label: 'Elementor Export',
          action: async () => {
            try {
              await generateElementorExportZip(item);
            } catch (err) {
              console.error('Elementor export failed:', err);
              alert('Elementor export failed');
            }
          }
        });

        buttons.push({
          icon: DownloadSimple,
          label: 'React Theme Export',
          action: () => {
            alert('React export coming soon...');
          }
        });

        buttons.push({
          icon: Printer,
          label: 'Printable Style Guide',
          action: () => {
            alert('Print export coming soon...');
          }
        });

        buttons.push({
          icon: PaintBrush,
          label: 'Webstudio Export',
          action: () => {
            alert('Webstudio export coming soon...');
          }
        });
      }
      break;

    case 'company':
      if (item.url) {
        buttons.push({
          icon: Globe,
          label: 'Website',
          action: () => window.open(item.url, '_blank')
        });
      }
      if (item.company_folder) {
        buttons.push({
          icon: Folder,
          label: 'Company Folder',
          action: () => window.open(item.company_folder, '_blank')
        });
      }
      break;
      
    case 'contact':
      if (item.email) {
        buttons.push({
          icon: Envelope,
          label: 'Email',
          action: () => window.open(`mailto:${item.email}`, '_blank')
        });
      }
      if (item.phone) {
        buttons.push({
          icon: Phone,
          label: 'Call',
          action: () => window.open(`tel:${item.phone}`, '_blank')
        });
      }
      break;

    case 'event':
      if (item.zoom_join_url) {
        buttons.push({
          icon: Link,
          label: 'Zoom Link',
          action: () => window.open(item.zoom_join_url, '_blank')
        });
      }
      break;
      
    case 'project':
      
      // Handle select field values (could be object or string)
      const platformValue = typeof item.platform === 'object' ? item.platform?.value : item.platform;
      
      if (item.project_folder) {
        buttons.push({
          icon: Folder,
          label: 'Project Folder',
          action: () => window.open(item.project_folder, '_blank')
        });
      }
      if (item.url) {
        buttons.push({
          icon: Globe,
          label: 'Visit Live',
          action: () => window.open(item.url, '_blank')
        });
      }
       if (platformValue === 'wordpress') {

        if (item.url) {

          buttons.push({
            icon: SignIn,
            label: 'Live Admin',
            action: () => window.open(`${item.url}/wp-admin`, '_blank')
          });
        }
      }
      if (item.staging_url) {
        buttons.push({
          icon: Blueprint,
          label: 'Visit Staging',
          action: () => window.open(item.staging_url, '_blank')
        });
      }


      if (platformValue === 'wordpress') {

        if (item.staging_url) {

          buttons.push({
            icon: Hash,
            label: 'Staging Admin',
            action: () => window.open(`${item.staging_url}/wp-admin`, '_blank')
          });
        }

      }
      
      const firstBrand = item.brands?.[0]?.brand;
      if (firstBrand?.id) {
        const brandConfig = collections.brand;
        buttons.push({
          icon: Palette,
          label: `Brand: ${firstBrand.title}`,
          action: () => window.open(`${brandConfig.editPathPrefix}/${firstBrand.id}`, '_blank')
        });
      }
      
      console.log('[ViewButtons] Total buttons for project:', buttons.length); // Debug log
      break;
      
    case 'media':
      if (item.url) {
        buttons.push({
          icon: LinkSimple,
          label: 'View File',
          action: () => window.open(item.url, '_blank')
        });
      }
      break;
  }

  return buttons;
}