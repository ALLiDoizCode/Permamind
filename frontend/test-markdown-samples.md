# MarkdownRenderer Test Samples

This file contains comprehensive examples of all markdown features supported by the MarkdownRenderer component. Use this for manual testing in the browser.

## Headers

# Header Level 1
## Header Level 2
### Header Level 3

## Text Formatting

This is a paragraph with **bold text**, and `inline code`. You can combine **bold and `code`** together.

## Links

### External Links
- [Google](https://google.com) - Should open in new tab with external icon
- [GitHub](https://github.com) - Should open in new tab with external icon
- [Example](https://example.com) - Should open in new tab with external icon

### Internal Links
- [Home](/home) - Should open in same tab, no icon
- [About](/about) - Should open in same tab, no icon
- [Anchor](#section) - Should open in same tab, no icon

## Images

### Regular Images
![Beautiful landscape](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80)

![Another image with caption](https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80)

### Broken Image (should handle gracefully)
![Broken image test](https://invalid-url-that-does-not-exist.com/image.jpg)

## Videos

### YouTube Video
![YouTube Video](https://youtube.com/watch?v=dQw4w9WgXcQ)

### YouTube Short URL
![YouTube Short](https://youtu.be/dQw4w9WgXcQ)

### Vimeo Video
![Vimeo Video](https://vimeo.com/148751763)

## Lists

### Unordered Lists
- First item
- Second item with **bold**
- Third item with `inline code`
- Fourth item with [a link](https://example.com)

### Ordered Lists
1. First step
2. Second step with **bold**
3. Third step with `code`
4. Fourth step with [link](https://example.com)

### Mixed Content Lists
- Item with multiple formats: **bold**, `code`, and [link](https://example.com)
- Another item with different combinations

## Blockquotes

> This is a simple blockquote.

> This is a multi-line blockquote
> that spans multiple lines
> and should be properly formatted.

> Blockquote with **bold text** and `inline code` and [a link](https://example.com).

## Code Blocks

### JavaScript Code
```javascript
function hello(name) {
  console.log(`Hello, ${name}!`);
  return true;
}

const result = hello('World');
```

### TypeScript Code
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): User {
  return {
    id,
    name: 'John Doe',
    email: 'john@example.com'
  };
}
```

### Bash Script
```bash
#!/bin/bash

echo "Starting deployment..."
npm install
npm run build
npm test

if [ $? -eq 0 ]; then
  echo "Deployment successful!"
else
  echo "Deployment failed!"
  exit 1
fi
```

### Python Code
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(10):
    print(f"Fibonacci({i}) = {fibonacci(i)}")
```

### JSON Data
```json
{
  "name": "MarkdownRenderer",
  "version": "1.0.0",
  "features": [
    "headers",
    "lists",
    "code blocks",
    "images",
    "videos"
  ],
  "settings": {
    "darkMode": true,
    "syntaxHighlight": true
  }
}
```

### Lua Code
```lua
function greet(name)
  return "Hello, " .. name
end

local message = greet("AO Protocol")
print(message)
```

### Code Without Language
```
This is a code block
without a language specified.
It should still render properly.
```

## Complex Combined Example

# Project Documentation

This is an introduction paragraph with **bold text** and `inline code`.

## Installation

Run the following command:

```bash
npm install markdown-renderer
```

## Usage

Here's a basic example:

```javascript
import { MarkdownRenderer } from 'markdown-renderer';

function App() {
  return <MarkdownRenderer content="# Hello World" />;
}
```

## Features

The renderer supports:

1. **Headers** - H1, H2, H3
2. **Text formatting** - Bold and `inline code`
3. **Lists** - Ordered and unordered
4. **Links** - [Internal](/path) and [External](https://example.com)
5. **Images** - With lazy loading
6. **Videos** - YouTube and Vimeo embeds
7. **Code blocks** - With syntax highlighting

> **Note:** All content is sanitized with DOMPurify for XSS protection.

## Resources

- [Documentation](https://docs.example.com)
- [GitHub Repository](https://github.com/example/repo)
- [Issue Tracker](https://github.com/example/repo/issues)

## Terminal Theme Test

This component uses a terminal dark theme:
- Background: `#10151B`
- Surface: `#1a1f26`
- Text: `#e2e8f0`
- Syntax colors: cyan, purple, green

Check that all elements maintain the terminal aesthetic.

## Edge Cases

### Empty Lines

This paragraph has an empty line above.

And this one has an empty line below.


### Special Characters

Code with special chars: `const x = 5 & y`

Text with special chars: AT&T, M&M's, R&D

### Long Content

This is a very long paragraph that should wrap properly on smaller screens. It contains enough text to demonstrate responsive behavior and ensure that the text doesn't overflow the container. The terminal theme should remain consistent across all screen sizes, and hover states should work smoothly for links like [this one](https://example.com).

### Combined Inline Formatting

This paragraph has **bold with `code inside`** and also `code with **bold inside**` (though the second one may not work as expected due to parsing order).

## Accessibility Testing Checklist

Test the following manually:

1. **Keyboard Navigation**
   - Tab through all links
   - Verify focus indicators visible
   - Code block copy buttons accessible

2. **Screen Reader**
   - Alt text announced for images
   - Link purposes clear
   - Code blocks properly labeled

3. **Color Contrast**
   - Text readable against backgrounds
   - Links distinguishable
   - Syntax colors sufficient contrast

4. **Responsive Design**
   - Test at 375px (mobile)
   - Test at 768px (tablet)
   - Test at 1440px (desktop)
   - Images scale properly
   - Videos maintain aspect ratio
   - Code blocks scroll horizontally if needed

5. **Performance**
   - Images lazy load (check network tab)
   - Hover animations smooth (no jank)
   - No layout shifts on load

## Security Testing

The following should be sanitized and NOT execute:

Malicious script: <script>alert('XSS')</script>

Event handler: <div onclick="alert('XSS')">Click me</div>

JavaScript URL: [Click me](javascript:alert('XSS'))

Malicious iframe: <iframe src="https://evil.com"></iframe>

If you see any alerts or unexpected behavior, the sanitization is not working correctly!

---

**End of Test Samples**

If all features render correctly with proper terminal theme styling, the MarkdownRenderer is working as expected!
