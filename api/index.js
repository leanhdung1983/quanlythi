import express from 'express';
import rateLimitPkg from 'express-rate-limit';
const rateLimit = rateLimitPkg.default || rateLimitPkg;
import { sessionMiddleware } from './core.js';

import authRouter from './routes/auth.routes.js';
import aiRouter from './routes/ai.routes.js';
import classesRouter from './routes/classes.routes.js';
import examsRouter from './routes/exams.routes.js';
import questionsRouter from './routes/questions.routes.js';
import learningRouter from './routes/learning.routes.js';
import adminRouter from './routes/admin.routes.js';
import tikzRouter from './routes/tikz.routes.js';
import tikzJobsRouter from './routes/tikzJobs.routes.js';
import socialRouter from './routes/social.routes.js';

const app = express.Router();

// General API Rate Limiter: 600 req/min
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Quá nhiều yêu cầu đến hệ thống. Vui lòng thử lại sau.' }
});

// Auth Rate Limiter (Brute-force protection): 30 req/15min
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Quá nhiều lượt đăng nhập hoặc đăng ký từ IP này. Vui lòng thử lại sau 15 phút.' }
});

// AI Rate Limiter (Gemini API quota protection): 60 req/min
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Quá nhiều yêu cầu gọi AI. Vui lòng thử lại sau giây lát.' }
});

const imageUploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skip: req => req.method !== 'POST',
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Bạn đã tải lên quá nhiều hình. Vui lòng thử lại sau.' }
});

// Apply General Rate Limiter to all /api routes
app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'private, no-store'); next(); });
app.use('/api', apiLimiter);

// Apply Session Authentication Middleware
app.use(sessionMiddleware);

// Mount Modular Sub-routers under /api
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/forgot-password', authLimiter);
app.use('/api', authRouter);
// Only AI endpoints consume the AI quota; background job polling must not.
app.use('/api/ai', aiLimiter);
app.use('/api/adaptive/generate', aiLimiter);
app.use('/api', aiRouter);
app.use('/api/images', imageUploadLimiter);
app.use('/api', classesRouter);
app.use('/api', examsRouter);
app.use('/api', questionsRouter);
app.use('/api', learningRouter);
app.use('/api', adminRouter);
app.use('/api', tikzRouter);
app.use('/api', tikzJobsRouter);
app.use('/api', socialRouter);

app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});

// Catch-all 404 handler for unmatched /api routes
app.use('/api', (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.originalUrl} không tồn tại.` });
});

export default app;
