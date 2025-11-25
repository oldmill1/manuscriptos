<script lang="ts">
	import styles from './WidgetArea.module.scss';

	interface Props {
		documentId?: string;
		dbService?: any;
	}

	let { documentId, dbService }: Props = $props();

	let selectedOption = $state<'shorter' | 'professional' | 'clear' | null>(null);
	let isRewriting = $state(false);

	async function handleRewrite() {
		if (!documentId || !dbService) {
			console.error('Missing documentId or dbService');
			return;
		}

		isRewriting = true;
		
		try {
			// Get current document content
			const document = await dbService.read(documentId);
			if (!document) {
				console.error('Document not found');
				return;
			}

			const currentContent = document.content;
			if (!currentContent.trim()) {
				console.log('No content to rewrite');
				return;
			}

			console.log('Sending to rewrite API:', currentContent.substring(0, 100) + '...');

			// Call your secure API route instead of OpenAI directly
			const response = await fetch('/api/rewrite', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ text: currentContent })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'API request failed');
			}

			const data = await response.json();
			const rewrittenText = data.rewrittenText;

			console.log('API response:', rewrittenText);
			
			if (!rewrittenText || rewrittenText.trim() === '') {
				console.error('API returned empty response');
				alert('API returned an empty response. Please try again.');
				return;
			}

			// Update document with rewritten content
			document.updateContent(rewrittenText);
			await dbService.update(document);

			console.log('[REWRITTEN] Document content updated successfully');
			
			// Update the parent directly
			if (typeof window !== 'undefined' && (window as any).updateDocumentContent) {
				(window as any).updateDocumentContent(documentId, rewrittenText);
			}

		} catch (error) {
			console.error('Failed to rewrite document:', error);
			if (error instanceof Error) {
				if (error.message.includes('API key')) {
					alert('OpenAI API key is not configured on the server.');
				} else {
					alert(`Failed to rewrite document: ${error.message}`);
				}
			} else {
				alert('Failed to rewrite document. Please check the console for details.');
			}
		} finally {
			isRewriting = false;
		}
	}

	function handleOptionSelect(option: 'shorter' | 'professional' | 'clear') {
		selectedOption = option;
		console.log('Selected option:', option);
	}
</script>

<div class={`${styles.widget} ${styles.rewriterWidget}`}>
	<div class={styles.widgetHeader}>
		<div class={styles.widgetTitle}>
			<img src="/icons/ai.png" alt="Rewriter" class={styles.widgetIcon} />
			Wizard
		</div>
	</div>

	<div class={styles.widgetContent}>
		<!-- First row: Rewrite and Clean Up buttons -->
		<div class={styles.rewriterRow}>
			<button class={styles.rewriteButton} onclick={handleRewrite} disabled={isRewriting}>
				<img src="/icons/fantasy.png" alt="AI" class={styles.rewriteIcon} />
				{isRewriting ? 'Re-writing...' : 'Re-write'}
			</button>
			<button class={styles.rewriteButton} onclick={handleRewrite}>
				<img src="/icons/sparkle.png" alt="AI" class={styles.rewriteIcon} />
				Grammar
			</button>
		</div>

		<!-- Second row: Three radio button options -->
		<div class={styles.rewriterRow}>
			<div class={styles.radioGroup}>
				<label class={styles.radioOption}>
					<input
						type="radio"
						name="rewriter-option"
						class={styles.input}
						checked={selectedOption === 'shorter'}
						onchange={() => handleOptionSelect('shorter')}
					/>
					<span>Shorter</span>
				</label>

				<label class={styles.radioOption}>
					<input
						type="radio"
						name="rewriter-option"
						class={styles.input}
						checked={selectedOption === 'professional'}
						onchange={() => handleOptionSelect('professional')}
					/>
					<span>Professional</span>
				</label>

				<label class={styles.radioOption}>
					<input
						type="radio"
						name="rewriter-option"
						class={styles.input}
						checked={selectedOption === 'clear'}
						onchange={() => handleOptionSelect('clear')}
					/>
					<span>Clear</span>
				</label>
			</div>
		</div>
	</div>
</div>
