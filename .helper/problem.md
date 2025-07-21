I am trying to upload a static file, I get back:

Object { id: "cmdcniy070000pg018n6v0pe2", name: "website-1753074889576", type: "static", buildStatus: "running", previewUrl: "/api/website-builder/cmdcniy070000pg018n6v0pe2/preview", fileCount: 0, files: undefined }
​
buildStatus: "running"
​
fileCount: 0
​
files: undefined
​
id: "cmdcniy070000pg018n6v0pe2"
​
name: "website-1753074889576"
​
previewUrl: "/api/website-builder/cmdcniy070000pg018n6v0pe2/preview"
​
type: "static"
​
<prototype>: Object { … }
page-e324b5403f751b2e.js:1:2976
❌ No files found in website data

Which is part of this:

const loadWebsite = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load website from API
        const websiteData = await api.websiteBuilder.getWebsite(websiteId);
        setWebsite(websiteData);
        
        console.log("📊 Website data received:", {
          id: websiteData.id,
          name: websiteData.name,
          type: websiteData.type,
          buildStatus: websiteData.buildStatus,
          previewUrl: websiteData.previewUrl,
          fileCount: websiteData.files?.length || 0,
          files: websiteData.files?.map(f => ({ name: f.name, type: f.type, size: f.content?.length || 0 }))
        });
        
        // Handle different website types
        if (websiteData.previewUrl && (websiteData.type === 'react-vite' || websiteData.type === 'react' || websiteData.type === 'vite')) {
          // For React/Vite projects, use the previewUrl from backend
          setPreviewUrl(websiteData.previewUrl);
        } else if (websiteData.files && websiteData.files.length > 0) {
          // For static sites, find any HTML file (not just index.html)
          const htmlFile = websiteData.files.find(f => 
            f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm')
          );
          
          if (htmlFile) {
            // Create a blob URL for the HTML content with proper base URL
            const htmlContent = htmlFile.content;
            
            console.log(`📄 HTML file details:`, {
              name: htmlFile.name,
              type: htmlFile.type,
              contentLength: htmlContent.length,
              contentPreview: htmlContent.substring(0, 200) + '...',
              contentEnd: htmlContent.substring(htmlContent.length - 100) + '...',
              hasDoctype: htmlContent.includes('<!DOCTYPE'),
              hasHtmlTag: htmlContent.includes('<html'),
              hasHeadTag: htmlContent.includes('<head'),
              hasBodyTag: htmlContent.includes('<body')
            });
            
            // Create a blob with the HTML content
            const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            
            console.log(`📄 HTML file found: ${htmlFile.name}`);
            console.log(`📄 HTML content length: ${htmlContent.length} characters`);
            console.log(`🌐 Preview URL created: ${url}`);
          } else {
            console.log("❌ No HTML file found in files:", websiteData.files.map(f => f.name));
            setError("No HTML file found in this website.");
          }
        } else {
          console.log("❌ No files found in website data");
          setError("No files found for this website.");
        }
      } catch (err) {
        console.error("Failed to load website:", err);
        setError("Failed to load website. Please check if the website exists and try again.");
      } finally {
        setIsLoading(false);
      }
    };

I want to know how to fix this. Seems like integration from backend to frontend are broken somewhere