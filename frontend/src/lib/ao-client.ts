import { connect } from '@permaweb/aoconnect';
import { getRegistryProcessId, getMuUrl, getCuUrl, getMuUrlFallback, getCuUrlFallback } from './registry-config';

// Configure primary AO connection
const aoPrimary = connect({
  MODE: 'legacy' as const,
  MU_URL: getMuUrl(),
  CU_URL: getCuUrl(),
});

// Configure fallback AO connection
const aoFallback = connect({
  MODE: 'legacy' as const,
  MU_URL: getMuUrlFallback(),
  CU_URL: getCuUrlFallback(),
});

export const { dryrun } = aoPrimary;
export const { dryrun: dryrunFallback } = aoFallback;

// Registry process ID from centralized config
// Users don't need to configure this manually
export const REGISTRY_PROCESS_ID = getRegistryProcessId();

// Example: Fetch registry info with automatic fallback
export async function fetchRegistryInfo() {
  // Try primary endpoint first
  try {
    const result = await dryrun({
      process: REGISTRY_PROCESS_ID,
      tags: [{ name: 'Action', value: 'Info' }],
    });

    // Security: Validate response structure
    if (!result || !result.Messages || !Array.isArray(result.Messages)) {
      console.error('Invalid response structure from registry (primary)');
      throw new Error('Invalid response structure');
    }

    if (result.Messages.length === 0) {
      console.error('No messages in registry response (primary)');
      throw new Error('No messages in response');
    }

    // Security: Handle JSON parsing errors
    try {
      const data = JSON.parse(result.Messages[0].Data);
      return data;
    } catch (parseError) {
      console.error('Failed to parse registry response (primary):', parseError);
      throw parseError;
    }
  } catch (primaryError) {
    console.warn('Primary endpoint failed, trying fallback:', primaryError);

    // Try fallback endpoint
    try {
      const result = await dryrunFallback({
        process: REGISTRY_PROCESS_ID,
        tags: [{ name: 'Action', value: 'Info' }],
      });

      // Security: Validate response structure
      if (!result || !result.Messages || !Array.isArray(result.Messages)) {
        console.error('Invalid response structure from registry (fallback)');
        return null;
      }

      if (result.Messages.length === 0) {
        console.error('No messages in registry response (fallback)');
        return null;
      }

      // Security: Handle JSON parsing errors
      try {
        const data = JSON.parse(result.Messages[0].Data);
        console.warn('Successfully fetched registry info using fallback endpoint');
        return data;
      } catch (parseError) {
        console.error('Failed to parse registry response (fallback):', parseError);
        return null;
      }
    } catch (fallbackError) {
      console.error('Both primary and fallback endpoints failed:', {
        primary: primaryError,
        fallback: fallbackError
      });
      return null;
    }
  }
}
