import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const API_URL = 'http://192.168.1.7:3000/api';
const TOKEN_KEY = 'smartclass_token';
const BLUE = '#1765EE';

type User = {
  id: number;
  username: string;
  role: string;
};

type Tabs = {
  Home: undefined;
  Scan: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<Tabs>();
type IconName = React.ComponentProps<typeof Ionicons>['name'];

function EmptyScreen({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.pageHeader}>
        <Text style={s.brand}>SMART CLASSROOM</Text>
        <Text style={s.pageTitle}>{title}</Text>
      </View>
      <View style={s.empty}>
        <View style={s.largeIcon}>
          <Ionicons name={icon} size={42} color={BLUE} />
        </View>
        <Text style={s.sectionTitle}>{title}</Text>
        <Text style={s.emptyDescription}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

function ScanScreen() {
  return (
    <EmptyScreen
      icon="qr-code-outline"
      title="Quét mã điểm danh"
      description="Tính năng quét mã đang được chuẩn bị. Bạn sẽ có thể quét mã QR của giảng viên tại đây."
    />
  );
}

function HistoryScreen() {
  return (
    <EmptyScreen
      icon="time-outline"
      title="Lịch sử điểm danh"
      description="Tính năng lịch sử đang được chuẩn bị. Kết quả điểm danh của bạn sẽ được hiển thị tại đây."
    />
  );
}

function HomeScreen({
  user,
  onLogout,
  navigation,
}: {
  user: User;
  onLogout: () => Promise<void>;
  navigation: BottomTabScreenProps<Tabs, 'Home'>['navigation'];
}) {
  const [loggingOut, setLoggingOut] = useState(false);

  const roleLabel =
    user.role === 'STUDENT'
      ? 'Sinh viên'
      : user.role === 'ADMIN'
        ? 'Quản trị viên'
        : 'Giảng viên';

  function confirmLogout() {
    Alert.alert('Đăng xuất?', 'Bạn muốn đăng xuất khỏi tài khoản này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await onLogout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView contentContainerStyle={s.homeContent}>
        <View style={s.rowBetween}>
          <View>
            <Text style={s.brand}>SMART CLASSROOM</Text>
            <Text style={s.greeting}>Chào bạn,</Text>
            <Text style={s.name}>{user.username}</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {user.username.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={s.studentCard}>
          <View style={s.rowBetween}>
            <View style={s.lightBadge}>
              <Ionicons name="school-outline" size={17} color="white" />
              <Text style={s.whiteSmall}>TÀI KHOẢN HỌC TẬP</Text>
            </View>
            <Ionicons name="shield-checkmark-outline" size={25} color="#BFD7FF" />
          </View>

          <Text style={s.cardName}>{user.username}</Text>
          <Text style={s.cardSubtitle}>{roleLabel}</Text>

          <View style={s.cardDivider} />
          <View style={s.rowBetween}>
            <Text style={s.cardSubtitle}>Mã tài khoản</Text>
            <Text style={s.cardId}>#{user.id}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Điểm danh hôm nay</Text>

        <Pressable
          onPress={() => navigation.navigate('Scan')}
          style={({ pressed }) => [
            s.scanCard,
            pressed && s.pressed,
          ]}
        >
          <View style={s.scanIcon}>
            <Ionicons name="qr-code-outline" size={29} color="white" />
          </View>
          <View style={s.flex}>
            <Text style={s.actionTitle}>Quét mã điểm danh</Text>
            <Text style={s.actionSubtitle}>Mở màn hình quét QR</Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color={BLUE} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('History')}
          style={({ pressed }) => [s.historyCard, pressed && s.pressed]}
        >
          <View style={s.smallIcon}>
            <Ionicons name="time-outline" size={25} color={BLUE} />
          </View>
          <View style={s.flex}>
            <Text style={s.actionTitle}>Lịch sử điểm danh</Text>
            <Text style={s.actionSubtitle}>Theo dõi kết quả của bạn</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
        </Pressable>

        <View style={s.tip}>
          <Ionicons name="information-circle-outline" size={21} color={BLUE} />
          <Text style={s.tipText}>
            Khi điểm danh, hãy bật vị trí và kết nối mạng theo yêu cầu của lớp học.
          </Text>
        </View>

        <Pressable
          disabled={loggingOut}
          onPress={confirmLogout}
          style={s.logout}
        >
          <Ionicons name="log-out-outline" size={20} color="#667085" />
          <Text style={s.logoutText}>
            {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  async function handleLogin() {
    if (loading) return;

    if (!username.trim() || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tài khoản và mật khẩu.');
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
        signal: controller.signal,
      });

      const result = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Đăng nhập thất bại',
          response.status === 401
            ? 'Tài khoản hoặc mật khẩu không đúng.'
            : response.status === 429
              ? 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.'
              : 'Máy chủ chưa xử lý được yêu cầu.'
        );
        return;
      }

      const token = result.data?.token;
      const account = result.data?.user;

      if (
        typeof token !== 'string' ||
        !token ||
        typeof account?.id !== 'number' ||
        typeof account?.username !== 'string' ||
        typeof account?.role !== 'string'
      ) {
        Alert.alert('Lỗi dữ liệu', 'Thông tin máy chủ trả về chưa hợp lệ.');
        return;
      }

      try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } catch {
        Alert.alert('Lỗi lưu phiên', 'Không lưu được token. Vui lòng thử lại.');
        return;
      }

      setPassword('');
      setShowPassword(false);
      setUser(account);
    } catch {
      Alert.alert(
        'Lỗi kết nối',
        'Kiểm tra Docker, Wi-Fi và địa chỉ IP của Mac.'
      );
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setPassword('');
      setUser(null);
    } catch {
      Alert.alert('Đăng xuất thất bại', 'Vui lòng thử lại.');
    }
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      {user ? (
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: BLUE,
              tabBarInactiveTintColor: '#98A2B3',
              tabBarHideOnKeyboard: true,
              tabBarStyle: {
                backgroundColor: 'white',
                borderTopColor: '#EDF0F5',
              },
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
              },
              tabBarIcon: ({ focused, color, size }) => {
                const icons: Record<keyof Tabs, IconName> = {
                  Home: focused ? 'home' : 'home-outline',
                  Scan: 'qr-code-outline',
                  History: focused ? 'time' : 'time-outline',
                };

                return (
                  <Ionicons
                    name={icons[route.name]}
                    size={size}
                    color={color}
                  />
                );
              },
            })}
          >
            <Tab.Screen name="Home" options={{ title: 'Trang chủ' }}>
              {({ navigation }) => (
                <HomeScreen
                  user={user}
                  onLogout={handleLogout}
                  navigation={navigation}
                />
              )}
            </Tab.Screen>
            <Tab.Screen
              name="Scan"
              component={ScanScreen}
              options={{ title: 'Quét QR' }}
            />
            <Tab.Screen
              name="History"
              component={HistoryScreen}
              options={{ title: 'Lịch sử' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      ) : (
        <SafeAreaView style={s.screen}>
          <KeyboardAvoidingView
            style={s.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={s.loginContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={s.logo}>
                <Ionicons name="school" size={34} color="white" />
              </View>
              <Text style={s.brand}>SMART CLASSROOM</Text>
              <Text style={s.loginTitle}>Lớp học thông minh.{'\n'}Khởi đầu từ bạn.</Text>
              <Text style={s.loginSubtitle}>
                Đăng nhập tài khoản sinh viên để bắt đầu.
              </Text>

              <View style={s.form}>
                <Text style={s.label}>Tài khoản</Text>
                <View style={s.inputRow}>
                  <Ionicons name="person-outline" size={20} color="#98A2B3" />
                  <TextInput
                    style={s.input}
                    placeholder="Tên đăng nhập"
                    placeholderTextColor="#98A2B3"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    editable={!loading}
                  />
                </View>

                <Text style={s.label}>Mật khẩu</Text>
                <View style={s.inputRow}>
                  <Ionicons name="lock-closed-outline" size={20} color="#98A2B3" />
                  <TextInput
                    style={s.input}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor="#98A2B3"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    editable={!loading}
                    onSubmitEditing={handleLogin}
                  />
                  <Pressable
                    accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={21}
                      color="#667085"
                    />
                  </Pressable>
                </View>

                <Pressable
                  disabled={loading}
                  onPress={handleLogin}
                  style={({ pressed }) => [
                    s.loginButton,
                    (pressed || loading) && s.pressed,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={s.buttonText}>Đăng nhập</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </Pressable>
              </View>

              <View style={s.footer}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#98A2B3" />
                <Text style={s.footerText}>Hệ thống điểm danh thông minh</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#F6F8FC' },
  pressed: { opacity: 0.7 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 26,
    paddingVertical: 40,
  },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  loginTitle: {
    color: '#14213A',
    fontSize: 30,
    lineHeight: 39,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 15,
  },
  loginSubtitle: {
    color: '#7A8496',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 28,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EDF0F6',
  },
  label: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 9,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E9EDF4',
    borderRadius: 13,
    paddingHorizontal: 13,
    marginBottom: 19,
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 15,
    color: '#14213A',
    fontSize: 15,
  },
  loginButton: {
    minHeight: 52,
    backgroundColor: BLUE,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 3,
  },
  buttonText: { color: 'white', fontSize: 15, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 26,
  },
  footerText: { color: '#98A2B3', fontSize: 11 },
  homeContent: { padding: 24, gap: 20, paddingBottom: 30 },
  greeting: { color: '#7A8496', fontSize: 14, marginTop: 17 },
  name: {
    color: '#14213A',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 3,
    maxWidth: 255,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: BLUE, fontSize: 22, fontWeight: '700' },
  studentCard: {
    backgroundColor: '#1765EE',
    borderRadius: 24,
    padding: 22,
    marginTop: 4,
  },
  lightBadge: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  whiteSmall: {
    color: '#DFEBFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardName: {
    color: 'white',
    fontSize: 25,
    fontWeight: '700',
    marginTop: 26,
  },
  cardSubtitle: { color: '#D4E3FF', fontSize: 12, marginTop: 5 },
  cardDivider: {
    height: 1,
    backgroundColor: '#FFFFFF30',
    marginTop: 22,
    marginBottom: 13,
  },
  cardId: { color: 'white', fontSize: 13, fontWeight: '600' },
  sectionTitle: { color: '#14213A', fontSize: 18, fontWeight: '700' },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#EAF1FF',
    borderWidth: 1,
    borderColor: '#DCE8FF',
    borderRadius: 20,
    padding: 17,
  },
  scanIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { color: '#14213A', fontSize: 15, fontWeight: '700' },
  actionSubtitle: {
    color: '#7A8496',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 17,
    borderRadius: 20,
    gap: 14,
  },
  smallIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F0F5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  tipText: { flex: 1, color: '#7A8496', fontSize: 12, lineHeight: 19 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
  },
  logoutText: { color: '#667085', fontSize: 13, fontWeight: '600' },
  pageHeader: { padding: 24, gap: 14 },
  pageTitle: { color: '#14213A', fontSize: 27, fontWeight: '800' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingBottom: 70,
    gap: 17,
  },
  largeIcon: {
    width: 92,
    height: 92,
    borderRadius: 30,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  emptyDescription: {
    color: '#7A8496',
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'center',
  },
});