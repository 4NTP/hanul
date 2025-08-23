import { fetchTool } from './http/fetch';
import { sequentialThinkingTool } from './think/sequential-thinking';
import { webReadTool } from './web/web-read';
import { webSearchTool } from './web/web-search';

export const availableTools = [
  // HTTP
  fetchTool,

  // Think
  sequentialThinkingTool,

  // Web
  webReadTool,
  webSearchTool,
];
