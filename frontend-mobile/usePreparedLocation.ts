import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export function usePreparedLocation(enabled: boolean) {
  const [position, setPosition] = useState<Location.LocationObject | null>(null);
  const [message, setMessage] = useState('Cho phép vị trí để chuẩn bị điểm danh.');
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(false);
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const generation = useRef(0);
  const allowed = useRef(enabled);
  const preparing = useRef(false);

  useEffect(() => {
    allowed.current = enabled;
    if (!enabled) {
      generation.current += 1;
      preparing.current = false;
      subscription.current?.remove();
      subscription.current = null;
      setPosition(null);
      setBusy(false);
      setMessage('Cho phép vị trí để chuẩn bị điểm danh.');
    }
    return () => {
      allowed.current = false;
      generation.current += 1;
      preparing.current = false;
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      setPosition(previous =>
        previous && Date.now() - previous.timestamp <= 10000
          ? previous : null
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [enabled]);

  const prepare = async () => {
    if (!allowed.current || preparing.current) return;
    preparing.current = true;
    const id = ++generation.current;
    const current = () => allowed.current && generation.current === id;
    setBusy(true);
    setSettings(false);
    setMessage('Đang xin quyền và chuẩn bị GPS…');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!current()) return;
      if (!permission.granted) {
        setSettings(!permission.canAskAgain);
        setMessage('Hãy cho phép vị trí chính xác khi dùng ứng dụng để điểm danh.');
        return;
      }
      if (!await Location.hasServicesEnabledAsync()) {
        if (!current()) return;
        setSettings(true);
        setMessage('Dịch vụ định vị đang tắt. Hãy bật trong cài đặt điện thoại.');
        return;
      }
      if (!current()) return;

      subscription.current?.remove();
      subscription.current = null;
      setMessage('Đang chờ GPS chính xác. Hãy đứng ở nơi thu GPS tốt.');
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        next => {
          if (!current()) return;
          const accuracy = next.coords.accuracy;
          const valid = Number.isFinite(next.coords.latitude)
            && Number.isFinite(next.coords.longitude)
            && accuracy != null && accuracy >= 0 && accuracy <= 50
            && Math.abs(Date.now() - next.timestamp) <= 10000;
          setPosition(valid ? next : null);
          setMessage(valid
            ? 'Vị trí đã sẵn sàng.'
            : 'GPS chưa đủ chính xác. Bật Vị trí chính xác và đến nơi thu GPS tốt hơn.');
        },
        () => {
          if (!current()) return;
          setPosition(null);
          setMessage('Không nhận được GPS. Kiểm tra định vị rồi bấm Chuẩn bị GPS.');
        }
      );
      if (!current()) {
        watcher.remove();
        return;
      }
      subscription.current = watcher;
    } catch {
      if (current()) {
        setPosition(null);
        setMessage('Không chuẩn bị được GPS. Kiểm tra quyền vị trí và thử lại.');
      }
    } finally {
      if (current()) {
        preparing.current = false;
        setBusy(false);
      }
    }
  };

  return { position, message, busy, settings, prepare };
}
