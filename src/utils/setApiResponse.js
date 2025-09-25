/**
 * Utility to send a consistent API response
 * @param {number} statusCode - HTTP status code
 * @param {boolean} status - Success or failure
 * @param {any} data - Response data
 * @param {string} message - Optional message
 * @param {any} error - Optional error
 * @param {Object} res - Express response object
 */
module.exports.setApiResponse = (
  statusCode,
  status,
  data = null,
  error = null,
  res
) => {
  console.log("status", status);
  const response = { status };
  if (data !== null) response.data = data;
  if (error) response.error = error;
  res.status(statusCode).json(response);
};
