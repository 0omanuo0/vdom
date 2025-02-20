function sanitizeHTML(input) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = input;

    // Remove dangerous tags
    const dangerousTags = ["script", "iframe", "object", "embed", "link", "style"];
    dangerousTags.forEach(tag => {
        const elements = tempDiv.getElementsByTagName(tag);
        while (elements.length > 0) {
            elements[0].parentNode.removeChild(elements[0]);
        }
    });

    // Remove dangerous attributes (like onerror, javascript: URLs)
    function removeDangerousAttributes(element) {
        // check all the atributes that start with "on"
        for (let attribute of element.getAttributeNames()) {
            if (attribute.startsWith("on")) {
                element.removeAttribute(attribute);
            }
        }
        
        // Prevent JavaScript URLs
        if (element.hasAttribute("href") && element.href.startsWith("javascript:")) {
            element.removeAttribute("href");
        }

        // Check child elements recursively
        for (let child of element.children) {
            removeDangerousAttributes(child);
        }
    }
    
    removeDangerousAttributes(tempDiv);

    return tempDiv.innerHTML || tempDiv.textContent;
}

export default sanitizeHTML;

// // Example Test with nested elements
// const unsafeHTML = `
//     <div>
//         <p onmouseover="alert('Hacked!')">Hover me</p>
//         <a href="javascript:alert('Hacked!')">Click me</a>
//         <div>
//             <iframe src="x"></iframe>
//         </div>
//         <img src="x" onerror="alert('Oops!')">
//         <script>alert('Nope!')</script>
//     </div>
// `;

// console.log(sanitizeHTML(unsafeHTML));
