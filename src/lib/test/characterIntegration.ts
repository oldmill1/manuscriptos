// Simple test to verify CharacterService integration
import { useAppState } from '$lib/stores/appState.svelte';

// Test the character functionality
export function testCharacterIntegration() {
  const app = useAppState();
  
  console.log('=== CharacterService Integration Test ===');
  
  // Check if character service is available
  if (app.characterService) {
    console.log('✅ CharacterService is available in app state');
  } else {
    console.log('❌ CharacterService is not available');
    return;
  }
  
  // Check if characters array exists
  if (app.characters) {
    console.log('✅ Characters array is available');
    console.log(`📊 Current characters count: ${app.characters.length}`);
  } else {
    console.log('❌ Characters array is not available');
  }
  
  // Test methods exist
  console.log('✅ createCharacter method is available:', typeof app.createCharacter === 'function');
  console.log('✅ updateCharacter method is available:', typeof app.updateCharacter === 'function');
  console.log('✅ deleteCharacter method is available:', typeof app.deleteCharacter === 'function');
  console.log('✅ loadCharactersByParentId method is available:', typeof app.loadCharactersByParentId === 'function');
  console.log('✅ searchCharacters method is available:', typeof app.searchCharacters === 'function');
  
  console.log('=== Test Complete ===');
}

// Export for easy testing in browser console
export { testCharacterIntegration as testCharacters };
