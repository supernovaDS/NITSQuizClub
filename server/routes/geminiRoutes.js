import express from 'express';
import { generateQuestion } from '../controllers/geminiController.js';

const geminiRouter = express.Router();

geminiRouter.post('/generate-question' , generateQuestion);

export default geminiRouter