/**
 * These are the paths for the directories that should be copied from each stage
 * to the composite image. Any files needed in the composite image must be in
 * one of these directories.
 */
export const IMAGE_BIN_PATHS = [
  '/usr/bin',
  '/usr/share',
  '/usr/local/bin',
  '/usr/local/lib'
];
