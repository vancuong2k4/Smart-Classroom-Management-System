import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

export type CheckinState = {
  phase: 'idle' | 'location' | 'sending' | 'success' | 'error';
  message: string;
  status?: 'PRESENT' | 'LATE';
  settings?: boolean;
  uncertain?: boolean;
};

const initial: CheckinState = { phase: 'idle', message: '' };

class CheckinError extends Error {
  constructor(message: string, public settings = false) {
    super(message);
  }
}

async function withTimeout<T>(job: Promise<T>, ms: number, message: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      job,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new CheckinError(message)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function useAttendanceCheckin(apiUrl: string, focused: boolean) {
  const [state, setState] = useState<CheckinState>(initial);
  const running = useRef(false);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const available = useRef(focused);

  useEffect(() => {
    available.current = focused;
    if (!focused) {
      generation.current += 1;
      running.current = false;
      controller.current?.abort();
      setState(initial);
    }
    return () => {
      available.current = false;
      generation.current += 1;
      running.current = false;
      controller.current?.abort();
    };
  }, [focused]);

  const resetCheckin = () => {
    if (running.current) return;
    setState(initial);
  };

  const submitCheckin = async (qrToken: string, position: Location.LocationObject) => {
    if (running.current || !available.current) return;
    running.current = true;
    const id = ++generation.current;
    const current = () => available.current && generation.current === id;
    let sent = false;
    let serverRejected = false;
    let requestTimer: ReturnType<typeof setTimeout> | undefined;

    setState({ phase: 'location', message: 'Đang xác định vị trí của bạn…' });

    try {
      const authToken = await SecureStore.getItemAsync('smartclass_token');
      if (!current()) return;
      if (!authToken) {
        throw new CheckinError('Phiên đăng nhập không còn. Vui lòng đăng xuất và đăng nhập lại.');
      }

      if (Math.abs(Date.now() - position.timestamp) > 10000) {
        throw new CheckinError('Vị trí đã cũ. Hãy quét mã mới khi GPS sẵn sàng.');
      }
      const { latitude, longitude, accuracy } = position.coords;

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new CheckinError('Tọa độ GPS không hợp lệ. Vui lòng quét lại.');
      }
      if (accuracy == null || accuracy < 0 || accuracy > 50) {
        throw new CheckinError(
          'GPS chưa đủ chính xác để điểm danh. Hãy bật Vị trí chính xác và thử ở nơi thu GPS tốt hơn.'
        );
      }
      if (Date.now() - position.timestamp > 30000) {
        throw new CheckinError('Vị trí vừa nhận đã cũ. Vui lòng quét lại để lấy GPS mới.');
      }
      if (AppState.currentState !== 'active') {
        throw new CheckinError('Hãy quay lại ứng dụng và quét mã mới để điểm danh.');
      }

      setState({ phase: 'sending', message: 'Đang gửi yêu cầu điểm danh…' });
      const abort = new AbortController();
      controller.current = abort;
      requestTimer = setTimeout(() => abort.abort(), 15000);
      sent = true;

      const response = await fetch(`${apiUrl}/attendance/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token: qrToken.trim(),
          latitude,
          longitude,
        }),
        signal: abort.signal,
      });
      const body = await response.json();
      if (!current()) return;

      if (!response.ok) {
        serverRejected = response.status < 500;
        const message = response.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại.'
          : response.status === 429
            ? 'Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.'
            : typeof body?.message === 'string'
              ? body.message
              : 'Máy chủ chưa xử lý được yêu cầu điểm danh.';
        throw new CheckinError(message);
      }

      const status = body?.data?.status;
      if (status !== 'PRESENT' && status !== 'LATE') {
        throw new CheckinError('Máy chủ trả kết quả chưa xác định.');
      }

      setState({
        phase: 'success',
        status,
        message: status === 'LATE'
          ? 'Bạn đã được ghi nhận đi muộn trong buổi học này.'
          : 'Bạn đã được ghi nhận có mặt trong buổi học này.',
      });
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
    } catch (err) {
      if (!current()) return;
      const uncertain = sent && !serverRejected;
      setState({
        phase: 'error',
        message: uncertain
          ? 'Chưa xác nhận được kết quả từ máy chủ. Hãy kiểm tra tab Lịch sử trước khi quét lại.'
          : err instanceof CheckinError
            ? err.message
            : 'Không lấy được vị trí. Kiểm tra quyền GPS và thử lại.',
        settings: err instanceof CheckinError && err.settings,
        uncertain,
      });
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      ).catch(() => {});
    } finally {
      if (requestTimer) clearTimeout(requestTimer);
      if (generation.current === id) {
        running.current = false;
        controller.current = null;
      }
    }
  };

  return { checkin: state, submitCheckin, resetCheckin };
}
