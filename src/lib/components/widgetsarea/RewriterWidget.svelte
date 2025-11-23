<script lang="ts">
	import styles from './WidgetArea.module.scss';

	interface Props {
		documentId?: string;
	}

	let { documentId }: Props = $props();

	let selectedOption = $state<'shorter' | 'professional' | 'clear' | null>(null);

	function handleRewrite() {
		// Do nothing for now
		console.log('Rewrite clicked');
	}

	function handleOptionSelect(option: 'shorter' | 'professional' | 'clear') {
		selectedOption = option;
		console.log('Selected option:', option);
	}
</script>

<div class={styles.widget}>
	<div class={styles.widgetHeader}>
		<div class={styles.widgetTitle}>
			<img src="/icons/widget.png" alt="Rewriter" class={styles.widgetIcon} />
			Rewriter
		</div>
	</div>

	<div class={styles.widgetContent}>
		<!-- First row: Rewrite button -->
		<div class={styles.rewriterRow}>
			<button class={styles.rewriteButton} onclick={handleRewrite}>
				<img src="/icons/ai.png" alt="AI" class={styles.rewriteIcon} />
				Rewrite
			</button>
		</div>

		<!-- Second row: Three radio button options -->
		<div class={styles.rewriterRow}>
			<div class={styles.radioGroup}>
				<label class={styles.radioOption}>
					<input
						type="radio"
						name="rewriter-option"
						checked={selectedOption === 'shorter'}
						onchange={() => handleOptionSelect('shorter')}
					/>
					<span>Shorter</span>
				</label>

				<label class={styles.radioOption}>
					<input
						type="radio"
						name="rewriter-option"
						checked={selectedOption === 'professional'}
						onchange={() => handleOptionSelect('professional')}
					/>
					<span>Professional</span>
				</label>

				<label class={styles.radioOption}>
					<input
						type="radio"
						name="rewriter-option"
						checked={selectedOption === 'clear'}
						onchange={() => handleOptionSelect('clear')}
					/>
					<span>Clear</span>
				</label>
			</div>
		</div>
	</div>
</div>
