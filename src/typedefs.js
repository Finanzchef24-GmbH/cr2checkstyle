/**
 * @typedef {{
 *   source: string,
 *   line: number,
 *   severity: string,
 *   message: string
 * }}
 */
cr2cs.Message;

/**
 * @typedef {{
 *   module: Object.<string, Array.<number>>,
 *   function: Object.<string, Array.<number>>
 * }}
 */
cr2cs.Thresholds;