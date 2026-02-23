import express from 'express';
import cors from 'cors';
// import apiRoutes from './routes/api.routes';

const app = express();

app.use(cors({origin : '*'}));
app.use(express.json());

app.use('/api/v1', apiRoutes);

app.get('/health', (_, res) => res.status(200).json({status: 'ok'}));

export default app;