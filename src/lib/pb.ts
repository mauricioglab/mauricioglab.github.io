import PocketBase from 'pocketbase';

const pbUrl = import.meta.env.PUBLIC_POCKETBASE_URL || 'https://spa-depot.46-225-2-192.nip.io';

export const pb = new PocketBase(pbUrl);

// Persist auth across page loads (browser only)
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('pb_auth');
    if (saved) pb.authStore.save(JSON.parse(saved).token, JSON.parse(saved).record);
  } catch (e) { /* ignore */ }
  pb.authStore.onChange(() => {
    try {
      localStorage.setItem('pb_auth', JSON.stringify({ token: pb.authStore.token, record: pb.authStore.record }));
    } catch (e) { /* ignore */ }
  });
}
