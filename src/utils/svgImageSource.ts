/** Each image loads in its own document, isolating LaTeX glyph IDs. */
export const svgImageSource = (sanitizedSvg: string): string => {
    // Inline SVG used to tolerate missing namespaces and HTML-only dimensions.
    // A standalone image must be valid XML with a real intrinsic size/viewBox.
    let svg = sanitizedSvg.replace(/<svg\b([^>]*)>/i, (_match, attributes: string) => {
        let attrs = attributes.replace(/\s(?:width|height)\s*=\s*(['"])(?:auto|100%)\1/gi, '');
        if (!/\sxmlns\s*=/i.test(attrs)) attrs += ' xmlns="http://www.w3.org/2000/svg"';
        if (!/\sxmlns:xlink\s*=/i.test(attrs) && sanitizedSvg.includes('xlink:')) attrs += ' xmlns:xlink="http://www.w3.org/1999/xlink"';
        return `<svg${attrs}>`;
    });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
