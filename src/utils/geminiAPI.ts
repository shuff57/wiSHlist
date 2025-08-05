interface ItemEnhancementRequest {
  url?: string;
  title?: string;
  description?: string;
  price?: string;
  image?: string;
  userInput?: string; // For manual items, the user's input
}

interface ItemEnhancementResponse {
  name: string;
  description: string;
}

export class GeminiItemEnhancer {
  /**
   * Generate an intelligent name and description for an item based on scraped data
   */
  async enhanceScrapedItem(data: ItemEnhancementRequest): Promise<ItemEnhancementResponse> {
    try {
      const response = await fetch('/api/enhance-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enhance-scraped',
          data
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        console.error('Error from enhance-item API:', result.error);
        // Return fallback data
        return result.fallback || {
          name: data.title || 'Untitled Item',
          description: data.description || ''
        };
      }
    } catch (error) {
      console.error('Error calling enhance-item API:', error);
      // Fallback to original data
      return {
        name: data.title || 'Untitled Item',
        description: data.description || ''
      };
    }
  }

  /**
   * Generate an intelligent name and description for a manually entered item
   */
  async enhanceManualItem(userInput: string, searchContext?: string): Promise<ItemEnhancementResponse> {
    try {
      const response = await fetch('/api/enhance-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enhance-manual',
          data: { 
            userInput,
            searchContext 
          }
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        console.error('Error from enhance-item API:', result.error);
        // Return fallback data
        return result.fallback || {
          name: userInput,
          description: ''
        };
      }
    } catch (error) {
      console.error('Error calling enhance-item API:', error);
      // Fallback to user input
      return {
        name: userInput,
        description: ''
      };
    }
  }

  /**
   * Improve an existing item's name and description
   */
  async improveExistingItem(data: ItemEnhancementRequest): Promise<ItemEnhancementResponse> {
    try {
      const response = await fetch('/api/enhance-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'improve-existing',
          data
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        console.error('Error from enhance-item API:', result.error);
        // Return fallback data
        return result.fallback || {
          name: data.title || 'Untitled Item',
          description: data.description || ''
        };
      }
    } catch (error) {
      console.error('Error calling enhance-item API:', error);
      // Fallback to original data
      return {
        name: data.title || 'Untitled Item',
        description: data.description || ''
      };
    }
  }
}

// Export a singleton instance
export const geminiEnhancer = new GeminiItemEnhancer();
