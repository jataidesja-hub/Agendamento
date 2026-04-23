import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function isAuthorized(req: Request): boolean {
  const cookieStore = cookies()
  const secret = cookieStore.get('admin_secret')?.value
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, owner_email, owner_password, categories, whatsapp, city, state } = body

  const supabase = getAdminClient()

  // Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: owner_email,
    password: owner_password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const userId = authData.user.id
  const slug = slugify(name)

  // Criar salão
  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .insert({
      owner_id: userId,
      name,
      slug: `${slug}-${Date.now()}`.slice(0, 60),
      categories,
      whatsapp: whatsapp || null,
      city: city || null,
      state: state || null,
      is_active: true,
    })
    .select()
    .single()

  if (salonError) {
    // Rollback: deletar usuário
    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: salonError.message }, { status: 500 })
  }

  return NextResponse.json({ salon, userId })
}
