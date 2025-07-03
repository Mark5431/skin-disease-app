# Floating Chatbot with Qwen LLM Integration

This implementation adds a floating AI chatbot to your Next.js web application using Qwen LLM via the OpenAI-compatible API.

## Features

- **Floating Widget**: Chat bubble in bottom-right corner that expands into a full chat interface
- **Qwen LLM Integration**: Uses Qwen via OpenAI-compatible API for intelligent responses
- **Session-based Conversations**: Maintains conversation history during the session
- **Responsive Design**: Works on both desktop and mobile devices
- **Conditional Display**: Automatically hidden on login/signup pages
- **Modern UI**: Beautiful gradient design with smooth animations
- **Error Handling**: Graceful fallbacks when API is unavailable

## Files Added/Modified

### New Components
- `src/app/components/FloatingChatbot.js` - Main chatbot component
- `src/app/components/FloatingChatbot.module.css` - Chatbot styling

### API Routes
- `src/app/api/chat/route.js` - Backend API for Qwen integration

### Configuration
- `.env.example` - Environment variables template
- `setup-chatbot.bat` / `setup-chatbot.sh` - Setup scripts

### Modified Files
- `src/app/layout.js` - Added chatbot to global layout

## Setup Instructions

### 1. Quick Setup (Windows)
```powershell
.\setup-chatbot.bat
```

### 2. Manual Setup

1. **Install Dependencies** (if needed):
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Qwen API key:
   ```env
   QWEN_API_KEY=your-actual-api-key-here
   ```

3. **Get Qwen API Key**:
   - Visit [Dashscope Console](https://dashscope.console.aliyun.com/)
   - Create an account/login
   - Generate an API key
   - Add it to your `.env.local` file

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Usage

### For Users
1. **Open Chat**: Click the floating chat bubble in the bottom-right corner
2. **Send Messages**: Type your message and press Enter or click the send button
3. **View History**: Scroll through your conversation history
4. **Close Chat**: Click the X button in the chat header

### For Developers

#### Customizing the Chatbot
The chatbot component accepts several customization options through the CSS variables:

```css
/* In your global CSS or component styles */
:root {
  --chatbot-primary-color: #667eea;
  --chatbot-secondary-color: #764ba2;
  --chatbot-text-color: #333;
  --chatbot-background: #f8f9fa;
}
```

#### Hiding on Specific Pages
Modify the `hiddenPaths` array in `FloatingChatbot.js`:

```javascript
const hiddenPaths = ['/login', '/sign-up', '/admin', '/other-page'];
```

#### Customizing System Prompt
Edit the system message in `src/app/api/chat/route.js`:

```javascript
{
  role: 'system',
  content: 'Your custom system prompt here...'
}
```

## API Configuration

### Qwen Models Available
- `qwen-turbo` (default) - Fast responses, good for general chat
- `qwen-plus` - More capable, better reasoning
- `qwen-max` - Most capable, best quality responses

Change the model in `src/app/api/chat/route.js`:

```javascript
body: JSON.stringify({
  model: 'qwen-plus', // Change this
  messages: messages,
  temperature: 0.7,
  max_tokens: 500,
  top_p: 0.9,
}),
```

### API Parameters
- **temperature**: Controls randomness (0.0-2.0, default: 0.7)
- **max_tokens**: Maximum response length (default: 500)
- **top_p**: Nucleus sampling parameter (0.0-1.0, default: 0.9)

## Troubleshooting

### Common Issues

1. **Chatbot doesn't appear**:
   - Check that `FloatingChatbot` is imported in `layout.js`
   - Verify you're not on a hidden path (login/signup)
   - Check browser console for errors

2. **API errors**:
   - Verify your Qwen API key is correct
   - Check your internet connection
   - Ensure you have credits in your Dashscope account

3. **Styling issues**:
   - Clear your browser cache
   - Check that CSS modules are properly imported
   - Verify no conflicting CSS rules

### Development Mode

To enable debug mode, add this to your `.env.local`:
```env
NODE_ENV=development
```

This will log API requests and responses to the console.

## Performance Considerations

- **Conversation History**: Limited to last 10 messages to avoid token limits
- **Caching**: Responses are not cached (add Redis for production)
- **Rate Limiting**: Not implemented (consider adding for production)

## Security Notes

- API key is server-side only (not exposed to client)
- Input validation on both client and server
- CORS headers configured for security
- Consider adding rate limiting for production use

## Future Enhancements

- [ ] Add conversation persistence (database)
- [ ] Implement typing indicators
- [ ] Add file upload support
- [ ] Voice message support
- [ ] Multi-language support
- [ ] Admin dashboard for chat analytics
- [ ] Integration with user authentication
- [ ] Custom bot personality settings

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify your Qwen API key and credits
3. Ensure all environment variables are set correctly
4. Check that the development server is running on the correct port
