-- ============================================================================
-- SCRIPT DE CONFIGURACIÓN DE SUPABASE PARA RIVER-STRID
-- Ejecuta este script en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

-- 1. Crear tabla de perfiles de jugadores (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS players (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de partidas guardadas
CREATE TABLE IF NOT EXISTS saves (
  id BIGSERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  
  -- Estado del juego
  chapter INT DEFAULT 1 CHECK (chapter >= 1 AND chapter <= 10),
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  character TEXT DEFAULT 'lucas' CHECK (character IN ('lucas', 'sofia')),
  sensitivity FLOAT DEFAULT 0 CHECK (sensitivity >= 0 AND sensitivity <= 100),
  
  -- Datos JSON flexibles para inventario y estado de interactivos
  inventory JSONB DEFAULT '[]'::jsonb,
  interactables_state JSONB DEFAULT '{}'::jsonb,
  
  -- Métricas
  playtime_sec INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índice para búsqueda rápida por usuario
  CONSTRAINT unique_player_save UNIQUE (player_id)
);

-- 3. Habilitar Row Level Security (RLS) para protección de datos
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad: cada usuario solo accede a SUS datos
-- Players: solo el dueño puede leer/escribir su perfil
CREATE POLICY "Users can manage own profile" ON players
  FOR ALL 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Saves: solo el creador puede gestionar su partida
CREATE POLICY "Users can manage own saves" ON saves
  FOR ALL 
  USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

-- 5. Trigger: crear perfil automáticamente al registrarse en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.players (id, username)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data->>'username', 
      'player_' || substring(md5(random()::text), 1, 8)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Trigger: actualizar updated_at automáticamente al modificar un save
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_saves_updated_at ON saves;
CREATE TRIGGER update_saves_updated_at
  BEFORE UPDATE ON saves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_saves_player_id ON saves(player_id);
CREATE INDEX IF NOT EXISTS idx_saves_updated_at ON saves(updated_at DESC);

-- ============================================================================
-- CONFIGURACIÓN ADICIONAL RECOMENDADA (en Supabase Dashboard → Authentication)
-- ============================================================================
-- 1. Settings → Authentication → URL Configuration:
--    - Site URL: https://tudominio.com (o http://localhost:3000 para desarrollo)
--    - Redirect URLs: Añadir tu dominio y http://localhost:* para testing
--
-- 2. Settings → Authentication → Email Templates:
--    - Personalizar el email de confirmación con el nombre del juego
--
-- 3. Settings → Database → Connection Pooling:
--    - Habilitar si esperas muchos usuarios concurrentes
--
-- 4. Settings → API:
--    - Copiar 'Project URL' y 'anon' public key para js/config/env.js
--    - ¡NUNCA uses la clave 'service_role' en el frontend!
-- ============================================================================
