import express from 'express';

import mongoose from 'mongoose';
import { errors } from 'celebrate';
import cors from 'cors';
import helmet from 'helmet';

import routes from './routes/index.js';
import { login, createUser } from './controllers/users.js';
import auth from './middlewares/auth.js';
import { validateLogin, validateCreateUser } from './middlewares/validation.js';
import { requestLogger, errorLogger } from './middlewares/logger.js';
import { INTERNAL_SERVER_STATUS, limiter, corsOption } from './utils/constants.js';

const { PORT = 3000, DB_URL = 'mongodb://127.0.0.1:27017/mestodb' } = process.env;

limiter();

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use(cors(corsOption));
app.use(helmet());
app.use(limiter);

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.post('/signin', validateLogin, login);
app.post('/signup', validateCreateUser, createUser);
app.use(auth, routes);

app.use(errorLogger);
app.use(errors());
app.use((err, _, res, next) => {
  const { statusCode = INTERNAL_SERVER_STATUS, message } = err;
  const errorMessage = statusCode === INTERNAL_SERVER_STATUS ? 'server error' : message;

  res.status(statusCode).json({
    message: errorMessage,
  });

  next();
});

mongoose.connect(DB_URL)
  // eslint-disable-next-line no-console
  .then(() => console.log('db ok'))
  // eslint-disable-next-line no-console
  .catch((err) => console.log('db err', err));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`apps running on port ${PORT}`);
});
