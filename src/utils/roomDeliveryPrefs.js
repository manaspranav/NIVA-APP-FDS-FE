const STORAGE_PREFIX = 'niva_room_delivery_';

export function getRoomDeliveryPrefs(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    return {
      deliveryType: data.deliveryType === 'room' ? 'room' : 'normal',
      hostelType: data.hostelType || '',
      hostelName: data.hostelName || '',
      roomNumber: data.roomNumber || '',
    };
  } catch {
    return null;
  }
}

export function saveRoomDeliveryPrefs(userId, prefs) {
  if (!userId || !prefs) return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify({
        deliveryType: prefs.deliveryType || 'normal',
        hostelType: prefs.hostelType || '',
        hostelName: prefs.hostelName || '',
        roomNumber: prefs.roomNumber || '',
        updatedAt: Date.now(),
      })
    );
  } catch (e) {
    console.warn('Could not save room delivery preferences', e);
  }
}
