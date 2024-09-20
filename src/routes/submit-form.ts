import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { dayjs } from "../lib/dayjs";
import { sql } from '../lib/mssql';

export async function SubmitForm(app: FastifyInstance){

  app.withTypeProvider<ZodTypeProvider>().post('/submit', {
    schema:{
      body: z.object({
        fullName: z.string(),
        phone: z.string(),
        email: z.string().email(),
        address: z.object({
          cep: z.string(),
          logradouro: z.string(),
          number: z.string(),
          district: z.string(),
          city: z.string(),
          uf: z.string(),
        }),
        childs: z.array(z.object(
          {
            childName: z.string(),
            gender: z.string().length(1),
            age: z.coerce.date()
          }
        ))
      })
    }
  } ,async (request) => {
    const { fullName, phone, email, address, childs} = request.body
    try {
      if (!sql.connected) {
        await sql.connect();
      }
      const CreateClient = `
        INSERT INTO CLI_FOR (Nome, Codigo, Ordem_Pais, Tipo, Fantasia, Fisica_Juridica, Indicador_IE, Compra_parcelado_carteira, compra_cartao_debito, compra_cartao_credito, ordem_cidade, endereco, numero, cidade, bairro, estado, cep, fone_1)
        VALUES
        (
          '${fullName}',
          (SELECT Top 1 Codigo FROM Cli_For Order by Codigo Desc) + 1,
          1058,
          'C',
          ISNULL('${email}', ''),
          'F',
          9,
          1,
          1,
          1,
          ISNULL((SELECT Ordem FROM Cidades WHERE Cidade = '${address.city}'), ''),
          ISNULL('${address.logradouro}', ''),
          ISNULL(${address.number}, ''),
          ISNULL('${address.city}', ''),
          ISNULL('${address.district}', ''),
          ISNULL('${address.uf}', ''),
          ISNULL(${address.cep}, ''),
          ISNULL(${phone}, '')
        )
        `
      await sql.query(CreateClient)

      childs.map( async (child) => {
        const day = dayjs(child.age).format('D')
        const month = dayjs(child.age).format('MMM').toUpperCase().toString()
        const year = dayjs(child.age).format('YYYY')
        let CreateChilds = 
          `
            INSERT INTO CLI_FOR_CONTATOS (Ordem_Cli_For, Nome, Dia_Aniv, Mes_Aniv, Ano_Aniv, Telefone, Email, Sexo, tipo_email)
            VALUES
            (
                (SELECT ORDEM FROM Cli_For WHERE Codigo = (SELECT Top 1 Codigo FROM Cli_For Order by Codigo Desc)),
                '${child.childName}',
                '${day}',
                '${month}',
                '${year}',
                '${phone}',
                '${email}',
                '${child.gender}',
                'N'
            )
         `
        await sql.query(CreateChilds)
      })
    } catch (error) {
      console.log(error)
    }
    return request.body 
  })
}