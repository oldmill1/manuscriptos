<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { Document } from '$lib/models/Document';
  import { DatabaseService } from '$lib/services/DatabaseService';

  let dbService: DatabaseService;
  let isBrowser = false;
  let recentDocs: Document[] = [];
  let selectedCategory = 'Recents';
  let hasLoaded = false;

  onMount(async () => {
    isBrowser = true;
    
    try {
      const { DatabaseService } = await import('$lib/services/DatabaseService');
      dbService = new DatabaseService('squiredb');
      console.log('PouchDB "squiredb" initialized successfully');
      
      // Load recent documents
      await loadRecentDocs();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  });

  async function loadRecentDocs() {
    try {
      if (!dbService) return;
      
      const docs = await dbService.list();
      recentDocs = docs.slice(0, 6); // Show last 6 documents
    } catch (error) {
      console.error('Failed to load recent documents:', error);
    } finally {
      hasLoaded = true;
    }
  }

  async function handleNewDocument() {
    try {
      if (!isBrowser || !dbService) {
        throw new Error('Database not initialized');
      }
      
      const newDoc = new Document('Untitled Document', '');
      const savedDoc = await dbService.create(newDoc);
      
      console.log('New document created:', savedDoc.id);
      await goto(`/docs/${savedDoc.id}`);
    } catch (error) {
      console.error('Failed to create new document:', error);
    }
  }

  async function openDocument(docId: string) {
    await goto(`/docs/${docId}`);
  }
</script>

<svelte:head>
  <title>Squire</title>
</svelte:head>

<div class="app-container">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>Squire</h2>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-item active">
        <span class="nav-icon">📄</span>
        <span>Recents</span>
      </div>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <div class="content-header">
      <h1>Recents</h1>
    </div>
    
    <div class="documents-grid">
      {#each recentDocs as doc (doc.id)}
        <button 
          class="document-card" 
          onclick={() => openDocument(doc.id)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openDocument(doc.id);
            }
          }}
          type="button"
          transition:fade={{ duration: 300 }}
        >
          <div class="card-preview">
            <div class="preview-text">
              {doc.content.slice(0, 150) || 'Empty document...'}
            </div>
          </div>
          <div class="card-footer">
            <h3 class="card-title">{doc.title}</h3>
            <span class="card-category">Document</span>
          </div>
        </button>
      {/each}
      
      {#if hasLoaded && recentDocs.length === 0}
        <div class="empty-state" transition:fade={{ duration: 300 }}>
          <p>No recent documents</p>
          <button class="create-first-btn" onclick={handleNewDocument}>
            Create your first document
          </button>
        </div>
      {/if}
    </div>
  </main>
</div>

<style>
  .app-container {
    display: flex;
    height: 100vh;
    background: #1a1a1a;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* Sidebar */
  .sidebar {
    width: 240px;
    background: #2a2a3e;
    border-right: 1px solid #3a3a4e;
    display: flex;
    flex-direction: column;
  }

  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid #3a3a4e;
  }

  .sidebar-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0;
  }

  .sidebar-nav {
    flex: 1;
    padding: 1rem 0;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .nav-item:hover {
    background: #3a3a4e;
  }

  .nav-item.active {
    background: #4a4a6e;
    border-left: 3px solid #8a7cc7;
  }

  .nav-icon {
    font-size: 1.1rem;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    overflow: hidden;
  }

  .content-header {
    padding: 2rem 2rem 1rem;
    border-bottom: 1px solid #2a2a3e;
  }

  .content-header h1 {
    font-size: 1.8rem;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0;
  }

  .documents-grid {
    flex: 1;
    padding: 2rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    overflow-y: auto;
  }

  .document-card {
    background: #2a2a3e;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: 1px solid #3a3a4e;
  }

  .document-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-color: #4a4a6e;
  }

  .card-preview {
    height: 200px;
    padding: 1rem;
    background: #323347;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .preview-text {
    color: #a0a0a0;
    font-size: 0.9rem;
    line-height: 1.5;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    line-clamp: 6;
    -webkit-box-orient: vertical;
  }

  .card-footer {
    padding: 1rem;
    background: #2a2a3e;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-title {
    font-size: 1rem;
    font-weight: 500;
    color: #e0e0e0;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 150px;
  }

  .card-category {
    font-size: 0.75rem;
    color: #8a7cc7;
    background: rgba(138, 124, 199, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 500;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem 2rem;
    color: #a0a0a0;
  }

  .empty-state p {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }

  .create-first-btn {
    padding: 0.75rem 1.5rem;
    background: #8a7cc7;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s ease;
  }

  .create-first-btn:hover {
    background: #7a6bb7;
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 200px;
    }
    
    .documents-grid {
      grid-template-columns: 1fr;
      padding: 1rem;
    }
  }
</style>
