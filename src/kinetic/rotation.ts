/** Visual utility only; does not implement a kinetic network. */
export function rotationDegrees(rpm: number, elapsedSeconds: number): number {
  if (!Number.isFinite(rpm) || !Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    throw new RangeError('Expected finite RPM and nonnegative elapsed time');
  }
  return ((rpm * 6 * elapsedSeconds) % 360 + 360) % 360;
}
