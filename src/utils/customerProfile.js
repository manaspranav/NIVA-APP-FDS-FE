const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function isCustomerProfileComplete(profile) {
  if (!profile) return false;

  const name = (profile.name || '').trim();
  const email = (profile.email || '').trim();
  const phone = String(profile.phone || '').trim();
  const college = (profile.college || '').trim();

  if (!name || !email) return false;
  if (!phone || phone.length !== 10) return false;
  if (!college || college === 'Select your university') return false;

  return true;
}

export async function fetchCustomerProfile(userId) {
  if (!userId) return null;

  const response = await fetch(`${API_URL}/api/customers/${userId}`);
  if (!response.ok) return null;

  const result = await response.json().catch(() => null);
  if (!result?.success || !result?.data) return null;

  return result.data;
}

export async function upsertCustomerProfile({ id, name, email }) {
  if (!id || !email) return null;

  const response = await fetch(`${API_URL}/api/customers/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      name: name || 'User',
      email,
      phone: '',
      college: ''
    })
  });

  if (!response.ok) return null;

  const result = await response.json().catch(() => null);
  if (!result?.success || !result?.data) return null;

  return result.data;
}

export async function getOrCreateCustomerProfile(user) {
  if (!user?.id) return null;

  const existing = await fetchCustomerProfile(user.id);
  if (existing) return existing;

  const email = user.email;
  const name = user.user_metadata?.full_name || (email ? email.split('@')[0] : 'User');

  return upsertCustomerProfile({ id: user.id, name, email });
}
