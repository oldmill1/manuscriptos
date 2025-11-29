# ActionRow Component

A flexible action row component built with Svelte 5 best practices.

## Features

- **Svelte 5 Runes**: Uses `$props()` and `$state()` for modern reactivity
- **TypeScript Support**: Fully typed with proper interfaces
- **Loading States**: Built-in loading spinner and disabled states
- **Responsive Design**: Flexible layout with hover and press effects
- **Accessibility**: Proper button semantics and keyboard support

## Usage

```svelte
<script>
	import { ActionRow } from '$lib/components/XProfile';
	
	function handleSave() {
		console.log('Saving...');
	}
</script>

<ActionRow action={handleSave} actionText="Save">
	<div class="row-content">
		<span>Item to save</span>
	</div>
</ActionRow>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `Snippet` | - | Content to display in the row |
| `action` | `() => void` | - | Function to call when action button is clicked |
| `actionText` | `string` | `"Action"` | Text to display on the action button |
| `disabled` | `boolean` | `false` | Whether the row and button are disabled |
| `loading` | `boolean` | `false` | Whether to show loading state |

## Styling

The component uses CSS custom properties for theming:

- `--background-secondary`: Row background color
- `--border-color`: Row border color  
- `--background-hover`: Hover background color
- `--border-hover`: Hover border color
- `--primary-color`: Button background color
- `--primary-hover`: Button hover color
- `--disabled-color`: Disabled button color

## Svelte 5 Features

- **$props()**: Modern props system with full TypeScript support
- **$state()**: Fine-grained reactivity for internal state
- **Snippets**: Clean content passing using {@render} syntax
- **Type Safety**: Compile-time type checking for all props
