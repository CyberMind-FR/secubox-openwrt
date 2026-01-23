/**
 * PDF Embed Tag Helper
 * Syntax: 
 *   {% pdf url %}
 *   OR
 *   {% pdf url %}{% endpdf %}
 *   OR
 *   {% pdf url height %}
 * 
 * Example: 
 *   {% pdf /files/document.pdf %}
 *   {% pdf https://example.com/doc.pdf 800 %}
 *   {% pdf /files/doc.pdf %}{% endpdf %}
 */

hexo.extend.tag.register('pdf', function(args, content) {
    const pdfUrl = args[0];
    const height = args[1] || '600';
    
    if (!pdfUrl) {
        return '<p style="color: red;">Error: PDF URL is required</p>';
    }
    
    return `<div class="pdf-embed">
    <iframe 
        src="${pdfUrl}" 
        width="100%" 
        height="${height}px"
        title="PDF Document"
        frameborder="0"
        style="border: none;">
    </iframe>
    <div class="pdf-download">
        <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer">
            📄 Télécharger le PDF
        </a>
    </div>
</div>`;
}, {ends: true});

/**
 * PDF Link (alternative - just a download link)
 * Syntax: {% pdflink url "Text" %}
 */
hexo.extend.tag.register('pdflink', function(args) {
    const pdfUrl = args[0];
    const text = args.slice(1).join(' ').replace(/"/g, '') || 'Télécharger le PDF';
    
    if (!pdfUrl) {
        return '<p style="color: red;">Error: PDF URL is required</p>';
    }
    
    return `<a href="${pdfUrl}" class="pdf-download-link" target="_blank" rel="noopener noreferrer">
    📄 ${text}
</a>`;
});
