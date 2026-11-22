
// Official job categories from Kaila's sample job script.
// Keep these values consistent with the backend.

export const JOB_CATEGORIES = [
  "Software Development",
  "Data and AI",
  "Design",
  "Marketing",
  "Finance",
  "Customer Support",
] as const;

// Official job locations from Kaila's sample job script.

export const JOB_LOCATIONS = [
  "Montreal",
  "Toronto",
  "Vancouver",
  "Ottawa",
  "Quebec City",
  "Remote",
] as const;

// Empty string represents "All" in the filter dropdowns.
// This prevents us from sending "All" to the backend as a filter.

export const ALL_FILTER_VALUE = "";
