import { logger } from '../../utils/logger';

/**
 * Base repository class with common utility methods for handling stored procedure results
 */
export abstract class BaseRepository {
  /**
   * Process stored procedure result to extract values based on common response patterns
   * @param result Result from stored procedure execution
   * @param defaultValue Default value if extraction fails
   * @param fieldName Name of the field to extract
   * @returns The extracted value or the defaultValue
   */
  protected extractStoredProcedureResult<T>(
    result: any[],
    defaultValue: T,
    fieldName: string
  ): T {
    try {
      if (!Array.isArray(result) || result.length === 0) {
        return defaultValue;
      }
      
      // Handle different result structures
      if (result[0][fieldName] !== undefined) {
        return result[0][fieldName];
      } else if (Array.isArray(result[0]) && result[0].length > 0 && result[0][0] && result[0][0][fieldName] !== undefined) {
        return result[0][0][fieldName];
      }
      
      return defaultValue;
    } catch (error) {
      logger.error(`Error extracting ${fieldName} from stored procedure result:`, error);
      return defaultValue;
    }
  }

  /**
   * Logs the request and response for better debugging
   * @param methodName Name of the method for logging context
   * @param request The request parameters
   * @param response The response data
   */
  protected logRequestResponse(methodName: string, request: any, response: any): void {
    logger.info(`${methodName} REQUEST:`, request);
    logger.info(`${methodName} RESPONSE:`, response);
  }

  /**
   * Helper method to handle common error logging pattern
   * @param methodName Name of the method where the error occurred
   * @param error The error object
   * @param defaultValue Default value to return in case of error
   * @returns The default value
   */
  protected handleError<T>(methodName: string, error: any, defaultValue: T): T {
    logger.error(`Error in ${methodName}:`, error);
    return defaultValue;
  }
}