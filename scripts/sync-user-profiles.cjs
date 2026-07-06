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

function resolveRole(user) {
  const candidates = [
    user?.user_metadata?.role,
    user?.app_metadata?.role,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const normalized = candidate.toLowerCase();
      if (normalized === 'admin' || normalized === 'agent') {
        return normalized;
      }
    }
  }

  return 'agent';
}

async function main() {
  const envPath = path.join(process.cwd(), '.env.local');
  loadEnvFile(envPath);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const usersRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (usersRes.error) {
    throw new Error(`auth.listUsers failed: ${usersRes.error.message}`);
  }

  const authUsers = usersRes.data.users || [];

  const profileRes = await supabase.from('users_profiles').select('id, role').limit(1000);
  if (profileRes.error) {
    throw new Error(`users_profiles read failed: ${profileRes.error.message}`);
  }

  const profiles = profileRes.data || [];
  const profileIds = new Set(profiles.map((profile) => profile.id));

  const missingUsers = authUsers.filter((user) => !profileIds.has(user.id));

  console.log(`AUTH_USERS=${authUsers.length}`);
  console.log(`PROFILE_ROWS=${profiles.length}`);
  console.log(`MISSING_PROFILE_ROWS=${missingUsers.length}`);

  if (missingUsers.length === 0) {
    console.log('No missing users_profiles rows found.');
    return;
  }

  const rowsToInsert = missingUsers.map((user) => ({
    id: user.id,
    full_name:
      (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
      'SRKS User',
    role: resolveRole(user),
  }));

  console.log('Preparing to insert rows:');
  console.log(JSON.stringify(rowsToInsert, null, 2));

  const insertRes = await supabase.from('users_profiles').insert(rowsToInsert);
  if (insertRes.error) {
    throw new Error(`users_profiles insert failed: ${insertRes.error.message}`);
  }

  console.log(`Inserted ${rowsToInsert.length} users_profiles row(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
