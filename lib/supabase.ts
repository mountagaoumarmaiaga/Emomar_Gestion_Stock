import { createClient } from '@supabase/supabase-js'

// Récupération des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validation des configurations
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL et/ou clé anonyme non configurées dans les variables d\'environnement'
  )
}

// Création et exportation du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false 
  }
})