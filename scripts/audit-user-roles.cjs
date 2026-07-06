const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
    process.env[key] = value;
  }
}

async function main() {
  loadEnvFile(path.join(process.cwd(), '.env.local'));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const usersRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (usersRes.error) throw new Error(usersRes.error.message);

  const profilesRes = await supabase.from('users_profiles').select('*').limit(1000);
  if (profilesRes.error) throw new Error(profilesRes.error.message);

  const users = usersRes.data.users || [];
  const profiles = profilesRes.data || [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const report = users.map((user) => {
    const profile = profileMap.get(user.id) || null;
    return {
      id: user.id,
      email: user.email,
      auth_role_hint: user.user_metadata?.role || user.app_metadata?.role || null,
      profile_exists: Boolean(profile),
      profile_role: profile?.role ?? null,
      profile_raw: profile,
    };
  });

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
