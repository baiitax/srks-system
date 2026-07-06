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

async function ensureUser(adminClient, userDef) {
  const listRes = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listRes.error) {
    throw new Error(`auth.listUsers failed: ${listRes.error.message}`);
  }

  const existing = (listRes.data.users || []).find(
    (user) => (user.email || '').toLowerCase() === userDef.email.toLowerCase()
  );

  if (existing) {
    const updateRes = await adminClient.auth.admin.updateUserById(existing.id, {
      password: userDef.password,
      email_confirm: true,
      user_metadata: {
        full_name: userDef.full_name,
        role: userDef.role,
      },
      app_metadata: {
        role: userDef.role,
      },
    });

    if (updateRes.error) {
      throw new Error(`updateUserById failed for ${userDef.email}: ${updateRes.error.message}`);
    }

    return updateRes.data.user;
  }

  const createRes = await adminClient.auth.admin.createUser({
    email: userDef.email,
    password: userDef.password,
    email_confirm: true,
    user_metadata: {
      full_name: userDef.full_name,
      role: userDef.role,
    },
    app_metadata: {
      role: userDef.role,
    },
  });

  if (createRes.error) {
    throw new Error(`createUser failed for ${userDef.email}: ${createRes.error.message}`);
  }

  return createRes.data.user;
}

async function main() {
  loadEnvFile(path.join(process.cwd(), '.env.local'));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const testUsers = [
    {
      email: 'admin@company.com',
      password: 'Admin@12345',
      role: 'admin',
      full_name: 'SRKS Admin Test User',
    },
    {
      email: 'manager@company.com',
      password: 'Manager@12345',
      role: 'manager',
      full_name: 'SRKS Manager Test User',
    },
    {
      email: 'agent@company.com',
      password: 'Agent@12345',
      role: 'agent',
      full_name: 'SRKS Agent Test User',
    },
  ];

  const createdUsers = [];
  for (const testUser of testUsers) {
    const user = await ensureUser(supabase, testUser);
    createdUsers.push({ ...testUser, id: user.id });
  }

  const profileRows = createdUsers.map((user) => ({
    id: user.id,
    role: user.role === 'manager' ? 'admin' : user.role,
    full_name: user.full_name,
    updated_at: new Date().toISOString(),
  }));

  const upsertProfilesRes = await supabase
    .from('users_profiles')
    .upsert(profileRows, { onConflict: 'id' });

  if (upsertProfilesRes.error) {
    throw new Error(`users_profiles upsert failed: ${upsertProfilesRes.error.message}`);
  }

  async function optionalUpsert(table, rows, onConflict) {
    const response = await supabase.from(table).upsert(rows, { onConflict });
    if (response.error) {
      console.warn(`Optional seed skipped for ${table}: ${response.error.message}`);
      return false;
    }
    return true;
  }

  await optionalUpsert(
    'customers',
    [
      {
        company_name: 'Dangote Cement - Obajana Plant',
        delivery_address_default: 'Obajana, Kogi State, Nigeria',
      },
    ],
    'company_name'
  );

  await optionalUpsert(
    'vendors',
    [
      {
        company_name: 'Prime Industrial Supplies Ltd',
      },
    ],
    'company_name'
  );

  await optionalUpsert(
    'third_party_logistics',
    [
      {
        company_name: 'Trusted Haulage Logistics',
      },
    ],
    'company_name'
  );

  await optionalUpsert(
    'products',
    [
      {
        name: 'Granulated Urea',
        sku: 'PROD-TEST-001',
        category: 'raw_materials',
        uom: 'metric_tons',
        size_spec: 'Purity > 88%',
        packaging_type: 'bulk',
        default_currency: 'NGN',
        is_vat_applicable: true,
        wht_rate: 5.0,
      },
    ],
    'sku'
  );

  console.log('Test users and baseline test data seeded successfully.');
  console.log(JSON.stringify(createdUsers.map((u) => ({ id: u.id, email: u.email, role: u.role })), null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
