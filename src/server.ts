import fastify from 'fastify'
import dotenv from 'dotenv';
import cors from '@fastify/cors'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { SubmitForm } from './routes/submit-form';
dotenv.config();

const port = process.env.PORT
const app = fastify()
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(cors, {
  origin: '*'
})
app.register(SubmitForm)

app.listen({port:Number(port)}).then(() => {
  console.log(`Servidor rodando em http://localhost:${port}`)
})