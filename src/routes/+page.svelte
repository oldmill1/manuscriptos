<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Document } from '$lib/models/Document';
  import { DatabaseService } from '$lib/services/DatabaseService';

  let dbService: DatabaseService;
  let isBrowser = false;
  let isVisible = false;

  onMount(async () => {
    isBrowser = true;
    isVisible = true;
    
    try {
      const { DatabaseService } = await import('$lib/services/DatabaseService');
      dbService = new DatabaseService('squiredb');
      console.log('PouchDB "squiredb" initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  });

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
</script>

<svelte:head>
  <title>Squire</title>
</svelte:head>

<div class="container">
  <main>
    <h1>Squire</h1>
    <p>Where words come to play</p>
    <button onclick={handleNewDocument}>Start writing</button>
  </main>
</div>

<style>
  .container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2a2a3e;
    position: relative;
    overflow: hidden;
  }

  .container::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(138, 43, 226, 0.1) 0%, transparent 50%);
    animation: float 20s infinite ease-in-out;
  }

  @keyframes float {
    0%, 100% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.1); }
  }

  main {
    text-align: center;
    z-index: 1;
    position: relative;
  }

  h1 {
    font-size: 3rem;
    font-weight: 200;
    color: #e0e0e0;
    margin-bottom: 0.5rem;
    letter-spacing: 0.05em;
  }

  p {
    font-size: 1.1rem;
    color: #a0a0a0;
    margin-bottom: 2.5rem;
    font-style: italic;
  }

  button {
    padding: 0.75rem 2rem;
    font-size: 1rem;
    color: #e0e0e0;
    background: linear-gradient(135deg, #323347 0%, #40415a 100%);
    border: 1px solid #5a5a6a;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  button:hover {
    border-color: #8a7cc7;
    background: linear-gradient(135deg, #3a3a57 0%, #4a4b6a 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(138, 43, 226, 0.2);
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2.5rem;
    }
  }
</style>
