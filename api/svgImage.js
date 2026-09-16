import sanitizeHtml from 'sanitize-html';

export function sanitizeCompiledSvg(rawSvg) {
    if (typeof rawSvg !== 'string') return '';
    let source = rawSvg.trim();
    source = source.replace(/<\?xml[\s\S]*?\?>/i, '').trim();
    if (source.length === 0 || source.length > 2_000_000 || !/<svg\b[\s\S]*<\/svg>$/i.test(source)) return '';

    const clean = sanitizeHtml(source, {
        allowVulnerableTags: true,
        allowedTags: [
            'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
            'text', 'tspan', 'font', 'font-face', 'glyph', 'missing-glyph', 'defs', 'symbol', 'use', 'clipPath', 'clippath', 'mask', 'marker',
            'linearGradient', 'lineargradient', 'radialGradient', 'radialgradient', 'stop', 'pattern', 'title', 'desc',
            'style'
        ],
        allowedAttributes: {
            svg: ['xmlns', 'xmlns:xlink', 'width', 'height', 'viewBox', 'viewbox', 'preserveAspectRatio', 'preserveaspectratio', 'role', 'aria-label', 'version', 'class', 'style'],
            style: ['type'],
            '*': [
                'id', 'class', 'style', 'width', 'height', 'viewBox', 'preserveAspectRatio',
                'dx', 'dy', 'rotate', 'textLength', 'lengthAdjust', 'unicode', 'glyph-name',
                'horiz-adv-x', 'horiz-origin-x', 'horiz-origin-y', 'units-per-em', 'ascent', 'descent',
                'transform', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy',
                'r', 'rx', 'ry', 'points', 'fill', 'fill-opacity', 'fill-rule', 'stroke',
                'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray',
                'stroke-dashoffset', 'stroke-opacity', 'opacity', 'font-size', 'font-family',
                'font-style', 'font-weight', 'text-anchor', 'dominant-baseline', 'clip-path', 'clip-rule',
                'mask', 'marker-start', 'marker-mid', 'marker-end', 'offset', 'stop-color',
                'stop-opacity', 'gradientUnits', 'gradientunits', 'gradientTransform', 'gradienttransform', 'spreadMethod', 'spreadmethod',
                'patternUnits', 'patternunits', 'patternContentUnits', 'patterncontentunits', 'patternTransform', 'patterntransform',
                'overflow', 'visibility'
            ],
            use: ['href', 'xlink:href']
        },
        allowedStyles: {
            '*': {
                'fill': [/.*/],
                'stroke': [/.*/],
                'stroke-width': [/.*/],
                'stroke-linecap': [/.*/],
                'stroke-linejoin': [/.*/],
                'stroke-miterlimit': [/.*/],
                'stroke-dasharray': [/.*/],
                'stroke-dashoffset': [/.*/],
                'stroke-opacity': [/.*/],
                'fill-opacity': [/.*/],
                'fill-rule': [/.*/],
                'opacity': [/.*/],
                'font-size': [/.*/],
                'font-family': [/.*/],
                'font-style': [/.*/],
                'font-weight': [/.*/],
                'display': [/.*/],
                'color': [/.*/],
                'text-anchor': [/.*/],
                'dominant-baseline': [/.*/],
                'overflow': [/.*/],
                'visibility': [/.*/]
            }
        },
        allowedSchemes: [],
        allowProtocolRelative: false,
        transformTags: {
            use: (tagName, attribs) => {
                const href = attribs.href || attribs['xlink:href'];
                return { tagName, attribs: href?.startsWith('#') ? attribs : {} };
            }
        },
        parser: { lowerCaseTags: false, lowerCaseAttributeNames: false }
    }).trim();

    return clean.includes('<svg') && clean.endsWith('</svg>') ? clean : '';
}
