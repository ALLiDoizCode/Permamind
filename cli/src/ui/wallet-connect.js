/**
 * Permamind Browser Wallet Connector
 *
 * SSE protocol implementation for Arweave wallet connection
 * Based on node-arweave-wallet signer.js with Permamind branding
 * NO THEME TOGGLE - Dark theme only
 */

// ==================== Constants & Configuration ====================

const States = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  SIGNING: 'signing',
  ERROR: 'error',
  COMPLETE: 'complete',
};

const OPERATION_ICONS = {
  connect: '🔗',
  sign: '✍️',
  dispatch: '🚀',
  signDataItem: '📝',
  encrypt: '🔒',
  decrypt: '🔓',
  signature: '✒️',
  signMessage: '💬',
  verifyMessage: '✓',
  batchSignDataItem: '📚',
  privateHash: '🔐',
  addToken: '🪙',
  address: '📍',
  getAllAddresses: '📋',
  getWalletNames: '👤',
  getPermissions: '🔑',
  getArweaveConfig: '⚙️',
  getActivePublicKey: '🔐',
  disconnect: '🔌',
  getWanderTierInfo: '🔍',
  tokenBalance: '🪙',
  userTokens: '👤',
};

const OPERATION_LABELS = {
  connect: 'Connecting wallet',
  sign: 'Signing transaction',
  dispatch: 'Dispatching transaction',
  signDataItem: 'Signing data item',
  encrypt: 'Encrypting data',
  decrypt: 'Decrypting data',
  signature: 'Creating signature',
  signMessage: 'Signing message',
  verifyMessage: 'Verifying message',
  batchSignDataItem: 'Batch signing items',
  privateHash: 'Creating private hash',
  addToken: 'Adding token',
  isTokenAdded: 'Checking token',
  address: 'Getting address',
  getAllAddresses: 'Getting addresses',
  getWalletNames: 'Getting wallet names',
  getPermissions: 'Getting permissions',
  getArweaveConfig: 'Getting config',
  getActivePublicKey: 'Getting public key',
  disconnect: 'Disconnecting',
  getWanderTierInfo: 'Getting Wander tier info',
  tokenBalance: 'Getting token balance',
  userTokens: 'Getting user tokens',
};

const MAX_LOG_ENTRIES = 50;
const QUEUE_CLEANUP_DELAY = 2000;
const ERROR_RESET_DELAY = 3000;
const POLL_ERROR_DELAY = 1000;
const AUTO_CLOSE_DELAY = 5000;

// ==================== State Variables ====================

let currentState = States.DISCONNECTED;
let walletAddress = null;
let eventSource = null;
const requestQueue = new Map();
let isWalletDetected = false;
let isWalletDetectionLogged = false;

// Initialize Arweave SDK
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

// DOM element cache
const dom = {
  status: null,
  walletInfo: null,
  address: null,
  queueContainer: null,
  queueList: null,
  log: null,
};

// ==================== DOM Manipulation Functions ====================

/**
 * Cache DOM element references for performance
 */
function cacheDOMElements() {
  dom.status = document.getElementById('status');
  dom.walletInfo = document.getElementById('walletInfo');
  dom.address = document.getElementById('address');
  dom.queueContainer = document.getElementById('queueContainer');
  dom.queueList = document.getElementById('queueList');
  dom.log = document.getElementById('log');
}

/**
 * Update current state and UI
 */
function setState(state, message = '') {
  currentState = state;

  if (!dom.status) return;

  const stateConfig = {
    [States.DISCONNECTED]: {
      className: 'error',
      title: 'Not Connected',
      description: message || 'Click "Connect Wallet" to continue',
      showSpinner: false,
    },
    [States.CONNECTING]: {
      className: 'connecting',
      title: 'Connecting...',
      description: message || 'Waiting for wallet connection',
      showSpinner: true,
    },
    [States.CONNECTED]: {
      className: 'connected',
      title: 'Connected',
      description: message || 'Wallet connected - Ready for signing',
      showSpinner: false,
    },
    [States.SIGNING]: {
      className: 'signing',
      title: 'Processing...',
      description: message || 'Signing transaction',
      showSpinner: true,
    },
    [States.ERROR]: {
      className: 'error',
      title: 'Error',
      description: message || 'An error occurred',
      showSpinner: false,
    },
    [States.COMPLETE]: {
      className: 'connected',
      title: 'Complete',
      description: message || 'All done! You can safely close this window.',
      showSpinner: false,
    },
  };

  const config = stateConfig[state] || stateConfig[States.DISCONNECTED];

  // Update status display classes
  dom.status.className = `status-display ${config.className}`;

  // Update status content
  const statusIcon = dom.status.querySelector('.status-icon');
  const statusTitle = dom.status.querySelector('.status-title');
  const statusDescription = dom.status.querySelector('.status-description');

  if (statusIcon) {
    statusIcon.innerHTML = config.showSpinner ? '<div class="spinner"></div>' : '';
  }
  if (statusTitle) {
    statusTitle.textContent = config.title;
  }
  if (statusDescription) {
    statusDescription.textContent = config.description;
  }
}

// ==================== Queue Management ====================

/**
 * Add request to queue
 */
function addToQueue(id, type, status = 'pending') {
  requestQueue.set(id, {
    type,
    status,
    timestamp: Date.now(),
  });
  updateQueueUI();
}

/**
 * Update request status in queue
 */
function updateQueueStatus(id, status) {
  const request = requestQueue.get(id);
  if (request) {
    request.status = status;
    updateQueueUI();
  }
}

/**
 * Remove request from queue
 */
function removeFromQueue(id) {
  requestQueue.delete(id);
  updateQueueUI();
}

/**
 * Update queue UI display
 */
function updateQueueUI() {
  if (!dom.queueContainer || !dom.queueList) return;

  // Update queue count badge
  const queueCount = document.getElementById('queueCount');
  if (queueCount) {
    queueCount.textContent = requestQueue.size;
  }

  if (requestQueue.size === 0) {
    // Show empty state
    dom.queueList.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <p class="empty-text">No pending requests</p>
      </div>
    `;
    return;
  }

  // Sort queue by status priority (processing > pending > completed)
  const statusPriority = { processing: 0, pending: 1, completed: 2 };
  const sortedQueue = Array.from(requestQueue.entries()).sort(
    (a, b) =>
      (statusPriority[a[1].status] || 3) - (statusPriority[b[1].status] || 3)
  );

  // Render queue items
  dom.queueList.innerHTML = sortedQueue
    .map(
      ([id, request]) => `
    <div class="queue-item" data-id="${id}">
      <span class="queue-icon">${OPERATION_ICONS[request.type] || '📦'}</span>
      <span class="queue-text">${OPERATION_LABELS[request.type] || request.type}</span>
      <span class="queue-status ${request.status}">${request.status}</span>
    </div>
  `
    )
    .join('');
}

// ==================== Logging Functions ====================

/**
 * Add log entry to activity log
 */
function log(message, type = 'info') {
  if (!dom.log) return;

  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `
    <span class="log-timestamp">[${timestamp}]</span>
    <span class="log-message">${message}</span>
  `;

  dom.log.appendChild(entry);
  dom.log.scrollTop = dom.log.scrollHeight;

  // Show clear button if log has entries
  const clearButton = document.getElementById('clearLog');
  if (clearButton && dom.log.children.length > 1) {
    clearButton.style.display = 'inline-flex';
  }

  // Limit log entries
  while (dom.log.children.length > MAX_LOG_ENTRIES) {
    dom.log.removeChild(dom.log.firstChild);
  }
}

/**
 * Clear activity log
 */
function clearLog() {
  if (!dom.log) return;
  dom.log.innerHTML = '<div class="log-entry info"><span class="log-timestamp">[00:00:00]</span><span class="log-message">Waiting for wallet connection...</span></div>';
  const clearButton = document.getElementById('clearLog');
  if (clearButton) {
    clearButton.style.display = 'none';
  }
}

// ==================== Utility Functions ====================

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ==================== Server Communication ====================

/**
 * Send response back to server
 */
async function sendResponse(id, result, error = null) {
  await fetch('/response', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
      result: result || null,
      error: error || null,
    }),
  });
}

/**
 * Send wallet info to server
 */
async function sendWalletInfo(name, version) {
  try {
    await fetch('/wallet-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        version,
      }),
    });
  } catch (error) {
    console.error('Failed to send wallet info:', error);
  }
}

// ==================== Wallet Operation Handlers ====================

/**
 * Check if wallet API method is supported
 */
async function checkAPISupport(method, requestId) {
  if (!window.arweaveWallet || !window.arweaveWallet[method]) {
    const error = `${method} API not supported by this wallet`;
    await sendResponse(requestId, null, error);
    log(error, 'error');
    return false;
  }
  return true;
}

/**
 * Request handlers for each wallet operation type
 */
const requestHandlers = {
  // Connect wallet
  async connect(params, requestId) {
    setState(
      States.SIGNING,
      '✍️ Please approve the connection in your wallet...'
    );
    log('Connection request...');

    try {
      await window.arweaveWallet.connect(
        params.permissions,
        params.appInfo,
        params.gateway
      );

      walletAddress = await window.arweaveWallet.getActiveAddress();
      dom.walletInfo.style.display = 'block';
      dom.address.textContent = walletAddress;

      await sendResponse(requestId, null);
      setState(States.CONNECTED, '✅ Wallet connected - Ready for signing');
      log(`Wallet connected: ${walletAddress}`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      walletAddress = null;
      setState(States.DISCONNECTED, 'Connection cancelled or failed');
      log(`Connection failed: ${errorMessage}`, 'error');
      dom.walletInfo.style.display = 'none';
      throw error;
    }
  },

  // Get active address
  async getActiveAddress(params, requestId) {
    log('Providing wallet address...');
    const address = await window.arweaveWallet.getActiveAddress();
    await sendResponse(requestId, address);
    log('Address sent successfully', 'success');
  },

  // Disconnect wallet
  async disconnect(params, requestId) {
    log('Disconnecting wallet...');
    await window.arweaveWallet.disconnect();
    await sendResponse(requestId, null);
    log('Wallet disconnected', 'success');
  },

  // Get all addresses
  async getAllAddresses(params, requestId) {
    log('Getting all addresses...');
    const addresses = await window.arweaveWallet.getAllAddresses();
    await sendResponse(requestId, addresses);
    log('All addresses retrieved', 'success');
  },

  // Get wallet names
  async getWalletNames(params, requestId) {
    log('Getting wallet names...');
    const names = await window.arweaveWallet.getWalletNames();
    await sendResponse(requestId, names);
    log('Wallet names retrieved', 'success');
  },

  // Get permissions
  async getPermissions(params, requestId) {
    log('Getting permissions...');
    const permissions = await window.arweaveWallet.getPermissions();
    await sendResponse(requestId, permissions);
    log('Permissions retrieved', 'success');
  },

  // Get Arweave config
  async getArweaveConfig(params, requestId) {
    log('Getting Arweave config...');
    const config = await window.arweaveWallet.getArweaveConfig();
    await sendResponse(requestId, config);
    log('Config retrieved', 'success');
  },

  // Get active public key
  async getActivePublicKey(params, requestId) {
    log('Getting public key...');
    const publicKey = await window.arweaveWallet.getActivePublicKey();
    await sendResponse(requestId, publicKey);
    log('Public key retrieved', 'success');
  },

  // Sign data (signature)
  async signature(params, requestId) {
    setState(States.SIGNING, '✍️ Please sign the data in your wallet...');
    log('Signature request, please check your wallet...');

    const data = base64ToUint8Array(params.data);
    const signature = await window.arweaveWallet.signature(
      data,
      params.algorithm
    );
    const signatureB64 = uint8ArrayToBase64(new Uint8Array(signature));

    await sendResponse(requestId, signatureB64);
    setState(States.CONNECTED, '✅ Wallet connected - Ready for signing');
    log('Signature created successfully!', 'success');
  },

  // Sign transaction
  async sign(params, requestId) {
    setState(
      States.SIGNING,
      '✍️ Please sign the transaction in your wallet...'
    );
    log('Transaction signing request, please check your wallet...');

    // Convert transaction data from base64url
    params.transaction.data = arweave.utils.b64UrlToBuffer(
      params.transaction.data
    );

    const transaction = await arweave.createTransaction(params.transaction);
    const signedTx = await window.arweaveWallet.sign(
      transaction,
      params.options
    );

    await sendResponse(requestId, signedTx.toJSON());
    setState(States.CONNECTED, '✅ Wallet connected - Ready for signing');
    log('Transaction signed successfully!', 'success');
  },

  // Dispatch transaction
  async dispatch(params, requestId) {
    setState(
      States.SIGNING,
      '✍️ Please approve the transaction in your wallet...'
    );
    log('Transaction dispatch request, please check your wallet...');

    // Convert transaction data from base64url
    params.transaction.data = arweave.utils.b64UrlToBuffer(
      params.transaction.data
    );

    const transaction = await arweave.createTransaction(params.transaction);
    const result = await window.arweaveWallet.dispatch(
      transaction,
      params.options
    );

    await sendResponse(requestId, result);
    setState(States.CONNECTED, '✅ Wallet connected - Ready for signing');
    log('Transaction dispatched successfully!', 'success');
  },

  // Encrypt data
  async encrypt(params, requestId) {
    setState(States.SIGNING, '🔒 Encrypting data...');
    log('Encryption request...');

    let data = params.data;
    try {
      data = base64ToUint8Array(params.data);
    } catch (e) {
      // Data might already be in correct format
    }

    const encrypted = await window.arweaveWallet.encrypt(data, params.options);
    const encryptedB64 = uint8ArrayToBase64(new Uint8Array(encrypted));

    await sendResponse(requestId, encryptedB64);
    setState(States.CONNECTED, '✅ Wallet connected - Ready for signing');
    log('Data encrypted successfully!', 'success');
  },

  // Decrypt data
  async decrypt(params, requestId) {
    setState(States.SIGNING, '🔓 Decrypting data...');
    log('Decryption request...');

    const data = base64ToUint8Array(params.data);
    const decrypted = await window.arweaveWallet.decrypt(data, params.options);
    const decryptedB64 = uint8ArrayToBase64(new Uint8Array(decrypted));

    await sendResponse(requestId, decryptedB64);
    setState(States.CONNECTED, '✅ Wallet connected - Ready for signing');
    log('Data decrypted successfully!', 'success');
  },

  // Sign data item
  async signDataItem(params, requestId) {
    setState(
      States.SIGNING,
      '✍️ Please sign the data item in your wallet...'
    );
    log('Data item signing request, please check your wallet...');

    let data = params.data;
    if (typeof data === 'string') {
      try {
        data = base64ToUint8Array(data);
      } catch (e) {
        // Data might already be in correct format
      }
    }

    const dataItem = {
      data,
      tags: params.tags || [],
      target: params.target,
      anchor: params.anchor,
    };

    const signedDataItem = await window.arweaveWallet.signDataItem(
      dataItem,
      params.options
    );
    const signedDataItemB64 = uint8ArrayToBase64(
      new Uint8Array(signedDataItem)
    );

    await sendResponse(requestId, { signedDataItem: signedDataItemB64 });
    setState(States.CONNECTED, '✅ Wallet connected - Ready for signing');
    log('Data item signed successfully!', 'success');
  },

  // Private hash
  async privateHash(params, requestId) {
    setState(States.SIGNING, '🔐 Creating private hash...');
    log('Private hash request...');

    const data = base64ToUint8Array(params.data);
    const hash = await window.arweaveWallet.privateHash(data, params.options);
    const hashB64 = uint8ArrayToBase64(new Uint8Array(hash));

    await sendResponse(requestId, hashB64);
    setState(States.CONNECTED, '✅ Wallet connected - Ready for signing');
    log('Private hash created successfully!', 'success');
  },

  // Add token
  async addToken(params, requestId) {
    log('Adding token to wallet...');
    await window.arweaveWallet.addToken(params.id, params.type, params.gateway);
    await sendResponse(requestId, null);
    log('Token added successfully!', 'success');
  },

  // Check if token is added
  async isTokenAdded(params, requestId) {
    log('Checking if token is added...');
    const isAdded = await window.arweaveWallet.isTokenAdded(params.id);
    await sendResponse(requestId, isAdded);
    log(`Token ${isAdded ? 'is' : 'is not'} added`, 'success');
  },

  // Sign message
  async signMessage(params, requestId) {
    setState(States.SIGNING, '✍️ Please sign the message in your wallet...');
    log('Message signing request, please check your wallet...');

    const data = base64ToUint8Array(params.data);
    const signature = await window.arweaveWallet.signMessage(
      data,
      params.options
    );
    const signatureB64 = uint8ArrayToBase64(new Uint8Array(signature));

    await sendResponse(requestId, signatureB64);
    setState(States.CONNECTED, '✅ Wallet connected - Ready for signing');
    log('Message signed successfully!', 'success');
  },

  // Verify message
  async verifyMessage(params, requestId) {
    log('Verifying message signature...');

    const data = base64ToUint8Array(params.data);
    const signature = base64ToUint8Array(params.signature);
    const isValid = await window.arweaveWallet.verifyMessage(
      data,
      signature,
      params.publicKey,
      params.options
    );

    await sendResponse(requestId, isValid);
    log('Message verification: ' + (isValid ? 'valid' : 'invalid'), 'success');
  },

  // Batch sign data items
  async batchSignDataItem(params, requestId) {
    setState(
      States.SIGNING,
      '✍️ Please sign multiple data items in your wallet...'
    );
    log(`Batch signing request for ${params.dataItems.length} items...`);

    const dataItems = params.dataItems.map((item) => {
      let data = item.data;
      if (typeof data === 'string') {
        try {
          data = base64ToUint8Array(data);
        } catch (e) {
          // Data might already be in correct format
        }
      }

      return {
        data,
        tags: item.tags || [],
        target: item.target,
        anchor: item.anchor,
      };
    });

    const signedDataItems = await window.arweaveWallet.batchSignDataItem(
      dataItems,
      params.options
    );

    const result = signedDataItems.map((signedItem) => ({
      signedDataItem: uint8ArrayToBase64(new Uint8Array(signedItem)),
    }));

    await sendResponse(requestId, result);
    setState(States.CONNECTED, '✅ Wallet connected - Ready for signing');
    log(`Batch signed ${result.length} items successfully!`, 'success');
  },

  // Get token balance
  async tokenBalance(params, requestId) {
    log('Getting token balance...');
    const balance = await window.arweaveWallet.tokenBalance(params.id);
    await sendResponse(requestId, balance);
    log('Token balance retrieved', 'success');
  },

  // Get user tokens
  async userTokens(params, requestId) {
    log('Getting user tokens...');
    const tokens = await window.arweaveWallet.userTokens(params.options);
    await sendResponse(requestId, tokens);
    log('User tokens retrieved', 'success');
  },

  // Get Wander tier info
  async getWanderTierInfo(params, requestId) {
    log('Getting Wander tier info...');
    const tierInfo = await window.arweaveWallet.getWanderTierInfo();
    await sendResponse(requestId, tierInfo);
    log('Wander tier info retrieved', 'success');
  },
};

// ==================== Request Handling ====================

/**
 * Handle incoming wallet operation request
 */
async function handleRequest(request) {
  try {
    addToQueue(request.id, request.type, 'processing');

    const params = request.data?.params || {};
    const handler = requestHandlers[request.type];

    if (handler && (await checkAPISupport(request.type, request.id))) {
      await handler(params, request.id);
    } else {
      log(`Unknown request type: ${request.type}`, 'error');
      await sendResponse(
        request.id,
        null,
        `Unknown request type: ${request.type}`
      );
    }

    updateQueueStatus(request.id, 'completed');
    setTimeout(() => removeFromQueue(request.id), QUEUE_CLEANUP_DELAY);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    setState(States.ERROR, `Operation failed: ${errorMessage}`);
    log(`Error: ${errorMessage}`, 'error');
    await sendResponse(request.id, null, errorMessage);
    removeFromQueue(request.id);

    // Reset state after error
    setTimeout(() => {
      if (currentState === States.ERROR) {
        if (walletAddress) {
          setState(States.CONNECTED, '✅ Wallet connected - Ready for signing');
        } else {
          setState(
            States.DISCONNECTED,
            '⚠️ Not connected - Click "Connect Wallet" to continue'
          );
        }
      }
    }, ERROR_RESET_DELAY);
  }
}

// ==================== SSE Event Stream ====================

/**
 * Auto-close window after completion
 */
function autoCloseWindow(status) {
  let countdown = Math.floor(AUTO_CLOSE_DELAY / 1000);

  const tick = () => {
    if (countdown > 0) {
      const message =
        status === 'success'
          ? `✅ All done! Closing window in ${countdown} second${countdown !== 1 ? 's' : ''}...`
          : `Operation failed. Closing window in ${countdown} second${countdown !== 1 ? 's' : ''}...`;

      setState(status === 'success' ? States.COMPLETE : States.ERROR, message);
      countdown--;
      setTimeout(tick, 1000);
    } else {
      log(
        'Closing window...',
        status === 'success' ? 'success' : 'error'
      );
      window.close();

      // Fallback message if window.close() doesn't work
      setTimeout(() => {
        const message =
          status === 'success'
            ? '✅ All done! You can close this window manually.'
            : 'Operation failed. You can close this window manually.';

        setState(
          status === 'success' ? States.COMPLETE : States.ERROR,
          message
        );
      }, 500);
    }
  };

  tick();
}

/**
 * Start EventSource connection for server-sent events
 */
function startEventStream() {
  if (eventSource) return;

  eventSource = new EventSource('/events');

  eventSource.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);

      // Handle completion events
      if (data.type === 'completed') {
        if (data.status === 'success') {
          log('✅ All operations completed successfully!', 'success');
          setState(
            States.COMPLETE,
            '✅ All done! You can safely close this window.'
          );
          autoCloseWindow('success');
        } else {
          log('❌ Operation failed or cancelled', 'error');
          setState(
            States.ERROR,
            '❌ Operation failed. Check your terminal for details.'
          );
          autoCloseWindow('failed');
        }
        eventSource.close();
        return;
      }

      // Handle request events
      if (data.id && data.type) {
        await handleRequest(data);
      }
    } catch (error) {
      console.error('EventSource message error:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('EventSource error:', error);

    // Attempt to reconnect if connection is closed
    if (eventSource.readyState === EventSource.CLOSED) {
      setTimeout(() => {
        eventSource = null;
        startEventStream();
      }, POLL_ERROR_DELAY);
    }
  };
}

// ==================== Wallet Detection ====================

/**
 * Detect and report wallet extension
 */
async function handleWalletDetection() {
  // Skip if already detected and logged
  if (isWalletDetected && isWalletDetectionLogged) return;

  // Check if wallet is available
  if (!window.arweaveWallet) {
    if (dom.log && !isWalletDetectionLogged) {
      setState(
        States.ERROR,
        'No Arweave wallet extension detected<br><small>Please install Wander or ArConnect and refresh this page</small>'
      );
      log(
        'Please install Wander or ArConnect wallet extension',
        'error'
      );
      isWalletDetectionLogged = true;
    }
    return;
  }

  // Get wallet info
  const walletName = window.arweaveWallet?.walletName || 'Unknown Wallet';
  const walletVersion = window.arweaveWallet?.walletVersion || '1.0.0';

  // Log detection
  if (dom.log && !isWalletDetectionLogged) {
    log(`${walletName} (v${walletVersion}) detected. Waiting for connection request...`);
    setState(States.DISCONNECTED, '⏳ Waiting for connection request...');
    isWalletDetectionLogged = true;
  }

  // Send wallet info to server
  if (!isWalletDetected) {
    isWalletDetected = true;
    await sendWalletInfo(walletName, walletVersion);
  }
}

// ==================== Initialization ====================

/**
 * Initialize application on page load
 */
window.addEventListener('load', () => {
  cacheDOMElements();
  startEventStream();

  // Setup clear log button
  const clearButton = document.getElementById('clearLog');
  if (clearButton) {
    clearButton.addEventListener('click', clearLog);
  }

  // Handle wallet detection
  if (window.arweaveWallet) {
    handleWalletDetection();
  } else {
    // Wait a bit for wallet extension to load
    setTimeout(handleWalletDetection, 500);
  }
});

// Listen for wallet extension load event
window.addEventListener('arweaveWalletLoaded', handleWalletDetection);
