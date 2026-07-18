// upload.js — ONE image-upload path. Push a file to a Supabase storage bucket (optionally under a
// folder) and return its public URL. Path = [folder/]userId/timestamp-rand.ext (the userId segment
// matches the storage RLS). Throws on oversize / not-signed-in / upload error so callers show one
// message. Shared by adminsetup (nation flag + world-event image), the /backend Nation Creator,
// the forum, and the wiki editor. maxMB caps the file size (0 = no cap).
import { supabase } from '/supabase.js';

export async function uploadToStorage(bucket, folder, file, maxMB = 2) {
  if (maxMB && file.size > maxMB * 1024 * 1024) throw new Error('That image is over ' + maxMB + ' MB.');
  const u = (await supabase.auth.getUser()).data.user;
  if (!u) throw new Error('Not signed in.');
  const ext = ((file.name || '').split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const path = (folder ? folder + '/' : '') + u.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
  const up = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (up.error) throw new Error(up.error.message);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
