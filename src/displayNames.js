export function displayOwnerName(name) {
  const trimmed = String(name ?? '').trim();
  return trimmed ? `${trimmed}　様` : '';
}

export function displayPetName(name) {
  const trimmed = String(name ?? '').trim();
  return trimmed ? `${trimmed}　ちゃん` : '';
}
