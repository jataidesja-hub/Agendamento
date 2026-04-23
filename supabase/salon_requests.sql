-- Tabela de solicitações de acesso ao sistema
CREATE TABLE IF NOT EXISTS public.salon_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name    TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email        TEXT NOT NULL,
  whatsapp     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','contacted','approved','rejected')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salon_requests_status  ON public.salon_requests(status);
CREATE INDEX IF NOT EXISTS idx_salon_requests_created ON public.salon_requests(created_at DESC);

CREATE TRIGGER salon_requests_updated_at
  BEFORE UPDATE ON public.salon_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.salon_requests ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode enviar uma solicitação
CREATE POLICY "salon_requests_public_insert" ON public.salon_requests
  FOR INSERT WITH CHECK (true);

-- Apenas service_role (admin) lê e atualiza
-- (sem policy de select para anon = apenas admin via service_role acessa)
