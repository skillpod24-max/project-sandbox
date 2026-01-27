-- Create admin role type if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_permission') THEN
        CREATE TYPE public.admin_permission AS ENUM ('marketplace_admin', 'super_admin');
    END IF;
END$$;

-- Create marketplace_admins table for admin control
CREATE TABLE IF NOT EXISTS public.marketplace_admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission admin_permission NOT NULL DEFAULT 'marketplace_admin',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.marketplace_admins ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_marketplace_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.marketplace_admins
        WHERE user_id = _user_id
    )
$$;

-- RLS Policies for marketplace_admins
CREATE POLICY "Super admins can manage marketplace admins"
ON public.marketplace_admins
FOR ALL
USING (public.is_marketplace_admin(auth.uid()))
WITH CHECK (public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Anyone can check if they are admin"
ON public.marketplace_admins
FOR SELECT
USING (auth.uid() = user_id);

-- Create marketplace_moderation table for dealer/vehicle moderation
CREATE TABLE IF NOT EXISTS public.marketplace_moderation (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    target_type TEXT NOT NULL CHECK (target_type IN ('dealer', 'vehicle')),
    target_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'suspend', 'feature', 'unfeature', 'badge_update')),
    reason TEXT,
    badge_value TEXT,
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_moderation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation
CREATE POLICY "Only admins can insert moderation actions"
ON public.marketplace_moderation
FOR INSERT
WITH CHECK (public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Only admins can view moderation logs"
ON public.marketplace_moderation
FOR SELECT
USING (public.is_marketplace_admin(auth.uid()));

-- Add marketplace_status and marketplace_suspended to settings for moderation
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS marketplace_status TEXT DEFAULT 'pending' CHECK (marketplace_status IN ('pending', 'approved', 'suspended')),
ADD COLUMN IF NOT EXISTS marketplace_suspended_reason TEXT;

-- Add marketplace_status to vehicles for individual vehicle moderation
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS marketplace_status TEXT DEFAULT 'approved' CHECK (marketplace_status IN ('pending', 'approved', 'rejected', 'suspended'));