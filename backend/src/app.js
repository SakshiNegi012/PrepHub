import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import goalRoutes from './routes/goal.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import practiceItemRoutes from './routes/practiceItem.routes.js';
import studySessionRoutes from './routes/studySession.routes.js';
import activityRoutes from './routes/activity.routes.js';
import homeRoutes from './routes/home.routes.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('PrepHUB Backend Running');
});

app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/practice-items', practiceItemRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/activities', activityRoutes);

export default app;
