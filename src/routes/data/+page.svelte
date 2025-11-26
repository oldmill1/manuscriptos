<script lang="ts">
  import { onMount } from 'svelte';
  import { DatabaseService } from '$lib/services/DatabaseService';
  import { Document } from '$lib/models/Document';
  import { browser } from '$app/environment';
  import SwitchMini from '$lib/components/SwitchMini/SwitchMini.svelte';

  let dbService: DatabaseService;
  let documents = $state<Document[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Track selected documents
  let selectedDocuments = $state(new Set<string>());

  function toggleDocumentSelection(docId: string) {
    if (selectedDocuments.has(docId)) {
      selectedDocuments.delete(docId);
    } else {
      selectedDocuments.add(docId);
    }
    // Trigger reactivity
    selectedDocuments = new Set(selectedDocuments);
  }

  function toggleSelectAll() {
    if (selectedDocuments.size === documents.length) {
      selectedDocuments.clear();
    } else {
      selectedDocuments = new Set(documents.map(doc => doc.id));
    }
  }

  function isAllSelected() {
    return documents.length > 0 && selectedDocuments.size === documents.length;
  }

  function isPartiallySelected() {
    return selectedDocuments.size > 0 && selectedDocuments.size < documents.length;
  }

  onMount(async () => {
    try {
      const { DatabaseService } = await import('$lib/services/DatabaseService');
      dbService = new DatabaseService('squiredb');
      
      // Load documents from database
      const allDocs = await dbService.list();
      
      // Sort by createdAt (most recent first) and limit to 10
      documents = allDocs
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);
      
    } catch (err) {
      console.error('Failed to load documents:', err);
      error = 'Failed to load documents from database';
    } finally {
      loading = false;
    }
  });

  function formatDate(date: Date): string {
    return date.toLocaleString();
  }

  function truncateContent(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
</script>

<svelte:head>
  <title>Data - Squire</title>
  <meta name="description" content="Data management page" />
</svelte:head>

<div class="table-container">
  {#if loading}
    <div class="loading">Loading documents...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if documents.length === 0}
    <div class="empty">No documents found</div>
  {:else}
    <table class="data-table">
      <thead>
        <tr>
          <th class="checkbox-cell">
            <SwitchMini 
              checked={isAllSelected()} 
              onchange={toggleSelectAll}
            />
          </th>
          <th>ID</th>
          <th>Title</th>
          <th>Content Preview</th>
          <th>Created At</th>
          <th>Updated At</th>
        </tr>
      </thead>
      <tbody>
        {#each documents as doc (doc.id)}
          <tr class={selectedDocuments.has(doc.id) ? 'selected-row' : ''}>
            <td class="checkbox-cell">
              <SwitchMini 
                checked={selectedDocuments.has(doc.id)}
                onchange={() => toggleDocumentSelection(doc.id)}
              />
            </td>
            <td class="id-cell">{doc.id}</td>
            <td class="title-cell">{doc.title}</td>
            <td class="content-cell">{truncateContent(doc.content)}</td>
            <td class="date-cell">{formatDate(doc.createdAt)}</td>
            <td class="date-cell">{formatDate(doc.updatedAt)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .table-container {
    width: 100vw;
    height: 100vh;
    background: rgb(16, 20, 23);
    overflow: auto;
    padding: 0;
    box-sizing: border-box;
  }

  .loading,
  .error,
  .empty {
    color: #e0e0e0;
    font-size: 1.2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .error {
    color: #ff6b6b;
  }

  .data-table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    background: rgb(16, 20, 23);
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .data-table th,
  .data-table td {
    border: 1px solid #3a3a4e;
    padding: 0.75rem;
    text-align: left;
  }

  .data-table th {
    background: linear-gradient(180deg, #2a2a3e 0%, #1f1f2e 100%);
    font-weight: 600;
    color: #ffffff;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .data-table td {
    background: rgb(16, 20, 23);
    color: #e0e0e0;
  }

  .data-table tr:hover td {
    background: linear-gradient(180deg, #2a2a3e 0%, #1f1f2e 100%);
  }

  .data-table tbody tr:nth-child(even) td {
    background: rgb(20, 24, 27);
  }

  .data-table tbody tr:nth-child(even):hover td {
    background: linear-gradient(180deg, #2a2a3e 0%, #1f1f2e 100%);
  }

  .id-cell {
    font-family: monospace;
    font-size: 0.85rem;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title-cell {
    font-weight: 600;
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .content-cell {
    color: #a0a0a0;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .date-cell {
    font-size: 0.9rem;
    color: #b0b0b0;
    white-space: nowrap;
  }

  .checkbox-cell {
    width: 40px;
    text-align: center;
    padding: 0.75rem 0.5rem !important;
  }

  .selected-row {
    border: 2px solid #add8e6 !important;
    border-radius: 4px;
    background: rgba(173, 216, 230, 0.1) !important;
  }
</style>
