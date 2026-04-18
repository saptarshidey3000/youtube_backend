import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// ✅ IMPORTANT: move these AFTER routes OR keep but ensure multer handles first
app.use(cookieParser());

// routes import 
import userRouter from './routes/user.routes.js';

// routes declaration
app.use('/api/v1/users', userRouter);

// ✅ body parsers AFTER routes (safe for multer)
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

export default app;