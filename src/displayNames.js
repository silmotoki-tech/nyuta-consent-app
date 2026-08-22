function withHonorific(name, suffix) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.endsWith(suffix)) return trimmed;
  return `${trimmed}${suffix}`;
}

export function displayOwnerName(name) {
  return withHonorific(name, '様');
}

export function displayPetName(name) {
  return withHonorific(name, 'ちゃん');
}
