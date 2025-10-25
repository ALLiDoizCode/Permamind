import { connect } from '@permaweb/aoconnect';

// Randao CU/MU endpoints for reliable AO gateway access
const MU_URL = import.meta.env.VITE_MU_URL || 'https://ur-mu.randao.net';
const CU_URL = import.meta.env.VITE_CU_URL || 'https://ur-cu.randao.net';

// Configure AO connection (legacy mode for custom CU/MU)
const ao = connect({
  MODE: 'legacy' as const,
  MU_URL,
  CU_URL,
});

export const { dryrun } = ao;

// Registry process ID on AO mainnet
export const REGISTRY_PROCESS_ID =
  import.meta.env.VITE_REGISTRY_PROCESS_ID ||
  'aMF8MaSntSA_O1JMSsi3wLOcvZd1bCYLqcEQBGsxHVk';

// Example: Fetch registry info
export async function fetchRegistryInfo() {
  try {
    const result = await dryrun({
      process: REGISTRY_PROCESS_ID,
      tags: [{ name: 'Action', value: 'Info' }],
    });

    // Security: Validate response structure
    if (!result || !result.Messages || !Array.isArray(result.Messages)) {
      console.error('Invalid response structure from registry');
      return null;
    }

    if (result.Messages.length === 0) {
      console.error('No messages in registry response');
      return null;
    }

    // Security: Handle JSON parsing errors
    try {
      const data = JSON.parse(result.Messages[0].Data);
      return data;
    } catch (parseError) {
      console.error('Failed to parse registry response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error fetching registry info:', error);
    return null;
  }
}
