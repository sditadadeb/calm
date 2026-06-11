-- Columnas requeridas por integración occidente-grabaciones y scoping de vendedores.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'transcriptions' AND column_name = 's3_base_key'
    ) THEN
        ALTER TABLE public.transcriptions ADD COLUMN s3_base_key VARCHAR(512);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'seller_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN seller_id BIGINT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'seller_name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN seller_name VARCHAR(255);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'transcriptions' AND column_name = 'recording_id'
          AND (character_maximum_length IS NULL OR character_maximum_length < 120)
    ) THEN
        ALTER TABLE public.transcriptions ALTER COLUMN recording_id TYPE VARCHAR(255);
    END IF;
END $$;
