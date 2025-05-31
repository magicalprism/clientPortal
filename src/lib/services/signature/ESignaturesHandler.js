// /lib/services/signature/ESignaturesHandler.js - Corrected for eSignatures.com API
import { DocumentElementsParser } from './DocumentElementsParser.js';

export class ESignaturesHandler {
  
  // Send contract to eSignatures platform
  static async sendContract({ title, contractId, signers, content, webhookUrl }) {
    try {
      console.log('[ESignaturesHandler] Starting eSignatures API call');
      console.log('[ESignaturesHandler] Contract ID:', contractId);
      console.log('[ESignaturesHandler] Title:', title);
      console.log('[ESignaturesHandler] Signers:', signers.length);
      console.log('[ESignaturesHandler] Content length:', content.length);
      console.log('[ESignaturesHandler] Content preview:', content.substring(0, 500));
      
      // Create document elements with form fields properly detected
      console.log('[ESignaturesHandler] Creating document elements...');
      const documentElements = DocumentElementsParser.parseContentWithFormFields(title, content);
      
      console.log('[ESignaturesHandler] Document elements created:', documentElements.length);

      // Check if we have any elements at all
      if (!documentElements || documentElements.length === 0) {
        console.error('[ESignaturesHandler] ERROR: No document elements generated!');
        console.error('[ESignaturesHandler] This usually means the content is empty or invalid');
        console.error('[ESignaturesHandler] Content that failed to parse:', content.substring(0, 1000));
        throw new Error('No document elements could be generated from the content. Please check the contract content.');
      }

      // Show detailed element breakdown before sending
      const elementTypes = {};
      documentElements.forEach(el => {
        elementTypes[el.type] = (elementTypes[el.type] || 0) + 1;
      });
      console.log('[ESignaturesHandler] Element types being sent:', elementTypes);

      // Show sample of elements that will be sent to API
      console.log('[ESignaturesHandler] Sample elements being sent to API (first 3):');
      documentElements.slice(0, 3).forEach((el, idx) => {
        console.log(`[ESignaturesHandler]   ${idx + 1}. Type: "${el.type}"`);
        console.log(`[ESignaturesHandler]      Text: "${el.text?.substring(0, 100) || 'N/A'}"`);
        console.log(`[ESignaturesHandler]      Full: ${JSON.stringify(el, null, 2)}`);
      });

      // Validate that all elements have the minimum required fields
      const validationResult = this.validateDocumentElements(documentElements);
      if (!validationResult.valid) {
        console.error('[ESignaturesHandler] Element validation failed:', validationResult.errors);
        throw new Error(`Invalid document elements: ${validationResult.errors.join(', ')}`);
      }

      // Create temporary template
      const templatePayload = {
        title: title,
        labels: ["Temporary"],
        document_elements: documentElements
      };

      console.log('[ESignaturesHandler] Creating template with payload:');
      console.log('[ESignaturesHandler] - Title:', templatePayload.title);
      console.log('[ESignaturesHandler] - Elements count:', templatePayload.document_elements.length);
      console.log('[ESignaturesHandler] - First element:', JSON.stringify(templatePayload.document_elements[0], null, 2));

      const templateUrl = `https://esignatures.com/api/templates?token=${process.env.ESIGNATURES_API_KEY}`;

      console.log('[ESignaturesHandler] Making template API call to:', templateUrl);
      
      const templateResponse = await fetch(templateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.ESIGNATURES_API_KEY}`
        },
        body: JSON.stringify(templatePayload)
      });

      const responseText = await templateResponse.text();
      console.log('[ESignaturesHandler] Template response status:', templateResponse.status);
      console.log('[ESignaturesHandler] Template response body:', responseText);

      if (!templateResponse.ok) {
        console.error('[ESignaturesHandler] Template creation failed');
        console.error('[ESignaturesHandler] Status:', templateResponse.status);
        console.error('[ESignaturesHandler] Response:', responseText);
        
        // Try to parse the error response for better error messages
        let errorMessage = responseText;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.data && errorData.data.error_message) {
            errorMessage = errorData.data.error_message;
            
            // Provide specific guidance for common errors
            if (errorData.data.error_code === 'invalid-document-elements') {
              errorMessage += '\n\nThis usually means one of your document elements has an invalid type or missing required fields. Check the console logs above for element details.';
            }
          }
        } catch (e) {
          // Keep original response if not JSON
        }
        
        throw new Error(`Template creation failed (${templateResponse.status}): ${errorMessage}`);
      }

      let templateData;
      try {
        templateData = JSON.parse(responseText);
      } catch (e) {
        console.error('[ESignaturesHandler] Failed to parse template response JSON:', e);
        throw new Error('Invalid JSON response from template creation API');
      }

      console.log('[ESignaturesHandler] Template creation response data:', templateData);
      
      const templateItem = Array.isArray(templateData.data) ? templateData.data[0] : templateData.data;
      const tempTemplateId = templateItem?.template_id || templateItem?.id;
      
      if (!tempTemplateId) {
        console.error('[ESignaturesHandler] No template ID found in response:', templateData);
        throw new Error('Template created but no template ID returned');
      }
      
      console.log('[ESignaturesHandler] Template created successfully:', tempTemplateId);

      try {
        // Create contract using temporary template
        const contractPayload = {
          template_id: tempTemplateId,
          signers: signers.map((signer, index) => ({
            name: signer.name,
            email: signer.email,
            signing_order: (index + 1).toString() // FIXED: eSignatures uses signing_order, not order
          })),
          webhook_url: webhookUrl,
          metadata: {
            contractId: contractId,
            source: 'dynamic_template'
          }
        };

        console.log('[ESignaturesHandler] Creating contract with payload:', JSON.stringify(contractPayload, null, 2));

        const contractUrl = `https://esignatures.com/api/contracts?token=${process.env.ESIGNATURES_API_KEY}`;

        const contractResponse = await fetch(contractUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.ESIGNATURES_API_KEY}`
          },
          body: JSON.stringify(contractPayload)
        });

        const contractResponseText = await contractResponse.text();
        console.log('[ESignaturesHandler] Contract response status:', contractResponse.status);
        console.log('[ESignaturesHandler] Contract response:', contractResponseText);

        if (!contractResponse.ok) {
          console.error('[ESignaturesHandler] Contract creation failed:', contractResponseText);
          throw new Error(`Contract creation failed (${contractResponse.status}): ${contractResponseText}`);
        }
        
        let contractData;
        try {
          contractData = JSON.parse(contractResponseText);
        } catch (e) {
          console.error('[ESignaturesHandler] Failed to parse contract response JSON:', e);
          throw new Error('Invalid JSON response from contract creation API');
        }

        console.log('[ESignaturesHandler] Contract created successfully:', contractData);

        // Extract the contract data - FIXED based on actual API response structure
        const contract = contractData.data?.contract || contractData.contract || contractData;
        const firstSigner = contract.signers?.[0];

        // Delete temporary template
        await this.deleteTemplate(tempTemplateId);
        
        return {
          success: true,
          documentId: contract.id, // FIXED: use contract.id not contract_id
          signUrl: firstSigner?.sign_page_url, // FIXED: use sign_page_url not signing_url
          metadata: { 
            platformData: contractData,
            contract: contract,
            signers: contract.signers
          }
        };

      } catch (contractError) {
        console.error('[ESignaturesHandler] Contract creation error, cleaning up template...');
        await this.deleteTemplate(tempTemplateId);
        throw contractError;
      }

    } catch (error) {
      console.error('[ESignaturesHandler] Overall error:', error);
      console.error('[ESignaturesHandler] Error stack:', error.stack);
      return { success: false, error: error.message };
    }
  }

  // Validate document elements according to eSignatures.com API requirements - CORRECTED
  static validateDocumentElements(elements) {
    console.log('[ESignaturesHandler] === VALIDATING DOCUMENT ELEMENTS ===');
    console.log('[ESignaturesHandler] Input elements count:', elements?.length || 0);
    
    if (!elements || !Array.isArray(elements)) {
      return {
        valid: false,
        errors: ['Elements is not an array']
      };
    }

    // CORRECTED: Valid types according to eSignatures.com API documentation
    const validTypes = DocumentElementsParser.getValidElementTypes();
    const errors = [];

    elements.forEach((element, index) => {
      // Basic structure validation
      if (!element || typeof element !== 'object') {
        errors.push(`Element ${index}: Not an object (${typeof element})`);
        return;
      }

      if (!element.type) {
        errors.push(`Element ${index}: Missing 'type' field. Element: ${JSON.stringify(element)}`);
        return;
      }

      if (typeof element.type !== 'string') {
        errors.push(`Element ${index}: 'type' must be a string, got ${typeof element.type}`);
        return;
      }

      // Type validation
      if (!validTypes.includes(element.type)) {
        errors.push(`Element ${index}: Invalid type '${element.type}'. Valid types: ${validTypes.join(', ')}`);
        return;
      }

      // Type-specific validation
      this.validateElementByType(element, index, errors);
    });

    console.log(`[ESignaturesHandler] Validation result: ${errors.length === 0 ? 'VALID' : 'INVALID'}`);
    if (errors.length > 0) {
      console.log('[ESignaturesHandler] Validation errors (first 10):');
      errors.slice(0, 10).forEach(error => {
        console.log(`[ESignaturesHandler]   - ${error}`);
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Validate individual element by type - ENHANCED
  static validateElementByType(element, index, errors) {
    switch (element.type) {
      case 'text_normal':
      case 'text_header_one':
      case 'text_header_two':
      case 'text_header_three':
      case 'unordered_list_item':
      case 'ordered_list_item':
        if (!element.text) {
          errors.push(`Element ${index} (${element.type}): Missing 'text' field`);
        } else if (typeof element.text !== 'string') {
          errors.push(`Element ${index} (${element.type}): 'text' must be string, got ${typeof element.text}`);
        } else if (element.text.trim().length === 0) {
          errors.push(`Element ${index} (${element.type}): 'text' field is empty`);
        }
        break;
        
      case 'signer_field_text':
      case 'signer_field_text_area':
      case 'signer_field_date':
      case 'signer_field_dropdown':
      case 'signer_field_checkbox':
      case 'signer_field_radiobutton':
      case 'signer_field_file_upload':
        // Required fields according to eSignatures.com API
        if (!element.signer_field_assigned_to) {
          errors.push(`Element ${index} (${element.type}): Missing required 'signer_field_assigned_to' field`);
        }
        if (!element.signer_field_id) {
          errors.push(`Element ${index} (${element.type}): Missing required 'signer_field_id' field`);
        }
        // Validate signer_field_assigned_to values
        const validAssignments = ['first_signer', 'second_signer', 'last_signer', 'every_signer'];
        if (element.signer_field_assigned_to && !validAssignments.includes(element.signer_field_assigned_to)) {
          errors.push(`Element ${index} (${element.type}): Invalid 'signer_field_assigned_to' value '${element.signer_field_assigned_to}'. Valid values: ${validAssignments.join(', ')}`);
        }
        // Validate signer_field_required if present
        if (element.signer_field_required && !['yes', 'no'].includes(element.signer_field_required)) {
          errors.push(`Element ${index} (${element.type}): 'signer_field_required' must be 'yes' or 'no', got '${element.signer_field_required}'`);
        }
        break;
        
      case 'table':
        if (!element.table_cells) {
          errors.push(`Element ${index} (table): Missing 'table_cells' field`);
        } else if (!Array.isArray(element.table_cells)) {
          errors.push(`Element ${index} (table): 'table_cells' must be an array`);
        } else if (element.table_cells.length === 0) {
          errors.push(`Element ${index} (table): 'table_cells' cannot be empty`);
        }
        break;
        
      case 'image':
        if (!element.image_base64) {
          errors.push(`Element ${index} (image): Missing required 'image_base64' field`);
        }
        break;
        
      case 'template':
        if (!element.template_id) {
          errors.push(`Element ${index} (template): Missing required 'template_id' field`);
        }
        break;
    }
  }

  // Delete temporary template - FIXED
  static async deleteTemplate(templateId) {
    try {
      console.log('[ESignaturesHandler] Deleting temporary template:', templateId);
      // FIXED: Use POST method with /delete endpoint as per eSignatures API
      const deleteUrl = `https://esignatures.com/api/templates/${templateId}/delete?token=${process.env.ESIGNATURES_API_KEY}`;
      const response = await fetch(deleteUrl, { 
        method: 'POST', // FIXED: eSignatures uses POST for deletion
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('[ESignaturesHandler] Template deletion response:', response.status);
    } catch (error) {
      console.error('[ESignaturesHandler] Delete template error:', error);
    }
  }

  // Check contract status - FIXED
  static async checkStatus(documentId) {
    try {
      const response = await fetch(`https://esignatures.com/api/contracts/${documentId}?token=${process.env.ESIGNATURES_API_KEY}`);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const contract = data.data?.contract || data.contract || data;
      
      // FIXED: Map eSignatures.com status to our standard status
      const statusMap = {
        'sent': 'sent',
        'signed': 'signed',
        'withdrawn': 'declined',
        'expired': 'expired'
      };
      
      return statusMap[contract.status] || contract.status;
    } catch (error) {
      console.error('[ESignaturesHandler] Status check error:', error);
      return null;
    }
  }

  // Validate API configuration
  static async validateConfiguration() {
    console.log('[ESignaturesHandler] Validating API configuration...');
    
    if (!process.env.ESIGNATURES_API_KEY) {
      return {
        valid: false,
        error: 'ESIGNATURES_API_KEY environment variable is not set'
      };
    }

    try {
      const response = await fetch(`https://esignatures.com/api/templates?token=${process.env.ESIGNATURES_API_KEY}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        return {
          valid: true,
          message: 'API key is valid and working'
        };
      } else {
        const responseText = await response.text();
        return {
          valid: false,
          error: `API key validation failed with status ${response.status}: ${responseText}`
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `API validation failed: ${error.message}`
      };
    }
  }

  // Test with minimal document elements
  static async testWithMinimalElements() {
    console.log('[ESignaturesHandler] Testing with minimal document elements...');
    
    const testElements = [
      {
        "type": "text_header_one",
        "text": "Test Contract"
      },
      {
        "type": "text_normal",
        "text": "This is a test document to verify the API integration."
      }
    ];

    const templatePayload = {
      title: "API Test Template",
      labels: ["Test"],
      document_elements: testElements
    };

    try {
      const response = await fetch(`https://esignatures.com/api/templates?token=${process.env.ESIGNATURES_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(templatePayload)
      });

      const responseText = await response.text();
      
      if (response.ok) {
        const data = JSON.parse(responseText);
        const templateItem = Array.isArray(data.data) ? data.data[0] : data.data;
        const templateId = templateItem?.template_id || templateItem?.id;
        
        // Clean up test template
        if (templateId) {
          await this.deleteTemplate(templateId);
        }
        
        return {
          success: true,
          message: 'API test successful - minimal elements work correctly'
        };
      } else {
        return {
          success: false,
          error: `API test failed (${response.status}): ${responseText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `API test error: ${error.message}`
      };
    }
  }
}