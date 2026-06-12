/**
 * Result reveal constants — shared by the result API and the DV layer.
 * Below MIN_REVEAL_N a result reports still_counting and ships NO aggregate:
 * never an empty chart, never fake precision (product rail).
 */
export const MIN_REVEAL_N = 10;
