<script lang="ts">
  import { onMount } from 'svelte';
  import { DatabaseService } from '$lib/services/DatabaseService';
  import { ListService } from '$lib/services/ListService';
  import { Document } from '$lib/models/Document';
  import { List } from '$lib/models/List';
  import type { PageData } from './$types';

  export let data: PageData;

  let dbService: DatabaseService;
  let listService: ListService;
  let items: (Document | List)[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      if (data.resource === 'documents') {
        const { DatabaseService } = await import('$lib/services/DatabaseService');
        dbService = new DatabaseService('squiredb');
        
        // Load documents from database
        const allDocs = await dbService.list();
        
        // Sort by createdAt (most recent first) and limit to 10
        items = allDocs
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10);
      } else if (data.resource === 'lists') {
        const { ListService } = await import('$lib/services/ListService');
        listService = new ListService('squiredb');
        
        // Load lists from database
        const allLists = await listService.list();
        
        // Sort by createdAt (most recent first) and limit to 10
        items = allLists
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10);
      }
      
    } catch (err) {
      console.error('Failed to load items:', err);
      error = `Failed to load ${data.resource} from database`;
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

  function isDocument(item: Document | List): item is Document {
    return item instanceof Document;
  }

  function isList(item: Document | List): item is List {
    return item instanceof List;
  }
</script>

<svelte:head>
  <title>{data.resource} - Data - Squire</title>
  <meta name="description" content="Data management page" />
</svelte:head>

<div class="table-container">
  {#if loading}
    <div class="loading">Loading {data.resource}...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if items.length === 0}
    <div class="empty">No {data.resource} found</div>
  {:else}
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          {#if data.resource === 'documents'}
            <th>Title</th>
            <th>Content Preview</th>
          {:else if data.resource === 'lists'}
            <th>Name</th>
            <th>Type</th>
            <th>Items Count</th>
          {/if}
          <th>Created At</th>
          <th>Updated At</th>
        </tr>
      </thead>
      <tbody>
        {#each items as item (item.id)}
          <tr>
            <td class="id-cell">{item.id}</td>
            {#if isDocument(item)}
              <td class="title-cell">{item.title}</td>
              <td class="content-cell">{truncateContent(item.content)}</td>
            {:else if isList(item)}
              <td class="title-cell">{item.name}</td>
              <td class="type-cell">{item.type}</td>
              <td class="count-cell">{item.itemIds.length}</td>
            {/if}
            <td class="date-cell">{formatDate(item.createdAt)}</td>
            <td class="date-cell">{formatDate(item.updatedAt)}</td>
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
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
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

  .type-cell {
    color: #8a7cc7;
    font-weight: 500;
    text-transform: capitalize;
  }

  .count-cell {
    color: #b0b0b0;
    font-family: monospace;
  }

  .date-cell {
    font-size: 0.9rem;
    color: #b0b0b0;
    white-space: nowrap;
  }
</style>
