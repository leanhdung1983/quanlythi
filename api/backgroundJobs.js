import crypto from 'crypto';
import { pendingDuplicateSql, updateDuplicateFingerprint } from './duplicateFingerprint.js';
import { sanitizeCompiledSvg } from './svgImage.js';

/**
 * Background jobs processor for duplicate question scanning and TikZ rendering.
 * @param {import('mysql2/promise').Pool} pool
 * @param {Function} query
 * @param {Function} [sanitizeSvg]
 */
export async function processBackgroundJobs(pool, query, sanitizeSvg = sanitizeCompiledSvg) {
    try {
        if (!pool) return;
        
        try {
            const conn = await pool.getConnection();
            conn.release();
        } catch (connErr) {
            if (Math.random() < 0.1) { 
                console.warn("[JOB] Skipping background jobs: Database unreachable.", connErr.message);
            }
            return;
        }

        const [jobs] = await pool.query("SELECT * FROM background_jobs WHERE status = 'PENDING' LIMIT 1");
        if (jobs.length === 0) return;

        const job = jobs[0];
        await pool.query("UPDATE background_jobs SET status = 'PROCESSING', updated_at = NOW() WHERE id = ?", [job.id]);

        console.log(`[JOB] Processing job ${job.id} (${job.job_type})...`);

        try {
            if (job.job_type === 'DUPLICATE_SCAN') {
                const [{ total }] = await query(`SELECT COUNT(*) as total FROM questions WHERE ${pendingDuplicateSql}`);
                const totalUnchecked = total || 0;
                let processed = 0;
                let hasMore = true;

                if (totalUnchecked === 0) {
                    await query("UPDATE background_jobs SET status = 'COMPLETED', progress = 100, result_data = ? WHERE id = ?", [
                        JSON.stringify({ 
                            message: `Dá»¯ liá»‡u Ä‘Ã£ Ä‘Æ°á»£c bÄƒm. KhÃ´ng cÃ³ cÃ¢u há»i má»›i cáº§n quÃ©t.`, 
                            processed_new: 0
                        }), 
                        job.id
                    ]);
                    return;
                }

                while (hasMore) {
                    const unchecked = await query(`SELECT id, content_latex, content_latex_original FROM questions WHERE ${pendingDuplicateSql} ORDER BY id LIMIT 200`);
                    if (unchecked.length === 0) {
                        hasMore = false;
                        break;
                    }

                    for (const q of unchecked) {
                        processed += await updateDuplicateFingerprint(query, q);
                    }

                    const progress = Math.min(99, Math.floor((processed / totalUnchecked) * 100));
                    await query("UPDATE background_jobs SET progress = ? WHERE id = ?", [progress, job.id]);
                }

                await query("UPDATE background_jobs SET status = 'COMPLETED', progress = 100, result_data = ? WHERE id = ?", [
                    JSON.stringify({ 
                        message: `HoÃ n táº¥t kiá»ƒm tra bÄƒm. ÄÃ£ quÃ©t ${processed} cÃ¢u há»i má»›i.`, 
                        processed_new: processed
                    }), 
                    job.id
                ]);
            } else if (job.job_type === 'TIKZ_RENDER_DISABLED') {
                const questions = await query("SELECT id, content_latex, content_latex_original FROM questions WHERE (content_latex LIKE '%tikzpicture%' OR content_latex LIKE '%tkz-tab%' OR content_latex LIKE '%tkz-euclide%') AND is_tikz_rendered = 0");
                let processed = 0;
                let rendered = 0;
                let skipped = 0;
                let failed = 0;

                const tikzRegex = /(\\begin\s*\{\s*(tikzpicture|tkz-tab|tkz-euclide)\s*\}(?:\[[\s\S]*?\])?(?:\{[\s\S]*?\})?[\s\S]*?\\end\s*\{\s*(tikzpicture|tkz-tab|tkz-euclide)\s*\})/gi;
                const HF_SERVER = 'https://leanhdung1983-tikz-renderer.hf.space/render';

                if (HF_SERVER.includes('hf.space')) {
                    const baseUrl = HF_SERVER.replace(/\/render\/?$/, '');
                    fetch(baseUrl).catch(() => {});
                }

                for (const q of questions) {
                    if (!q.content_latex_original) {
                        await pool.query("UPDATE questions SET content_latex_original = ? WHERE id = ?", [q.content_latex, q.id]);
                    }

                    let updatedContent = q.content_latex;
                    const matches = q.content_latex.match(tikzRegex);
                    
                    if (matches) {
                        for (const tikzCode of matches) {
                            const hash = crypto.createHash('sha256').update(tikzCode).digest('hex');
                            const [existing] = await pool.query("SELECT id FROM question_images WHERE tikz_hash = ?", [hash]);
                            
                            let success = false;
                            if (existing.length > 0) {
                                skipped++;
                                success = true;
                            } else {
                                let payload = tikzCode;
                                if (!tikzCode.trim().startsWith('\\documentclass')) {
                                    const isTextMode = tikzCode.includes('\\begin{ex}') || 
                                                     tikzCode.includes('\\begin{bt}') || 
                                                     tikzCode.includes('\\begin{vd}') ||
                                                     tikzCode.includes('\\loigiai') ||
                                                     tikzCode.includes('\\choice');
                                    
                                    const preamble = `\\usepackage[utf8]{vietnam}
\\usepackage{amsmath,amssymb,mathrsfs,fancyhdr,enumerate,multirow,makecell,currfile,fontawesome,twemojis}
\\usepackage{tikz,tkz-tab,tkz-euclide,tikz-3dplot}
\\usetikzlibrary{arrows,calc,intersections,angles,snakes,quotes,backgrounds,shapes.geometric,patterns,shadings,positioning}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.9}
\\usepgfplotslibrary{fillbetween}

% Custom commands for VN Math
\\providecommand{\\hoac}[1]{\\left[\\begin{aligned}#1\\end{aligned}\\right.}
\\providecommand{\\heva}[1]{\\left\\{\\begin{aligned}#1\\end{aligned}\\right.}
\\providecommand{\\shortans}[1]{\\textbf{ÄÃ¡p sá»‘: }#1}
\\providecommand{\\immini}[3][]{%
  \\noindent\\begin{minipage}[t]{0.65\\linewidth}%
    #2
  \\end{minipage}%
  \\hfill%
  \\begin{minipage}[t]{0.30\\linewidth}%
    \\centering
    #3
  \\end{minipage}%
}
`;
                                    if (isTextMode) {
                                        const fullPreamble = `${preamble}\\usepackage[dethi]{ex_test}\n`;
                                        payload = `\\documentclass[14pt,border=5pt,varwidth=600pt]{standalone}\n${fullPreamble}\n\\begin{document}\n${tikzCode}\n\\end{document}`;
                                    } else {
                                        const adjustedCode = tikzCode.replace(/scale=\.8/g, 'scale=1');
                                        payload = `\\documentclass[14pt,tikz,border=5pt]{standalone}\n${preamble}\n\\begin{document}\n${adjustedCode}\n\\end{document}`;
                                    }
                                }

                                let attempts = 0;
                                const maxAttempts = 3;
                                
                                while (!success && attempts < maxAttempts) {
                                    try {
                                        const response = await fetch(HF_SERVER, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'text/plain' },
                                            body: payload
                                        });

                                        if (response.ok) {
                                            let svg = await response.text();
                                            if (svg && svg.includes('<svg')) {
                                                svg = svg.replace(/width="[\d\.]+(pt|px|cm|in)"/i, 'width="100%"');
                                                svg = svg.replace(/height="[\d\.]+(pt|px|cm|in)"/i, 'height="auto"');
                                                const cleanSvg = sanitizeSvg(svg);
                                                if (!cleanSvg) throw new Error('SVG renderer tráº£ vá» ná»™i dung khÃ´ng an toÃ n.');

                                                await pool.query("INSERT IGNORE INTO question_images (tikz_hash, svg_content) VALUES (?, ?)", [hash, cleanSvg]);
                                                rendered++;
                                                success = true;
                                            }
                                        } else if (response.status === 503 || response.status === 504) {
                                            await new Promise(r => setTimeout(r, 5000));
                                        }
                                    } catch (err) {
                                        console.error(`[JOB] Render attempt ${attempts + 1} failed:`, err.message);
                                    }
                                    attempts++;
                                    if (!success && attempts < maxAttempts) {
                                        await new Promise(r => setTimeout(r, 2000));
                                    }
                                }
                            }

                            if (success) {
                                updatedContent = updatedContent.split(tikzCode).join(`[TIKZ_HASH:${hash}]`);
                            } else {
                                failed++;
                            }
                            
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                        
                        await pool.query("UPDATE questions SET content_latex = ?, is_tikz_rendered = 1 WHERE id = ?", [updatedContent, q.id]);
                    } else {
                        await pool.query("UPDATE questions SET is_tikz_rendered = 2 WHERE id = ?", [q.id]);
                    }
                    
                    processed++;
                    if (processed % 5 === 0 || processed === questions.length) {
                        const progress = Math.floor((processed / questions.length) * 100);
                        await query("UPDATE background_jobs SET progress = ? WHERE id = ?", [progress, job.id]);
                    }
                }

                await query("UPDATE background_jobs SET status = 'COMPLETED', progress = 100, result_data = ? WHERE id = ?", [
                    JSON.stringify({ 
                        message: `Render hoÃ n táº¥t. ÄÃ£ xá»­ lÃ½ ${processed} cÃ¢u. Render má»›i: ${rendered}. Bá» qua (Ä‘Ã£ cÃ³): ${skipped}. Lá»—i: ${failed}.`,
                        processed,
                        rendered,
                        skipped,
                        failed
                    }), 
                    job.id
                ]);
            } else {
                await pool.query("UPDATE background_jobs SET status = 'COMPLETED', progress = 100 WHERE id = ?", [job.id]);
            }
        } catch (err) {
            await pool.query("UPDATE background_jobs SET status = 'FAILED', error_message = ? WHERE id = ?", [err.message, job.id]);
        }
    } catch (e) {
        console.error("Job Processor Error:", e.message);
    }
}
