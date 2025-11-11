# Permamind Browser Wallet UI

Custom HTML/CSS/JS templates for browser wallet connection interface.

## Overview

This directory contains custom UI templates for the Permamind CLI's browser wallet connection flow. The UI provides a Permamind-branded experience matching the developer-CLI terminal dark theme.

## Files

- **wallet-connect.html** - HTML structure with required DOM elements for SSE protocol
- **wallet-connect.css** - Terminal dark theme styles matching developer-CLI design system
- **wallet-connect.js** - SSE protocol implementation for wallet operations

## Design System

Matches developer-CLI terminal dark theme:

### Colors

- **Background:**
  - Primary: `#10151B` (darkest background)
  - Surface: `#1a1f26` (container background)
- **Text:**
  - Primary: `#e2e8f0` (light gray, main text)
  - Secondary: `#94a3b8` (muted gray, secondary text)
- **Syntax/Accent Colors:**
  - Blue: `#61afef` (links, highlights)
  - Green: `#98c379` (success states)
  - Yellow: `#e5c07b` (warnings, connecting)
  - Purple: `#c678dd` (accents)
  - Cyan: `#56b6c2` (info, signing)
  - Red: `#e06c75` (errors)

### Typography

- **Primary font:** Inter (sans-serif) - Clean, modern sans-serif for UI text
- **Monospace font:** JetBrains Mono - For wallet addresses, transaction IDs, log entries

### Design Principles

- Terminal-themed aesthetic (matches CLI output style)
- Dark theme only (no light theme toggle)
- Minimal, developer-focused branding
- High contrast for accessibility
- Consistent with npm-like CLI experience

## SSE Protocol Requirements

**CRITICAL:** These DOM elements MUST exist for wallet connection to work:

- **`#status`** - Status display container (connecting, connected, error, signing states)
- **`#walletInfo`** - Wallet info display container
- **`#address`** - Wallet address display element
- **`#queueContainer`** - Request queue container
- **`#queueList`** - Queue items list
- **`#log`** - Activity log container

**DO NOT** remove or rename these elements without updating JavaScript.

### SSE Communication Flow

1. **EventSource Connection**: Browser establishes SSE connection to `/events` endpoint
2. **Server-to-Browser Events**: Server sends operation requests via SSE
3. **Browser-to-Server Responses**: Browser sends results/errors via POST to `/response`
4. **Wallet Detection**: Browser sends wallet info via POST to `/wallet-info`

### Event Types

**Completion Events** (Server → Browser):
```json
{
  "type": "completed",
  "status": "success" | "failed"
}
```

**Request Events** (Server → Browser):
```json
{
  "id": "unique-request-id",
  "type": "connect" | "sign" | "dispatch" | ...,
  "data": {
    "params": { /* operation-specific parameters */ }
  }
}
```

**Response Messages** (Browser → Server):
```javascript
POST /response
{
  "id": "request-id",
  "result": { /* operation result */ },
  "error": "error message" | null
}
```

## Responsive Design

- **Desktop (1440px):** Full layout with all sections visible
- **Tablet (768px):** Adjusted spacing and sizing
- **Mobile (375px):** Stacked layout, mobile-optimized controls, touch targets 44x44px minimum

## Browser Support

- **Chrome:** Latest stable (primary target)
- **Firefox:** Latest stable
- **Safari:** macOS and iOS (including Mobile Safari)
- **Edge:** Latest stable

## Integration

The custom UI is automatically configured when the `NodeArweaveWalletAdapter` is initialized:

```typescript
// File: cli/src/lib/node-arweave-wallet-adapter.ts
const customTemplatePath = path.resolve(__dirname, '../../ui/wallet-connect.html');

this.wallet = new NodeArweaveWallet({
  port,
  requestTimeout: this.requestTimeout,
  customHtmlTemplatePath: customTemplatePath
});
```

### Build Process

UI assets are copied from `src/ui/` to `dist/ui/` during build:

```bash
npm run build
# Runs: tsc && npm run copy-ui
# copy-ui: mkdir -p dist/ui && cp -r src/ui/* dist/ui/
```

### Path Resolution

Runtime path resolution (from compiled adapter):
```
cli/dist/lib/node-arweave-wallet-adapter.js
  + ../../ui/wallet-connect.html
  = cli/dist/ui/wallet-connect.html ✅
```

## Maintenance

### When updating fork library:

1. Review original `signer.js` for SSE protocol changes
2. Update `wallet-connect.js` to match protocol if needed
3. Test all wallet operations with custom UI
4. Verify cross-browser compatibility
5. Ensure responsive design still works

### Common Modifications

**Changing colors:**
Edit CSS custom properties in `wallet-connect.css`:
```css
:root {
  --bg-primary: #10151B;
  --bg-surface: #1a1f26;
  /* ... other variables */
}
```

**Adding new wallet operations:**
1. Add handler to `requestHandlers` object in `wallet-connect.js`
2. Add operation icon to `OPERATION_ICONS`
3. Add operation label to `OPERATION_LABELS`
4. Test operation with real wallet

**Modifying layout:**
Edit `wallet-connect.html` structure, but preserve required DOM IDs.

## Security Notes

- UI loads Arweave SDK from CDN: `https://unpkg.com/arweave/bundles/web.bundle.min.js`
- All wallet operations require user approval (via wallet extension)
- No private keys handled by custom UI (extension manages keys)
- SSE connection to local server only (same-origin, no CORS)

## Troubleshooting

### Custom UI not loading

**Problem:** Browser shows default library UI instead of custom Permamind UI

**Solutions:**
1. Verify build completed: `ls cli/dist/ui/wallet-connect.html`
2. Check adapter logs for custom template path
3. Ensure fork version is `@permamind/node-arweave-wallet@^0.0.13` or later

### SSE connection errors

**Problem:** "EventSource error" in browser console

**Solutions:**
1. Ensure local server is running (adapter initialized)
2. Check for port conflicts
3. Verify browser allows localhost connections
4. Check network tab for `/events` endpoint status

### Wallet operations failing

**Problem:** Operations time out or fail silently

**Solutions:**
1. Verify wallet extension installed (ArConnect or Wander)
2. Ensure wallet is unlocked
3. Check browser console for JavaScript errors
4. Verify required DOM elements exist in HTML

## Testing

### Manual Testing Checklist

1. **Visual Inspection:**
   - ✅ Colors match developer-CLI design system
   - ✅ Fonts load correctly (Inter, JetBrains Mono)
   - ✅ Responsive layout at 375px, 768px, 1440px

2. **SSE Protocol:**
   - ✅ EventSource connection established
   - ✅ Wallet operations functional
   - ✅ Request/response flow working
   - ✅ Error handling preserves connection

3. **Cross-Browser:**
   - ✅ Chrome, Firefox, Safari (macOS/iOS), Edge
   - ✅ All operations work in each browser
   - ✅ No browser-specific JavaScript errors

4. **Responsive Design:**
   - ✅ Desktop (1440px): Full layout
   - ✅ Tablet (768px): Adjusted layout
   - ✅ Mobile (375px): Stacked layout, touch-friendly

## Related Documentation

- [Epic 12 PRD](/docs/prd/epic-12-custom-wallet-ui-fork.md) - Full requirements and architecture
- [Story 12.1](/docs/stories/12.1.story.md) - Fork repository implementation
- [Story 12.2](/docs/stories/12.2.story.md) - Custom UI design (this story)
- [Tech Stack](/docs/architecture/tech-stack.md) - Full technology stack documentation
- [Coding Standards](/docs/architecture/coding-standards.md) - Development standards

---

**Created**: 2025-11-04
**Last Updated**: 2025-11-04
**Story**: 12.2 (Design Permamind Branded UI Components)
