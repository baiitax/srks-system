const { createClient } = require('@supabase/supabase-js');

function loadEnvFromProcess() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in process env');
  }

  return { url, serviceKey };
}

async function main() {
  const { url, serviceKey } = loadEnvFromProcess();
  const supabase = createClient(url, serviceKey);

  const usersRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (usersRes.error) {
    throw new Error(`auth.listUsers error: ${usersRes.error.message}`);
  }

  const profileRes = await supabase
    .from('users_profiles')
    .select('id, role, email')
    .limit(500);

  if (profileRes.error) {
    throw new Error(`users_profiles select error: ${profileRes.error.message}`);
  }

  const users = usersRes.data.users || [];
  const profiles = profileRes.data || [];
  const profileIds = new Set(profiles.map((profile) => profile.id));

  const missing = users
    .filter((user) => !profileIds.has(user.id))
    .map((user) => ({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
    }));

  console.log(`AUTH_USERS=${users.length}`);
  console.log(`PROFILE_ROWS=${profiles.length}`);
  console.log(`MISSING_PROFILE_ROWS=${missing.length}`);
  console.log(JSON.stringify(missing, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
