/** Each image loads in its own document, isolating LaTeX glyph IDs. */
export const svgImageSource = (sanitizedSvg: string): string =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitizedSvg)}`;
