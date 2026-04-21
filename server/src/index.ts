import express from "express";
import cors from "cors";
import wordsRouter from "./routes/words";
import userWordsRouter from "./routes/user-words";
import wordbooksRouter from "./routes/wordbooks";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/v1/words', wordsRouter);
app.use('/api/v1/user-words', userWordsRouter);
app.use('/api/v1/wordbooks', wordbooksRouter);


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
