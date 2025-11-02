import { connect } from '@permaweb/aoconnect';
import { getRegistryProcessId, getMuUrl, getCuUrl } from './registry-config';

// Configure AO connection with centralized configuration
const ao = connect({
  MODE: 'legacy' as const,
  MU_URL: getMuUrl(),
  CU_URL: getCuUrl(),
});

export const { dryrun } = ao;

// Registry process ID from centralized config
// Users don't need to configure this manually
export const REGISTRY_PROCESS_ID = getRegistryProcessId();

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
