/**
 * Script de setup do banco de dados Supabase
 * Executa o schema SQL completo via conexão direta PostgreSQL
 *
 * Uso: node scripts/setup-db.mjs [DATABASE_PASSWORD]
 * A senha está em: Supabase Dashboard → Settings → Database → Database password
 */

import pg from 'pg'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

const PROJECT_REF = 'rlpvwcxxckswwxjhbhih'
const PASSWORD = process.argv[2]

if (!PASSWORD) {
  console.error('\n❌ Senha do banco não informada!')
  console.error('   Uso: node scripts/setup-db.mjs SUA_SENHA_DO_BANCO')
  console.error('\n   📌 Onde encontrar: Supabase → Settings → Database → Database password')
  process.exit(1)
}

const client = new Client({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: PASSWORD,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  console.log('\n🔌 Conectando ao banco de dados Supabase...')
  await client.connect()
  console.log('✅ Conectado!')

  const schemaPath = resolve(__dirname, '../supabase/schema.sql')
  const sql = readFileSync(schemaPath, 'utf-8')

  console.log('\n🚀 Executando schema SQL...')
  await client.query(sql)
  console.log('✅ Schema criado com sucesso!')

  // Criar bucket de storage (via REST API)
  console.log('\n📦 Verificando tabelas criadas...')
  const result = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `)
  console.log('Tabelas:', result.rows.map(r => r.table_name).join(', '))

  await client.end()
  console.log('\n🎉 Setup concluído! Banco de dados pronto.')
  console.log('   Próximo passo: crie o bucket "salon-assets" no Supabase Storage.\n')
}

run().catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})
