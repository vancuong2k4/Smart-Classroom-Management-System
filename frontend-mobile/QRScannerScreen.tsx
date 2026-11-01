import { usePreparedLocation } from './usePreparedLocation';
import { API_URL } from './apiConfig';
import { useAttendanceCheckin } from './useAttendanceCheckin';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, AppState, Linking, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BLUE = '#1765EE';

export default function QRScannerScreen() {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const locked = useRef(false);
  const { checkin, submitCheckin, resetCheckin } = useAttendanceCheckin(API_URL, focused);
  const gps = usePreparedLocation(
    focused && active && !!permission?.granted && !token && !error
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      setActive(state === 'active');
      if (state === 'active') {
        getPermission().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [getPermission]);

  useEffect(() => {
    if (!focused) {
      locked.current = false;
      setToken('');
      setError('');
    } else {
      getPermission().catch(() => {});
    }
  }, [focused, getPermission]);

  const reset = () => {
    resetCheckin();
    locked.current = false;
    setToken('');
    setError('');
  };

  const allowCamera = async () => {
    setError('');
    try {
      if (permission?.canAskAgain) {
        await requestPermission();
      } else {
        await Linking.openSettings();
      }
    } catch {
      setError('Không mở được quyền camera. Anh/chị vui lòng thử lại.');
    }
  };

  if (!focused || !active) return <View style={s.screen} />;

  if (permission?.granted && !token && !error && !gps.position) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.heading}>
            <Text style={s.brand}>SMART CLASSROOM</Text>
            <Text style={s.pageTitle}>Chuẩn bị điểm danh</Text>
          </View>
          <View style={s.center}>
            <View style={s.card}>
              <View style={s.iconCircle}>
                {gps.busy ? <ActivityIndicator size="large" color={BLUE} /> : (
                  <Ionicons name="location-outline" size={44} color={BLUE} />
                )}
              </View>
              <Text style={s.title}>Xác nhận vị trí</Text>
              <Text style={s.description}>{gps.message}</Text>
              <Text style={s.note}>
                Camera sẽ mở khi có GPS mới và đủ chính xác.
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={gps.busy}
                style={[s.button, gps.busy && { opacity: 0.6 }]}
                onPress={() => {
                  if (gps.settings) {
                    Linking.openSettings().catch(() =>
                      setError('Không mở được cài đặt. Vui lòng mở từ điện thoại.')
                    );
                  } else {
                    void gps.prepare();
                  }
                }}
              >
                <Text style={s.buttonText}>
                  {gps.busy ? 'Đang chuẩn bị…'
                    : gps.settings ? 'Mở cài đặt vị trí' : 'Chuẩn bị GPS'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }


  const scanning = permission?.granted && !token && !error;

  if (scanning) {
    return (
      <View style={{ flex: 1, backgroundColor: '#101828' }}>
        <View style={{
          position: 'absolute',
          top: 0, bottom: 0, left: 0, right: 0,
        }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onMountError={() =>
              setError('Không thể khởi động camera. Vui lòng thử lại.')
            }
            onBarcodeScanned={({ data }) => {
              if (locked.current || !data.trim() || !gps.position) return;
              if (Math.abs(Date.now() - gps.position.timestamp) > 10000) return;
              locked.current = true;
              setToken(data);
              void submitCheckin(data, gps.position);
            }}
          />
        </View>

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, bottom: 0, left: 0, right: 0,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 28,
          }}
        >
          <View style={{
            width: '100%',
            maxWidth: 360,
            alignItems: 'center',
          }}>
            <View style={{
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 24,
              backgroundColor: 'rgba(10,25,48,0.80)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
            }}>
              <Ionicons name="qr-code-outline" size={18} color="white" />
              <Text style={s.cameraBadgeText}>SMART CLASSROOM</Text>
            </View>

            <Text style={{
              color: 'white',
              fontSize: 25,
              fontWeight: '800',
              textAlign: 'center',
              marginTop: 18,
              marginBottom: 28,
              textShadowColor: 'rgba(0,0,0,0.6)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 6,
            }}>
              Quét mã điểm danh
            </Text>

            <View style={{
              width: '88%',
              maxWidth: 300,
              aspectRatio: 1,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.45)',
              backgroundColor: 'transparent',
            }}>
              <View style={[s.corner, s.topLeft]} />
              <View style={[s.corner, s.topRight]} />
              <View style={[s.corner, s.bottomLeft]} />
              <View style={[s.corner, s.bottomRight]} />
              <View style={s.scanLine} />
            </View>

            <View style={{
              width: '100%',
              marginTop: 28,
              padding: 20,
              borderRadius: 22,
              backgroundColor: 'rgba(10,25,48,0.85)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}>
              <Text style={s.guideTitle}>Đặt mã QR vào khung</Text>
              <Text style={s.guideText}>
                Hướng camera về mã của giảng viên và giữ điện thoại ổn định.
              </Text>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 7,
                marginTop: 16,
              }}>
                <Ionicons name="scan-outline" size={16} color="#93C5FD" />
                <Text style={{ color: '#BFDBFE', fontSize: 12 }}>
                  Tự động nhận diện mã QR
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }


  if (permission?.granted && checkin.phase !== 'idle') {
    const busy = checkin.phase === 'location' || checkin.phase === 'sending';
    const success = checkin.phase === 'success';
    const color = busy ? BLUE : success ? '#078447' : '#C24135';
    const tint = busy ? '#EDF4FF' : success ? '#ECFDF3' : '#FFF1F0';
    const resultTitle = busy
      ? checkin.phase === 'location' ? 'Đang lấy vị trí' : 'Đang điểm danh'
      : success ? 'Điểm danh thành công'
      : checkin.uncertain ? 'Chưa xác nhận kết quả' : 'Chưa thể điểm danh';

    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.heading}>
            <Text style={s.brand}>SMART CLASSROOM</Text>
            <Text style={s.pageTitle}>Điểm danh</Text>
          </View>
          <View style={s.center}>
            <View style={s.card}>
              <View style={[s.iconCircle, { backgroundColor: tint }]}>
                {busy ? <ActivityIndicator size="large" color={color} /> : (
                  <Ionicons
                    name={success ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                    size={44}
                    color={color}
                  />
                )}
              </View>
              <Text style={[s.title, { color }]}>{resultTitle}</Text>
              {success && (
                <Text style={{
                  color, backgroundColor: tint, overflow: 'hidden',
                  paddingHorizontal: 18, paddingVertical: 8,
                  borderRadius: 14, fontWeight: '700', marginTop: 16,
                }}>
                  {checkin.status === 'LATE' ? 'Đi muộn' : 'Có mặt'}
                </Text>
              )}
              <Text style={s.description}>{checkin.message}</Text>
              {busy && (
                <Text style={s.note}>
                  Giữ ứng dụng mở trong khi xử lý.
                </Text>
              )}
              {!busy && checkin.settings && (
                <Pressable
                  accessibilityRole="button"
                  style={s.button}
                  onPress={() => {
                    Linking.openSettings().catch(() =>
                      setError('Không mở được cài đặt. Hãy mở Cài đặt trên điện thoại.')
                    );
                  }}
                >
                  <Text style={s.buttonText}>Mở cài đặt vị trí</Text>
                </Pressable>
              )}
              {!busy && (
                <Pressable
                  accessibilityRole="button"
                  onPress={reset}
                  style={({ pressed }) => [
                    s.button, pressed && s.buttonPressed,
                  ]}
                >
                  <Ionicons name="scan-outline" size={21} color="white" />
                  <Text style={s.buttonText}>Quét mã mới</Text>
                </Pressable>
              )}
              {!!error && <Text style={s.errorText}>{error}</Text>}
              {checkin.uncertain && (
                <Text style={s.note}>
                  Chọn tab Lịch sử bên dưới để kiểm tra kết quả.
                </Text>
              )}
            </View>
          </View>
          <View style={s.footer}>
            <Ionicons name="shield-checkmark-outline" size={17} color="#94A3B8" />
            <Text style={s.footerText}>Hệ thống điểm danh thông minh</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const waiting = !permission;
  const needsPermission = !!permission && !permission.granted;
  const title = waiting ? 'Đang chuẩn bị camera'
    : needsPermission ? 'Cho phép truy cập camera'
    : error ? 'Camera chưa sẵn sàng'
    : 'Đã đọc mã QR';

  const description = waiting ? 'Vui lòng đợi trong giây lát.'
    : needsPermission
      ? 'Smart Classroom cần camera để quét mã QR điểm danh của giảng viên.'
      : error || 'Mã đã được nhận diện. Chưa gửi yêu cầu điểm danh.';

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.heading}>
          <Text style={s.brand}>SMART CLASSROOM</Text>
          <Text style={s.pageTitle}>Quét mã điểm danh</Text>
        </View>

        <View style={s.center}>
          <View style={s.card}>
            <View style={s.iconCircle}>
              {waiting ? <ActivityIndicator size="large" color={BLUE} /> : (
                <Ionicons
                  name={needsPermission ? 'camera-outline'
                    : error ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                  size={44}
                  color={BLUE}
                />
              )}
            </View>

            <Text style={s.title}>{title}</Text>
            <Text style={s.description}>{description}</Text>

            {!!token && (
              <View style={s.tokenBox}>
                <Text style={s.tokenLabel}>NỘI DUNG MÃ QR</Text>
                <ScrollView style={s.tokenScroll} nestedScrollEnabled>
                  <Text selectable style={s.token}>{token}</Text>
                </ScrollView>
              </View>
            )}

            {needsPermission && !!error && (
              <Text style={s.errorText}>{error}</Text>
            )}

            {!waiting && (
              <Pressable
                accessibilityRole="button"
                onPress={needsPermission ? allowCamera : reset}
                style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
              >
                <Ionicons
                  name={needsPermission ? 'camera-outline' : 'scan-outline'}
                  size={21}
                  color="white"
                />
                <Text style={s.buttonText}>
                  {needsPermission
                    ? permission.canAskAgain ? 'Cho phép camera' : 'Mở cài đặt'
                    : 'Quét lại'}
                </Text>
              </Pressable>
            )}

            {needsPermission && (
              <Text style={s.note}>
                Camera chỉ được sử dụng khi bạn mở màn hình quét.
              </Text>
            )}
          </View>
        </View>

        <View style={s.footer}>
          <Ionicons name="shield-checkmark-outline" size={17} color="#94A3B8" />
          <Text style={s.footerText}>Hệ thống điểm danh thông minh</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FC' },
  content: { flexGrow: 1, padding: 24 },
  heading: { paddingTop: 12 },
  brand: { color: BLUE, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  pageTitle: { color: '#132238', fontSize: 26, fontWeight: '800', marginTop: 10 },
  center: { flex: 1, justifyContent: 'center', paddingVertical: 32 },
  card: {
    width: '100%', maxWidth: 440, alignSelf: 'center',
    backgroundColor: 'white', borderRadius: 28, padding: 26,
    alignItems: 'center', borderWidth: 1, borderColor: '#EAF0F8',
    shadowColor: '#17335C', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, shadowRadius: 20, elevation: 3,
  },
  iconCircle: {
    width: 88, height: 88, borderRadius: 28, backgroundColor: '#EDF4FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: { color: '#132238', fontSize: 23, fontWeight: '800', textAlign: 'center' },
  description: {
    color: '#748094', fontSize: 15, lineHeight: 23,
    textAlign: 'center', marginTop: 12,
  },
  tokenBox: {
    alignSelf: 'stretch', padding: 16, borderRadius: 16,
    backgroundColor: '#F5F8FE', borderWidth: 1,
    borderColor: '#E4ECFA', marginTop: 24,
  },
  tokenLabel: {
    color: '#7B8BA4', fontSize: 10, fontWeight: '800',
    letterSpacing: 1.3, textAlign: 'center', marginBottom: 10,
  },
  tokenScroll: { maxHeight: 140 },
  token: { color: '#25456E', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  button: {
    backgroundColor: BLUE, alignSelf: 'stretch', borderRadius: 16,
    minHeight: 54, padding: 14, flexDirection: 'row', gap: 10,
    alignItems: 'center', justifyContent: 'center', marginTop: 26,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  note: { color: '#94A3B8', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 18 },
  errorText: { color: '#C2410C', textAlign: 'center', marginTop: 12 },
  footer: { flexDirection: 'row', gap: 7, justifyContent: 'center', paddingBottom: 8 },
  footerText: { color: '#94A3B8', fontSize: 12 },
  cameraScreen: { flex: 1, backgroundColor: '#101828' },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'space-between', backgroundColor: 'rgba(8,20,40,0.15)' },
  cameraHeader: { alignItems: 'center', paddingTop: 18, paddingHorizontal: 20 },
  cameraBadge: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: 'rgba(15,30,52,0.65)', paddingHorizontal: 14,
    paddingVertical: 9, borderRadius: 30,
  },
  cameraBadgeText: { color: 'white', fontSize: 10, letterSpacing: 1.6, fontWeight: '800' },
  cameraTitle: { color: 'white', fontSize: 25, fontWeight: '800', marginTop: 16 },
  targetArea: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 24 },
  frame: {
    width: '85%', maxWidth: 320, aspectRatio: 1, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: '#FFFFFF' },
  topLeft: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 24 },
  topRight: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 24 },
  bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 24 },
  bottomRight: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 24 },
  scanLine: { position: 'absolute', top: '50%', left: 18, right: 18, height: 2, backgroundColor: '#70B5FF' },
  guide: {
    marginTop: 28, padding: 18, borderRadius: 20,
    backgroundColor: 'rgba(15,30,52,0.78)', width: '100%', maxWidth: 360,
  },
  guideTitle: { color: 'white', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  guideText: { color: '#D0DEEF', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  cameraFooter: {
    flexDirection: 'row', gap: 8, justifyContent: 'center',
    alignItems: 'center', padding: 18, backgroundColor: 'rgba(15,30,52,0.75)',
  },
  cameraFooterText: { color: '#DBEAFE', fontSize: 12 },
});
