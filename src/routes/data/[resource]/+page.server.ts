import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
  const host = url.hostname;
  
  // Check if request is from localhost
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '';
  
  if (!isLocalhost) {
    throw error(403, 'Access denied: This route is only accessible from localhost');
  }

  const resource = params.resource;
  
  // Validate resource type
  if (resource !== 'documents' && resource !== 'lists') {
    throw error(404, `Resource "${resource}" not found. Available resources: documents, lists`);
  }
  
  // Return the validated resource type
  return {
    resource,
    isLocalhost: true
  };
};
