# Internet Computer Error Handling Guide

This document provides guidance on handling common errors when communicating with Internet Computer (ICP) canisters in the APT-CASINO frontend application.

## Common Error Types

### 400 Bad Request Errors

The most common error encountered is the `400 Bad Request` error, which often relates to certificate verification failures.

#### Causes:

- Certificate verification failures
- Invalid request format
- Identity/principal validation issues
- Temporary IC network issues
- Root key fetching failures

#### Resolution:

Our enhanced agent now includes:

- Automatic retries (up to 3 times) with exponential backoff
- Proper error categorization
- Certificate verification middleware
- Root key re-fetching during retries

### Certificate Verification Failures

Certificate verification is a critical security feature of the Internet Computer, but it can sometimes cause issues during development or in certain network conditions.

#### Causes:

- Root key fetching failures
- Principal validation issues
- Signature verification issues
- Network connectivity problems

#### Resolution:

- For local development, we've disabled certain verifications:
  - `verifyQuerySignatures: false`
  - `disableOriginalPrincipalValidation: true`
- Added retry mechanisms for certificate verification
- Implemented proper error handling and categorization

## Error Categories

The agent now categorizes errors into the following types:

- `BAD_REQUEST`: 400 Bad Request errors
- `CERTIFICATE_ERROR`: Certificate verification failures
- `SIGNATURE_ERROR`: Authentication and signature issues
- `CANISTER_ERROR`: Errors from canister execution
- `NETWORK_ERROR`: Network connectivity issues
- `REPLICA_ERROR`: Issues with the IC replica
- `QUERY_REJECTED`: Rejected queries
- `UNKNOWN`: Other unspecified errors

## Debugging Steps

If you encounter persistent errors:

1. **Check the console logs** - Look for specific error categories and messages
2. **Use the test connectivity function**:

   ```javascript
   import { testICPConnectivity } from "../utils/icp-agent";

   // Test connectivity to the IC
   const result = await testICPConnectivity({
     host: "https://ic0.app",
     isLocal: false,
   });
   console.log(result);
   ```

3. **For 400 Bad Request errors**, use the specialized handler:

   ```javascript
   import { handle400Error, createOptimizedAgent } from "../utils/icp-agent";

   try {
     // Your code that causes 400 error
   } catch (error) {
     if (error.message?.includes("400") || error.response?.status === 400) {
       const agent = await createOptimizedAgent({
         /* your options */
       });
       const errorInfo = await handle400Error(error, agent);
       console.log("Error analysis:", errorInfo);
     }
   }
   ```

4. **Try clearing browser cache** - Certificate issues can sometimes be resolved by clearing cache

## Configuration Options

The enhanced agent accepts these configuration options:

```javascript
const agent = await createOptimizedAgent({
  identity: yourIdentity, // Optional: Your user's identity
  host: "https://ic0.app", // The IC host (default: http://127.0.0.1:4943)
  isLocal: false, // Whether this is a local development environment
  fetchRootKey: true, // Whether to fetch the root key (local dev only)
});
```

## Recent Improvements

1. **Enhanced retry mechanism** with exponential backoff
2. **Better error categorization** for more precise handling
3. **Certificate verification middleware** to intercept and retry on certificate errors
4. **Connectivity testing function** to diagnose network issues
5. **Specialized 400 error handler** for detailed diagnostics
6. **Increased timeout** from 30s to 60s for better reliability
7. **Disabled principal validation** for local development to reduce errors

These improvements should address the 400 Bad Request errors and certificate verification failures experienced in the application.
