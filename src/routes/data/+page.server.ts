import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
  const host = url.hostname;
  
  // Check if request is from localhost
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '';
  
  if (!isLocalhost) {
    throw error(403, 'Access denied: This route is only accessible from localhost');
  }
  
  // Return 404 for the base /data route since we now require a specific resource
  throw error(404, 'Resource not found. Please specify a resource: /data/documents or /data/lists');
};
