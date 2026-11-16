import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from './apiConfig';

const BLUE = '#1765EE';
const TOKEN_KEY = 'smartclass_token';
const DEVICE_ERROR = 'Không kết nối được máy chủ. Vui lòng thử lại.';

type Course = {
  id: number;
  code: string;
  name: string;
};

type LeaveRequest = {
  id?: number;
  courseId?: number;
  course_id?: number;
  courseName?: string;
  course_name?: string;
  requestedDate?: string;
  requested_date?: string;
  reason: string;
  status: string;
  proofImageUrl?: string | null;
  proof_image_url?: string | null;
  createdAt?: string;
  created_at?: string;
};

type ScreenView = 'form' | 'history';

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function showDate(dateString: string | undefined) {
  if (!dateString) return 'Chưa xác định';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : dateString;
}

async function authorizedGet(path: string, signal: AbortSignal): Promise<unknown> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (response.status === 404) {
    throw new Error('Backend chưa cung cấp API này. Vui lòng liên hệ thành viên phụ trách Backend.');
  }
  if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  if (response.status === 403) throw new Error('Tài khoản không có quyền truy cập dữ liệu này.');
  if (!response.ok) throw new Error('Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại.');
  const payload = await response.json();
  if (payload?.success === false) throw new Error(payload.message || 'Máy chủ báo lỗi.');
  return payload?.data;
}

const statusInfo: Record<string, { label: string; color: string; background: string }> = {
  PENDING: { label: 'Đang chờ duyệt', color: '#9A6700', background: '#FFF5D8' },
  APPROVED: { label: 'Đã được duyệt - Nghỉ có phép', color: '#047857', background: '#E6F7ED' },
  REJECTED: { label: 'Bị từ chối', color: '#B42318', background: '#FEE4E2' },
};

export default function LeaveRequestsScreen() {
  const [view, setView] = useState<ScreenView>('form');
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');
  const [courseId, setCourseId] = useState<number | null>(null);
  const [chooseCourse, setChooseCourse] = useState(false);
  const [requestedDate, setRequestedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [reason, setReason] = useState('');
  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null);
  const [proofPreviewUri, setProofPreviewUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [history, setHistory] = useState<LeaveRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [refreshId, setRefreshId] = useState(0);

  const refresh = () => setRefreshId(value => value + 1);

  useFocusEffect(useCallback(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    if (view === 'form') {
      setCoursesLoading(true);
      setCoursesError('');
      authorizedGet('/courses', controller.signal)
        .then(data => {
          const items = (data as { courses?: unknown } | null)?.courses;
          if (!Array.isArray(items)) throw new Error('Danh sách môn học trả về chưa hợp lệ.');
          if (active) setCourses(items as Course[]);
        })
        .catch(error => {
          if (active) setCoursesError(controller.signal.aborted
            ? 'Tải môn học quá thời gian, vui lòng thử lại.'
            : error instanceof Error ? error.message : DEVICE_ERROR);
        })
        .finally(() => { if (active) setCoursesLoading(false); });
    } else {
      setHistoryLoading(true);
      setHistoryError('');
      authorizedGet('/leave-requests', controller.signal)
        .then(data => {
          // Backend có thể trả data là mảng hoặc { leaveRequests: [...] }.
          const container = data as { leaveRequests?: unknown; requests?: unknown } | null;
          const items = Array.isArray(data) ? data : container?.leaveRequests ?? container?.requests;
          if (!Array.isArray(items)) throw new Error('Dữ liệu lịch sử đơn xin nghỉ chưa đúng định dạng.');
          if (active) setHistory(items as LeaveRequest[]);
        })
        .catch(error => {
          if (active) setHistoryError(controller.signal.aborted
            ? 'Tải lịch sử quá thời gian, vui lòng thử lại.'
            : error instanceof Error ? error.message : DEVICE_ERROR);
        })
        .finally(() => { if (active) setHistoryLoading(false); });
    }

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [view, refreshId]));

  const selectedCourse = courses.find(course => course.id === courseId);

  const pickProof = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền camera để chụp ảnh minh chứng.');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.45,
        base64: true,
      };
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.base64) throw new Error('Không đọc được dữ liệu ảnh đã chọn.');
      const image = `data:image/jpeg;base64,${asset.base64}`;
      if (image.length > 2_000_000) {
        Alert.alert('Ảnh quá lớn', 'Vui lòng chọn ảnh có kích thước nhỏ hơn.');
        return;
      }
      setProofDataUrl(image);
      setProofPreviewUri(asset.uri);
    } catch (error) {
      Alert.alert('Không thể đính kèm ảnh', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    }
  };

  const selectProofSource = () => {
    Alert.alert('Ảnh minh chứng', 'Chọn nguồn ảnh để đính kèm', [
      { text: 'Chụp ảnh', onPress: () => { void pickProof('camera'); } },
      { text: 'Chọn từ Album', onPress: () => { void pickProof('library'); } },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const submit = async () => {
    if (submittingRef.current) return;
    if (!selectedCourse) {
      Alert.alert('Thiếu môn học', 'Vui lòng chọn môn học từ danh sách đang học.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Thiếu lý do', 'Vui lòng nhập lý do xin nghỉ.');
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      const response = await fetch(`${API_URL}/leave-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          requestedDate: localDate(requestedDate),
          reason: reason.trim(),
          proofImageUrl: proofDataUrl,
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) {
        if (response.status === 404) {
          throw new Error('Backend chưa có API POST /api/leave-requests.');
        }
        if (response.status === 413) {
          throw new Error('Ảnh quá lớn so với giới hạn máy chủ. Hãy thử ảnh nhỏ hơn.');
        }
        if (response.status === 401) {
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        throw new Error(typeof payload?.message === 'string'
          ? payload.message : 'Máy chủ từ chối đơn xin nghỉ. Vui lòng kiểm tra lại.');
      }
      setReason('');
      setProofDataUrl(null);
      setProofPreviewUri(null);
      setCourseId(null);
      setView('history');
      refresh();
      Alert.alert('Gửi đơn thành công', 'Đơn đã được gửi. Anh/chị có thể xem trạng thái trong Lịch sử đơn.');
    } catch (error) {
      const errorText = controller.signal.aborted
        ? 'Chưa xác nhận được kết quả gửi đơn. Vui lòng kiểm tra Lịch sử đơn trước khi gửi lại.'
        : error instanceof Error ? error.message : DEVICE_ERROR;
      Alert.alert('Chưa gửi được đơn', errorText);
    } finally {
      clearTimeout(timer);
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={view === 'history'
            ? <RefreshControl refreshing={historyLoading} onRefresh={refresh} tintColor={BLUE} />
            : undefined}
        >
          <Text style={s.brand}>SMART CLASSROOM</Text>
          <Text style={s.heading}>Đơn xin nghỉ phép</Text>
          <Text style={s.subtitle}>Gửi yêu cầu và theo dõi kết quả duyệt của giảng viên.</Text>
          <View style={s.segment}>
            <Pressable accessibilityRole="button"
              onPress={() => setView('form')}
              style={[s.segmentButton, view === 'form' && s.segmentSelected]}>
              <Text style={[s.segmentText, view === 'form' && s.segmentTextSelected]}>Gửi đơn</Text>
            </Pressable>
            <Pressable accessibilityRole="button"
              onPress={() => setView('history')}
              style={[s.segmentButton, view === 'history' && s.segmentSelected]}>
              <Text style={[s.segmentText, view === 'history' && s.segmentTextSelected]}>Lịch sử đơn</Text>
            </Pressable>
          </View>

          {view === 'form' ? (
            <View style={s.card}>
              <Text style={s.label}>Môn học</Text>
              {coursesLoading ? <ActivityIndicator color={BLUE} style={s.spinner} /> : coursesError ? (
                <View style={s.notice}>
                  <Text style={s.errorText}>{coursesError}</Text>
                  <Pressable onPress={refresh}><Text style={s.retryText}>Tải lại môn học</Text></Pressable>
                </View>
              ) : courses.length === 0 ? (
                <Text style={s.muted}>Bạn chưa có môn học nào để gửi đơn.</Text>
              ) : (
                <>
                  <Pressable style={s.field} onPress={() => setChooseCourse(value => !value)}>
                    <Text style={selectedCourse ? s.fieldValue : s.muted}>
                      {selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : 'Chọn môn học đang học'}
                    </Text>
                    <Ionicons name={chooseCourse ? 'chevron-up' : 'chevron-down'} size={18} color={BLUE} />
                  </Pressable>
                  {chooseCourse && <View style={s.courseList}>
                    {courses.map(course => <Pressable
                      key={course.id}
                      style={s.courseItem}
                      onPress={() => { setCourseId(course.id); setChooseCourse(false); }}>
                      <Text style={s.courseName}>{course.name}</Text>
                      <Text style={s.muted}>{course.code}</Text>
                    </Pressable>)}
                  </View>}
                </>
              )}

              <Text style={s.label}>Ngày xin nghỉ</Text>
              <Pressable style={s.field} onPress={() => setShowCalendar(value => !value)}>
                <Text style={s.fieldValue}>{showDate(localDate(requestedDate))}</Text>
                <Ionicons name="calendar-outline" size={20} color={BLUE} />
              </Pressable>
              {showCalendar && <View style={s.calendarBox}>
                <DateTimePicker
                  value={requestedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_event, date) => {
                    if (date) setRequestedDate(date);
                    if (Platform.OS !== 'ios') setShowCalendar(false);
                  }}
                />
                {Platform.OS === 'ios' && <Pressable onPress={() => setShowCalendar(false)}>
                  <Text style={s.retryText}>Xong</Text>
                </Pressable>}
              </View>}

              <Text style={s.label}>Lý do xin nghỉ</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                multiline
                textAlignVertical="top"
                placeholder="Nhập lý do xin nghỉ học..."
                placeholderTextColor="#98A2B3"
                maxLength={1000}
                style={s.reasonInput}
              />
              <Text style={s.counter}>{reason.length}/1000 ký tự</Text>

              <Text style={s.label}>Ảnh minh chứng (nếu có)</Text>
              <Pressable style={s.attach} onPress={selectProofSource}>
                <Ionicons name="image-outline" size={21} color={BLUE} />
                <Text style={s.attachLabel}>{proofPreviewUri ? 'Đổi ảnh minh chứng' : 'Chụp ảnh hoặc chọn từ Album'}</Text>
              </Pressable>
              {proofPreviewUri && <View>
                <Image source={{ uri: proofPreviewUri }} style={s.preview} resizeMode="contain" />
                <Pressable onPress={() => { setProofPreviewUri(null); setProofDataUrl(null); }}>
                  <Text style={s.removeText}>Bỏ ảnh minh chứng</Text>
                </Pressable>
              </View>}
              <Pressable
                accessibilityRole="button"
                disabled={submitting || coursesLoading || !!coursesError || courses.length === 0}
                style={[s.submit, (submitting || coursesLoading || !!coursesError || courses.length === 0) && s.disabled]}
                onPress={() => { void submit(); }}>
                {submitting ? <ActivityIndicator color="white" /> : <>
                  <Ionicons name="send-outline" size={20} color="white" />
                  <Text style={s.submitText}>Gửi đơn xin nghỉ phép</Text>
                </>}
              </Pressable>
            </View>
          ) : (
            <View style={s.historyArea}>
              {historyLoading ? <ActivityIndicator color={BLUE} style={s.spinner} /> : historyError ? (
                <View style={s.card}>
                  <Text style={s.errorText}>{historyError}</Text>
                  <Pressable onPress={refresh}><Text style={s.retryText}>Thử lại</Text></Pressable>
                </View>
              ) : history.length === 0 ? (
                <View style={s.card}>
                  <Ionicons name="document-text-outline" size={38} color="#98A2B3" />
                  <Text style={s.emptyText}>Bạn chưa gửi đơn xin nghỉ nào.</Text>
                </View>
              ) : history.map((request, index) => {
                const info = statusInfo[request.status] || {
                  label: 'Chưa xác định', color: '#667085', background: '#EAECF0',
                };
                const requested = request.requestedDate || request.requested_date;
                const courseName = request.courseName || request.course_name
                  || courses.find(course => course.id === (request.courseId ?? request.course_id))?.name
                  || `Môn học #${request.courseId ?? request.course_id ?? '?'}`;
                return <View key={`${request.id ?? 'request'}-${index}`} style={s.historyCard}>
                  <Text style={s.courseName}>{courseName}</Text>
                  <Text style={s.muted}>Ngày nghỉ: {showDate(requested)}</Text>
                  <Text style={s.reasonText}>{request.reason}</Text>
                  <View style={[s.status, { backgroundColor: info.background }]}>
                    <Text style={{ color: info.color, fontWeight: '700', fontSize: 12 }}>{info.label}</Text>
                  </View>
                </View>;
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#F6F8FC' },
  content: { padding: 22, paddingBottom: 40, gap: 12 },
  brand: { fontSize: 11, fontWeight: '800', color: BLUE, letterSpacing: 2 },
  heading: { fontSize: 27, fontWeight: '800', color: '#14213A', marginTop: 8 },
  subtitle: { fontSize: 13, lineHeight: 20, color: '#7A8496', marginBottom: 7 },
  segment: { flexDirection: 'row', padding: 4, backgroundColor: '#E9EEF7', borderRadius: 14, marginBottom: 10 },
  segmentButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  segmentSelected: { backgroundColor: 'white' },
  segmentText: { color: '#64748B', fontWeight: '600' },
  segmentTextSelected: { color: BLUE },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 22, gap: 10 },
  label: { color: '#344054', fontWeight: '700', fontSize: 14, marginTop: 12 },
  field: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F7F9FC', borderWidth: 1, borderColor: '#E5EAF3', padding: 14, minHeight: 52, borderRadius: 12, gap: 10 },
  fieldValue: { flex: 1, color: '#14213A', fontSize: 14 },
  muted: { color: '#7A8496', fontSize: 13, lineHeight: 19, flexShrink: 1 },
  notice: { padding: 12, backgroundColor: '#FFF5F5', borderRadius: 12 },
  errorText: { color: '#B42318', lineHeight: 20, fontSize: 13 },
  retryText: { color: BLUE, fontWeight: '700', paddingVertical: 10 },
  spinner: { marginVertical: 18 },
  courseList: { maxHeight: 230, backgroundColor: '#F7F9FC', borderRadius: 12, overflow: 'hidden' },
  courseItem: { padding: 13, borderBottomWidth: 1, borderBottomColor: '#E4EAF3', gap: 3 },
  courseName: { color: '#14213A', fontSize: 15, fontWeight: '700' },
  calendarBox: { padding: 8, borderRadius: 12, backgroundColor: '#F7F9FC' },
  reasonInput: { minHeight: 112, borderWidth: 1, borderColor: '#E5EAF3', borderRadius: 12, padding: 13, backgroundColor: '#F7F9FC', color: '#14213A', fontSize: 14, lineHeight: 20 },
  counter: { color: '#98A2B3', fontSize: 11, textAlign: 'right' },
  attach: { flexDirection: 'row', padding: 14, alignItems: 'center', gap: 10, backgroundColor: '#EEF4FF', borderRadius: 12 },
  attachLabel: { color: BLUE, fontWeight: '700', fontSize: 13, flex: 1 },
  preview: { width: '100%', height: 185, backgroundColor: '#F7F9FC', borderRadius: 12 },
  removeText: { color: '#B42318', paddingVertical: 10, fontSize: 13, textAlign: 'center' },
  submit: { minHeight: 54, backgroundColor: BLUE, marginTop: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  disabled: { opacity: 0.5 },
  submitText: { color: 'white', fontWeight: '800', fontSize: 15 },
  historyArea: { gap: 12 },
  historyCard: { backgroundColor: 'white', padding: 18, borderRadius: 18, gap: 10 },
  reasonText: { fontSize: 13, color: '#475467', lineHeight: 20 },
  status: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12 },
  emptyText: { color: '#667085', marginTop: 8 },
});
