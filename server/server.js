import 'dotenv/config';
import prisma from '../prisma/client.js'; 
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser'; 

import notificationRoutes from './routes/notifications.js'; 
import articleRoutes from './routes/articles.js'; 
import authRoutes from './routes/auth.js';
import commentRoutes from './routes/comments.js';
import oauthRoutes from './routes/oauth.js'; 

const app = express();
const port = 5000; 


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use('/uploads', express.static('uploads')); 
app.use('/uploads/avatars', express.static('uploads/avatars'));
app.use(bodyParser.json());


app.use('/api/articles', articleRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/oauth', oauthRoutes); // НОВОЕ


app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  try {
    const newCategory = await prisma.category.create({
      data: {
        name: name,
      },
    });
    res.status(201).json(newCategory);
  } catch (error) {
    if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Category with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create category', details: error.message });
  }
});


app.get('/api/status', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', db: 'Connected to MySQL via Prisma' });
  } catch (error) {
    console.error('DB Connection Failed:', error);
    res.status(500).json({ status: 'Error', db: 'Connection failed' });
  }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Cookie-based authentication enabled ✓');
    console.log('OAuth (Google & GitHub) enabled ✓'); // НОВОЕ

});