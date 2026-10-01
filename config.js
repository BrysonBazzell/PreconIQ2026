// Fill these in from Supabase: Project Settings → API.
// The anon (public) key is safe to put here: row-level security in
// supabase/schema.sql decides what each login can see and change.
// Never put the service_role key in this file.
//
// There is ONE Supabase project and ONE copy of this site for every
// customer. Each company's name, logo and colors are stored in the
// database and set by that company on Team → Company & look.
window.BID_PIPELINE_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT-ID.supabase.co",
  supabaseAnonKey: "YOUR-ANON-KEY",

  appName: "Preconiq",           // the product's name: browser tab, home page, sign-in screen

  // Where customers reach you. Shown on the home page and on the
  // "your trial has ended" screen. Leave "" to hide it.
  supportEmail: "",

  // Preconiq's own look: the home page, the sign-in screens, and the
  // starting colors for every new company until they pick their own.
  brand: {
    primary: "#2F6DA8",          // main color: buttons, highlights, progress
    topBar: "#1F3247"            // top menu bar and home page background
  }
};
