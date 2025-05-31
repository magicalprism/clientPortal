// /lib/services/signature/PlatformHandlerFactory.js - Enhanced with better error handling and utilities
import { ESignaturesHandler } from './ESignaturesHandler.js';

export class PlatformHandlerFactory {
  
  // Create handler for the specified platform
  static createHandler(platform) {
    console.log('[PlatformHandlerFactory] Creating handler for platform:', platform);
    
    if (!platform || typeof platform !== 'string') {
      throw new Error('Platform must be a non-empty string');
    }
    
    const normalizedPlatform = platform.toLowerCase().trim();
    
    // Validate platform is implemented before trying to create handler
    if (!this.isPlatformImplemented(normalizedPlatform)) {
      const implemented = this.getImplementedPlatforms().join(', ');
      const planned = this.getPlannedPlatforms().join(', ');
      
      if (this.isPlatformPlanned(normalizedPlatform)) {
        throw new Error(`Platform "${platform}" is planned but not yet implemented. Currently implemented: ${implemented}. Planned: ${planned}`);
      } else {
        throw new Error(`Platform "${platform}" is not supported. Currently implemented: ${implemented}. Planned: ${planned}`);
      }
    }
    
    switch (normalizedPlatform) {
      case 'esignatures':
        console.log('[PlatformHandlerFactory] Returning ESignaturesHandler');
        return ESignaturesHandler;
      
      case 'docusign':
        // TODO: Import and return DocuSignHandler when implemented
        // import { DocuSignHandler } from './DocuSignHandler.js';
        // return DocuSignHandler;
        throw new Error('DocuSign integration not yet implemented. Please use "esignatures" platform.');
      
      case 'hellosign':
      case 'dropboxsign':
        // TODO: Import and return HelloSignHandler when implemented
        // import { HelloSignHandler } from './HelloSignHandler.js';
        // return HelloSignHandler;
        throw new Error('HelloSign/Dropbox Sign integration not yet implemented. Please use "esignatures" platform.');
      
      case 'adobesign':
        // TODO: Import and return AdobeSignHandler when implemented
        // import { AdobeSignHandler } from './AdobeSignHandler.js';
        // return AdobeSignHandler;
        throw new Error('Adobe Sign integration not yet implemented. Please use "esignatures" platform.');
      
      case 'pandadoc':
        // TODO: Import and return PandaDocHandler when implemented
        // import { PandaDocHandler } from './PandaDocHandler.js';
        // return PandaDocHandler;
        throw new Error('PandaDoc integration not yet implemented. Please use "esignatures" platform.');
      
      default:
        const supportedPlatforms = this.getImplementedPlatforms().join(', ');
        throw new Error(`Unsupported platform: "${platform}". Currently implemented platforms: ${supportedPlatforms}`);
    }
  }

  // Get list of all supported platforms (including planned)
  static getSupportedPlatforms() {
    return [
      'esignatures',
      // Future platforms (when implemented):
      // 'docusign',
      // 'hellosign',
      // 'dropboxsign', 
      // 'adobesign',
      // 'pandadoc'
    ];
  }

  // Get list of platforms that are implemented and ready to use
  static getImplementedPlatforms() {
    return [
      'esignatures'
    ];
  }

  // Get list of platforms planned for future implementation
  static getPlannedPlatforms() {
    return [
      'docusign',
      'hellosign',
      'dropboxsign',
      'adobesign',
      'pandadoc'
    ];
  }

  // Check if a platform is supported (implemented or planned)
  static isPlatformSupported(platform) {
    if (!platform || typeof platform !== 'string') return false;
    return this.getSupportedPlatforms().includes(platform.toLowerCase());
  }

  // Check if a platform is implemented and ready to use
  static isPlatformImplemented(platform) {
    if (!platform || typeof platform !== 'string') return false;
    return this.getImplementedPlatforms().includes(platform.toLowerCase());
  }

  // Check if a platform is planned for future implementation
  static isPlatformPlanned(platform) {
    if (!platform || typeof platform !== 'string') return false;
    return this.getPlannedPlatforms().includes(platform.toLowerCase());
  }

  // Get platform configuration requirements
  static getPlatformRequirements(platform) {
    if (!platform || typeof platform !== 'string') return null;
    
    switch (platform.toLowerCase()) {
      case 'esignatures':
        return {
          envVars: ['ESIGNATURES_API_KEY'],
          optional: ['ESIGNATURES_WEBHOOK_SECRET'],
          description: 'eSignatures.com integration',
          docs: 'https://esignatures.com/api-docs',
          website: 'https://esignatures.com'
        };
      
      case 'docusign':
        return {
          envVars: ['DOCUSIGN_CLIENT_ID', 'DOCUSIGN_CLIENT_SECRET', 'DOCUSIGN_ACCOUNT_ID'],
          optional: ['DOCUSIGN_WEBHOOK_SECRET'],
          description: 'DocuSign integration',
          docs: 'https://developers.docusign.com/',
          website: 'https://www.docusign.com'
        };
      
      case 'hellosign':
      case 'dropboxsign':
        return {
          envVars: ['HELLOSIGN_API_KEY'],
          optional: ['HELLOSIGN_WEBHOOK_SECRET'],
          description: 'HelloSign/Dropbox Sign integration',
          docs: 'https://developers.hellosign.com/',
          website: 'https://www.hellosign.com'
        };
      
      case 'adobesign':
        return {
          envVars: ['ADOBESIGN_CLIENT_ID', 'ADOBESIGN_CLIENT_SECRET', 'ADOBESIGN_ACCESS_TOKEN'],
          optional: ['ADOBESIGN_WEBHOOK_SECRET'],
          description: 'Adobe Sign integration',
          docs: 'https://developer.adobe.com/document-services/docs/overview/pdf-services-api/',
          website: 'https://www.adobe.com/sign.html'
        };
      
      case 'pandadoc':
        return {
          envVars: ['PANDADOC_API_KEY'],
          optional: ['PANDADOC_WEBHOOK_SECRET'],
          description: 'PandaDoc integration',
          docs: 'https://developers.pandadoc.com/',
          website: 'https://www.pandadoc.com'
        };
      
      default:
        return null;
    }
  }

  // Validate platform configuration
  static validatePlatformConfig(platform) {
    const requirements = this.getPlatformRequirements(platform);
    
    if (!requirements) {
      return {
        valid: false,
        error: `Unknown platform: ${platform}`,
        missing: [],
        available: this.getImplementedPlatforms()
      };
    }

    const missing = requirements.envVars.filter(envVar => !process.env[envVar]);
    const present = requirements.envVars.filter(envVar => !!process.env[envVar]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required environment variables for ${platform}`,
        missing: missing,
        present: present,
        required: requirements.envVars,
        optional: requirements.optional,
        docs: requirements.docs
      };
    }

    return {
      valid: true,
      platform: platform,
      configured: requirements.envVars,
      present: present,
      optional: requirements.optional,
      docs: requirements.docs
    };
  }

  // Get platform status (for admin/debugging) - ENHANCED
  static getPlatformStatus(platform = null) {
    if (platform) {
      const implemented = this.isPlatformImplemented(platform);
      const planned = this.isPlatformPlanned(platform);
      const config = this.validatePlatformConfig(platform);
      const requirements = this.getPlatformRequirements(platform);
      
      return {
        platform: platform,
        displayName: this.getPlatformDisplayName(platform),
        implemented: implemented,
        planned: planned,
        configured: config.valid,
        status: implemented ? (config.valid ? 'ready' : 'misconfigured') : (planned ? 'planned' : 'unsupported'),
        config: config,
        requirements: requirements
      };
    }

    // Return status for all platforms
    const allPlatforms = [...this.getImplementedPlatforms(), ...this.getPlannedPlatforms()];
    
    return allPlatforms.map(p => this.getPlatformStatus(p));
  }

  // Get recommended platform based on features needed
  static getRecommendedPlatform(features = []) {
    console.log('[PlatformHandlerFactory] Getting recommended platform for features:', features);
    
    // For now, we only have eSignatures implemented
    // In the future, this could analyze features and recommend the best platform
    
    const availablePlatforms = this.getImplementedPlatforms();
    
    if (availablePlatforms.length === 0) {
      throw new Error('No signature platforms are currently implemented');
    }
    
    // Return the first (and currently only) implemented platform
    const recommended = availablePlatforms[0];
    console.log('[PlatformHandlerFactory] Recommended platform:', recommended);
    return recommended;
  }

  // Helper to get platform display name
  static getPlatformDisplayName(platform) {
    if (!platform || typeof platform !== 'string') return 'Unknown Platform';
    
    const displayNames = {
      'esignatures': 'eSignatures.com',
      'docusign': 'DocuSign',
      'hellosign': 'HelloSign',
      'dropboxsign': 'Dropbox Sign',
      'adobesign': 'Adobe Sign',
      'pandadoc': 'PandaDoc'
    };
    
    return displayNames[platform.toLowerCase()] || platform;
  }

  // NEW: Get platform capabilities (for future use)
  static getPlatformCapabilities(platform) {
    if (!platform || typeof platform !== 'string') return null;
    
    switch (platform.toLowerCase()) {
      case 'esignatures':
        return {
          formFields: true,
          templates: true,
          webhooks: true,
          multipleSigners: true,
          inPersonSigning: false,
          bulkSending: false,
          apiAccess: true,
          mobileOptimized: true,
          documentTypes: ['PDF', 'DOC', 'DOCX'],
          maxFileSize: '50MB',
          signerAuthentication: ['email', 'sms'],
          auditTrail: true
        };
      
      // Future platform capabilities can be defined here
      default:
        return null;
    }
  }

  // NEW: Check if platform supports a specific feature
  static platformSupportsFeature(platform, feature) {
    const capabilities = this.getPlatformCapabilities(platform);
    return capabilities ? !!capabilities[feature] : false;
  }

  // NEW: Get all platforms that support a specific feature
  static getPlatformsByFeature(feature) {
    const implemented = this.getImplementedPlatforms();
    return implemented.filter(platform => this.platformSupportsFeature(platform, feature));
  }

  // NEW: Get comprehensive platform information
  static getPlatformInfo(platform) {
    const status = this.getPlatformStatus(platform);
    const capabilities = this.getPlatformCapabilities(platform);
    
    return {
      ...status,
      capabilities: capabilities
    };
  }

  // NEW: Validate handler method exists
  static validateHandlerMethod(platform, method) {
    try {
      const handler = this.createHandler(platform);
      return typeof handler[method] === 'function';
    } catch (error) {
      return false;
    }
  }

  // NEW: Get available handler methods
  static getHandlerMethods(platform) {
    try {
      const handler = this.createHandler(platform);
      return Object.getOwnPropertyNames(handler)
        .filter(name => typeof handler[name] === 'function')
        .filter(name => !name.startsWith('_')); // Exclude private methods
    } catch (error) {
      return [];
    }
  }

  // NEW: Debug helper - get complete platform information
  static debugPlatform(platform) {
    console.log(`[PlatformHandlerFactory] === PLATFORM DEBUG: ${platform} ===`);
    
    const info = this.getPlatformInfo(platform);
    console.log('Platform Info:', JSON.stringify(info, null, 2));
    
    const methods = this.getHandlerMethods(platform);
    console.log('Available Methods:', methods);
    
    console.log(`[PlatformHandlerFactory] === END DEBUG: ${platform} ===`);
    
    return { info, methods };
  }
}