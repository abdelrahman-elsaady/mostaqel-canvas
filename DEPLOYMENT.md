# Vercel Deployment Guide

## Quick Fix for T-Shirt Image Not Loading

### Option 1: Use a Public Image URL
Replace the local image with a hosted image:

1. Upload your `t-shirt.png` to a service like:
   - [Imgur](https://imgur.com/)
   - [Cloudinary](https://cloudinary.com/)
   - [GitHub](https://github.com/) (in a public repo)

2. Update the image path in `index.html`:
   ```javascript
   const imagePaths = [
       'https://your-image-url.com/t-shirt.png',  // Add your hosted image URL here
       './t-shirt.png',
       '/t-shirt.png',
       't-shirt.png'
   ];
   ```

### Option 2: Use Base64 Image
Convert your image to base64 and embed it directly:

1. Convert your `t-shirt.png` to base64:
   ```bash
   # On Mac/Linux
   base64 -i t-shirt.png > t-shirt-base64.txt
   
   # Or use an online converter
   ```

2. Update the image loading in `index.html`:
   ```javascript
   tshirtImg.src = 'data:image/png;base64,YOUR_BASE64_STRING_HERE';
   ```

### Option 3: Create a Public Folder
1. Create a `public` folder in your project
2. Move `t-shirt.png` to the `public` folder
3. Update the image path to `/t-shirt.png`

### Option 4: Use Vercel's Static File Serving
1. Ensure your project structure is:
   ```
   your-project/
   ├── index.html
   ├── t-shirt.png
   ├── vercel.json
   └── package.json
   ```

2. Deploy with:
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Check Browser Console
1. Open your deployed site
2. Press F12 to open developer tools
3. Check the Console tab for error messages
4. Look for image loading errors

### Verify File Structure
Make sure your Vercel deployment includes:
- ✅ `index.html`
- ✅ `t-shirt.png`
- ✅ `vercel.json`

### Common Issues
1. **File not found**: Image path is incorrect
2. **CORS error**: Using local file paths
3. **Cache issues**: Browser caching old version

## Recommended Solution
Use **Option 1** (public image URL) for the most reliable deployment. 