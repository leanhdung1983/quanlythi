
import 'dotenv/config'; 
import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import apiRouter from './api/index.js';
import { startSocialPublisher } from './api/socialPublisher.js';
import { createServer as createViteServer } from 'vite';

async function startServer() {
    const app = express();
    // Use process.env.PORT for Render, but default to 3000 for AI Studio
    const PORT = process.env.RENDER ? process.env.PORT : (process.env.DEFAULT_APP_PORT || process.env.PORT || 3000);

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',').map(origin => origin.trim()).filter(Boolean);
    app.disable('x-powered-by');
    app.use(cors((req, callback) => {
        const origin = req.get('origin');
        let sameHost = false;
        // Browsers send Origin even for same-origin POST requests. Never reject our own host.
        try { sameHost = !!origin && new URL(origin).host === req.get('host'); }
        catch { /* Invalid Origin is rejected below. */ }
        const allowed = !origin || sameHost || allowedOrigins.includes(origin)
            || (process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0);
        if (!allowed) {
            const error = new Error('Origin not allowed');
            error.status = 403;
            return callback(error);
        }
        callback(null, { origin: true, credentials: true });
    }));
    app.use((err, req, res, next) => {
        if (err.message === 'Origin not allowed') return res.status(403).json({ error: 'Nguồn truy cập không được phép.' });
        next(err);
    });
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://tikzjax.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://tikzjax.com; font-src 'self' https://fonts.gstatic.com https://tikzjax.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.hf.space https://*.onrender.com https://kroki.io http://localhost:5000; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'");
        next();
    });
    app.use(express.json({ limit: '30mb' }));
    app.use(express.urlencoded({ extended: true, limit: '30mb' }));

    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const status = res.statusCode;
            let logType = '[INFO]';
            if (status >= 500) logType = '[ERROR]';
            else if (status >= 400) logType = '[WARN]';
            if (req.url.startsWith('/api') || status >= 400) {
                console.log(`${logType} ${req.method} ${req.originalUrl} | Status: ${status} | Time: ${duration}ms | IP: ${req.ip}`);
            }
        });
        next();
    });

    app.use('/', apiRouter);

    app.get('/api/ping', (req, res) => {
        res.json({ status: 'ok', time: new Date() });
    });

    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const rootDir = process.cwd();
        const distPath = path.join(rootDir, 'dist');
        if (fs.existsSync(distPath)) {
            app.use(express.static(distPath, { maxAge: '1y', etag: false, setHeaders: (res, filePath) => {
                if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store');
            } }));
            app.get('*', (req, res) => {
                if (req.path.startsWith('/api')) return res.status(404).json({ error: "Not Found" });
                res.setHeader('Cache-Control', 'no-store');
                res.sendFile(path.join(distPath, 'index.html'));
            });
        }
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 [SERVER] Application is running on port ${PORT}`);
        startSocialPublisher();
    });
}
startServer();
