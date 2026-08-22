const FULLWIDTH_SPACE = '　';

export function withHonorific(name, suffix) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.endsWith(`${FULLWIDTH_SPACE}${suffix}`) || trimmed.endsWith(suffix)) {
    return trimmed;
  }
  return `${trimmed}${FULLWIDTH_SPACE}${suffix}`;
}

export function displayOwnerName(name) {
  return withHonorific(name, '様');
}

export function displayPetName(name) {
  return withHonorific(name, 'ちゃん');
}
