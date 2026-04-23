-- ============================================================
-- SISTEMA DE AGENDAMENTOS — Schema Supabase
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- busca por texto

-- ============================================================
-- TABELA: salons (um registro por tenant/salão)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.salons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  logo_url         TEXT,
  primary_color    TEXT NOT NULL DEFAULT '#d946ef',
  secondary_color  TEXT NOT NULL DEFAULT '#a21caf',
  categories       TEXT[] NOT NULL DEFAULT '{}',
  whatsapp         TEXT,
  instagram        TEXT,
  phone            TEXT,
  email            TEXT,
  address          TEXT,
  city             TEXT,
  state            TEXT,
  zip_code         TEXT,
  lat              DECIMAL(10, 8),
  lng              DECIMAL(11, 8),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_salons_owner_id  ON public.salons(owner_id);
CREATE INDEX idx_salons_slug      ON public.salons(slug);
CREATE INDEX idx_salons_is_active ON public.salons(is_active);
CREATE INDEX idx_salons_name_trgm ON public.salons USING GIN(name gin_trgm_ops);

-- ============================================================
-- TABELA: services (serviços oferecidos por cada salão)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id          UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  price             DECIMAL(10, 2) NOT NULL DEFAULT 0,
  duration_minutes  INTEGER NOT NULL DEFAULT 60,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  order_index       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_salon_id  ON public.services(salon_id);
CREATE INDEX idx_services_is_active ON public.services(is_active);
CREATE INDEX idx_services_order     ON public.services(salon_id, order_index);

-- ============================================================
-- TABELA: schedules (agenda semanal por dia da semana)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schedules (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id                UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  day_of_week             SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dom, 1=Seg...6=Sab
  is_open                 BOOLEAN NOT NULL DEFAULT false,
  open_time               TIME,
  close_time              TIME,
  break_start             TIME,
  break_end               TIME,
  slot_interval_minutes   INTEGER NOT NULL DEFAULT 30,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(salon_id, day_of_week)
);

CREATE INDEX idx_schedules_salon_id ON public.schedules(salon_id);

-- ============================================================
-- TABELA: blocked_dates (datas bloqueadas: feriados, férias)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id   UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(salon_id, date)
);

CREATE INDEX idx_blocked_dates_salon_id ON public.blocked_dates(salon_id);
CREATE INDEX idx_blocked_dates_date     ON public.blocked_dates(date);

-- ============================================================
-- TABELA: appointments (agendamentos dos clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id           UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id         UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  client_name        TEXT NOT NULL,
  client_whatsapp    TEXT NOT NULL,
  appointment_date   DATE NOT NULL,
  appointment_time   TIME NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_salon_id         ON public.appointments(salon_id);
CREATE INDEX idx_appointments_service_id       ON public.appointments(service_id);
CREATE INDEX idx_appointments_date             ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status           ON public.appointments(status);
CREATE INDEX idx_appointments_salon_date       ON public.appointments(salon_id, appointment_date);
CREATE INDEX idx_appointments_client_whatsapp  ON public.appointments(client_whatsapp);

-- ============================================================
-- TABELA: push_subscriptions (assinaturas Web Push do dono)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id    UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(salon_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_salon_id ON public.push_subscriptions(salon_id);

-- ============================================================
-- TABELA: activity_logs (logs de atividade para o superadmin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id    UUID REFERENCES public.salons(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity      TEXT,
  entity_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_salon_id  ON public.activity_logs(salon_id);
CREATE INDEX idx_activity_logs_user_id   ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created   ON public.activity_logs(created_at DESC);

-- ============================================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at
CREATE TRIGGER salons_updated_at
  BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNÇÃO: criar agenda padrão ao criar um salão
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_default_schedule()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.schedules (salon_id, day_of_week, is_open, open_time, close_time, slot_interval_minutes)
  VALUES
    (NEW.id, 0, false, '09:00', '18:00', 30), -- Domingo
    (NEW.id, 1, true,  '09:00', '18:00', 30), -- Segunda
    (NEW.id, 2, true,  '09:00', '18:00', 30), -- Terça
    (NEW.id, 3, true,  '09:00', '18:00', 30), -- Quarta
    (NEW.id, 4, true,  '09:00', '18:00', 30), -- Quinta
    (NEW.id, 5, true,  '09:00', '18:00', 30), -- Sexta
    (NEW.id, 6, true,  '09:00', '14:00', 30); -- Sábado
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_salon_created
  AFTER INSERT ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.create_default_schedule();

-- ============================================================
-- FUNÇÃO: gerar slug único a partir do nome
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_unique_slug(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter   INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(
    translate(p_name,
      'áàâãäéèêëíìîïóòôõöúùûüýÿçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÝÇÑ',
      'aaaааeeeeiiiioooouuuuycnAAAAEEEEIIIIOOOOUUUUYCN'
    ),
    '[^a-z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM public.salons WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY — Habilitar em todas as tabelas
-- ============================================================
ALTER TABLE public.salons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS RLS: salons
-- ============================================================

-- Público lê salões ativos
CREATE POLICY "salons_public_read" ON public.salons
  FOR SELECT USING (is_active = true);

-- Dono lê e edita apenas seu salão
CREATE POLICY "salons_owner_read" ON public.salons
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "salons_owner_update" ON public.salons
  FOR UPDATE USING (owner_id = auth.uid());

-- ============================================================
-- POLÍTICAS RLS: services
-- ============================================================

-- Público lê serviços de salões ativos
CREATE POLICY "services_public_read" ON public.services
  FOR SELECT USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.salons
      WHERE id = services.salon_id AND is_active = true
    )
  );

-- Dono gerencia seus serviços
CREATE POLICY "services_owner_all" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE id = services.salon_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- POLÍTICAS RLS: schedules
-- ============================================================

-- Público lê horários de salões ativos
CREATE POLICY "schedules_public_read" ON public.schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE id = schedules.salon_id AND is_active = true
    )
  );

-- Dono gerencia seus horários
CREATE POLICY "schedules_owner_all" ON public.schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE id = schedules.salon_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- POLÍTICAS RLS: blocked_dates
-- ============================================================

-- Público lê datas bloqueadas de salões ativos
CREATE POLICY "blocked_dates_public_read" ON public.blocked_dates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE id = blocked_dates.salon_id AND is_active = true
    )
  );

-- Dono gerencia suas datas bloqueadas
CREATE POLICY "blocked_dates_owner_all" ON public.blocked_dates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE id = blocked_dates.salon_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- POLÍTICAS RLS: appointments
-- ============================================================

-- Qualquer pessoa pode inserir agendamento (anon cria, não lê)
CREATE POLICY "appointments_public_insert" ON public.appointments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE id = appointments.salon_id AND is_active = true
    )
  );

-- Dono lê e atualiza agendamentos do seu salão
CREATE POLICY "appointments_owner_all" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE id = appointments.salon_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- POLÍTICAS RLS: push_subscriptions
-- ============================================================

CREATE POLICY "push_subscriptions_owner_all" ON public.push_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE id = push_subscriptions.salon_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- POLÍTICAS RLS: activity_logs
-- ============================================================

-- Apenas service_role pode inserir logs (via API do servidor)
CREATE POLICY "activity_logs_owner_read" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE id = activity_logs.salon_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- VIEWS úteis para o superadmin (acessa via service_role)
-- ============================================================

CREATE OR REPLACE VIEW public.admin_salons_overview AS
SELECT
  s.id,
  s.name,
  s.slug,
  s.is_active,
  s.categories,
  s.city,
  s.state,
  s.created_at,
  u.email AS owner_email,
  COUNT(DISTINCT a.id) AS total_appointments,
  COUNT(DISTINCT sv.id) AS total_services,
  MAX(a.created_at) AS last_appointment_at
FROM public.salons s
LEFT JOIN auth.users u ON u.id = s.owner_id
LEFT JOIN public.appointments a ON a.salon_id = s.id
LEFT JOIN public.services sv ON sv.salon_id = s.id
GROUP BY s.id, u.email;

-- ============================================================
-- DADOS SEED: apenas para ambiente de desenvolvimento
-- Comente em produção
-- ============================================================
-- INSERT INTO public.salons (owner_id, name, slug, description, primary_color, secondary_color, categories, whatsapp)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Salão Demo', 'salao-demo', 'Salão de demonstração', '#d946ef', '#a21caf', ARRAY['barbearia'], '5511999999999');
