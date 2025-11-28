<script lang="ts">
	import Modal from '$lib/components/Modal/Modal.svelte';

	// Example 1: Delete confirmation
	let showDeleteModal = false;
	function handleDelete() {
		console.log('Item deleted');
		showDeleteModal = false;
	}

	// Example 2: Save confirmation
	let showSaveModal = false;
	function handleSave() {
		console.log('Document saved');
		showSaveModal = false;
	}

	// Example 3: Form submission
	let showSubmitModal = false;
	function handleSubmit() {
		console.log('Form submitted');
		showSubmitModal = false;
	}

	// Example 4: Custom action with 3 buttons
	let showCustomModal = false;
	function handleCustomAction1() {
		console.log('Custom action 1');
		showCustomModal = false;
	}
	function handleCustomAction2() {
		console.log('Custom action 2');
		showCustomModal = false;
	}
	function handleCustomAction3() {
		console.log('Custom action 3');
		showCustomModal = false;
	}
</script>

<div style="padding: 20px; display: flex; flex-direction: column; gap: 10px;">
	<button on:click={() => showDeleteModal = true}>
		Delete Confirmation
	</button>
	
	<button on:click={() => showSaveModal = true}>
		Save Document
	</button>
	
	<button on:click={() => showSubmitModal = true}>
		Submit Form
	</button>
	
	<button on:click={() => showCustomModal = true}>
		Custom 3-Button Modal
	</button>
</div>

{#snippet deleteContent()}
	<h2 style="margin: 0 0 16px 0; font-size: 28px; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Delete Item</h2>
	<p style="margin: 0; color: #666;">Are you sure you want to delete this item?</p>
{/snippet}

{#snippet saveContent()}
	<h2 style="margin: 0 0 16px 0; font-size: 28px; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Save Document</h2>
	<p style="margin: 0; color: #666;">Do you want to save your changes?</p>
{/snippet}

{#snippet submitContent()}
	<h2 style="margin: 0 0 16px 0; font-size: 28px; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Submit Form</h2>
	<p style="margin: 0; color: #666;">Ready to submit your form data?</p>
{/snippet}

{#snippet customContent()}
	<h2 style="margin: 0 0 16px 0; font-size: 28px; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Choose Action</h2>
	<p style="margin: 0; color: #666;">Select one of the available options:</p>
{/snippet}

<!-- Delete Confirmation Modal -->
<Modal 
	isOpen={showDeleteModal} 
	dark={true}
	buttons={[
		{ text: 'Cancel', callback: () => showDeleteModal = false, primary: false },
		{ text: 'Delete', callback: handleDelete, primary: true }
	]}
>
	{@render deleteContent()}
</Modal>

<!-- Save Document Modal -->
<Modal 
	isOpen={showSaveModal} 
	dark={true}
	buttons={[
		{ text: 'Cancel', callback: () => showSaveModal = false, primary: false },
		{ text: 'Save', callback: handleSave, primary: true }
	]}
>
	{@render saveContent()}
</Modal>

<!-- Submit Form Modal -->
<Modal 
	isOpen={showSubmitModal} 
	dark={true}
	buttons={[
		{ text: 'Go Back', callback: () => showSubmitModal = false, primary: false },
		{ text: 'Submit', callback: handleSubmit, primary: true }
	]}
>
	{@render submitContent()}
</Modal>

<!-- Custom 3-Button Modal -->
<Modal 
	isOpen={showCustomModal} 
	dark={true}
	buttons={[
		{ text: 'Option 1', callback: handleCustomAction1, primary: false },
		{ text: 'Option 2', callback: handleCustomAction2, primary: false },
		{ text: 'Option 3', callback: handleCustomAction3, primary: true }
	]}
>
	{@render customContent()}
</Modal>
