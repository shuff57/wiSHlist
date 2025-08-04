# Intelligent Address Autocomplete

The shipping address form now includes intelligent autocomplete functionality that helps teachers quickly fill in their shipping information.

## Features

### 🏫 **School Search**
- Type a school name (e.g., "Lincoln High School") and get suggestions with full addresses
- Automatically populates the complete address when selected
- School suggestions show with a 📚 school icon

### 🏠 **Address Search**  
- Type any address and get autocomplete suggestions
- Works with partial addresses (e.g., "123 Main St")
- Automatically fills in city, state, and ZIP code

### 🎯 **Smart Parsing**
- Automatically extracts and fills separate fields:
  - Name (school name if applicable)
  - Street address
  - City
  - State  
  - ZIP code

## How to Use

1. **Start typing** in the "Search School or Address" field
2. **Wait for suggestions** to appear (after typing 3+ characters)
3. **Select a suggestion** by clicking or using arrow keys + Enter
4. **Address fields auto-populate** with the selected information
5. **Edit any field** manually if needed

## Search Tips

### If Your Address Isn't Found:

1. **Try different formats:**
   - "123 Oak Street" instead of "123 Oak St"
   - "Oak Street Chicago" instead of full address
   - Just the street name: "Oak Street"

2. **Try nearby landmarks:**
   - "Main Street Elementary School"
   - "City Hall" + your city name
   - "Downtown" + your city name

3. **Use partial searches:**
   - Start with just the street name
   - Add city name: "Oak Street Springfield"
   - Try zip code: "62701"

4. **Alternative searches:**
   - Business names near you
   - Intersection: "Main St and Oak Ave"
   - Neighborhood name

## Examples

### School Search
- Type: "Roosevelt Elementary"
- Result: Full school address auto-populated

### Address Search  
- Type: "123 Oak Street Chicago"
- Result: Street, city, state, ZIP auto-filled

### Partial Address
- Type: "456 Pine"
- Result: Suggestions for Pine Street addresses

### Troubleshooting
- Type: "Main Street" + your city
- Type: Your zip code
- Type: "Elementary School" + your city

## Technology

- Uses **OpenStreetMap Nominatim API** (free, no API key required)
- **Multiple search strategies** for better coverage
- **Real-time search** with 300ms debounce
- **Keyboard navigation** support (arrow keys, Enter, Escape)
- **Mobile-friendly** interface

## Benefits

- ✅ **Faster data entry** - no need to type full addresses
- ✅ **Reduced errors** - accurate, standardized addresses
- ✅ **Better UX** - intuitive autocomplete interface
- ✅ **School-friendly** - specifically optimized for educational institutions
- ✅ **Free to use** - no API costs or rate limits
- ✅ **Improved coverage** - multiple search strategies for better results
