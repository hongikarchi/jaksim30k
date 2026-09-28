import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Header, Screen, Text } from '../../../components';
import { entryKey, galleryEntries } from '../../../dev/gallery';
import { colors } from '../../../theme';

/** 4단계 화면 갤러리 (개발용): 모든 화면을 번호순으로 모아 본다 */
export default function Gallery() {
  return (
    <Screen scroll gap={8}>
      <Header onBack={() => router.back()} title={`화면 갤러리 · ${galleryEntries.length}개`} />
      {galleryEntries.map((e) => (
        <Pressable
          key={entryKey(e)}
          onPress={() => router.push(`/dev/gallery/${entryKey(e)}` as never)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
            padding: 14,
            borderRadius: 14,
            backgroundColor: pressed ? colors.fill : colors.surface,
          })}
        >
          <View style={{ width: 28 }}>
            <Text size={13} weight="bold" color="text3">
              {e.n}
            </Text>
          </View>
          <Text size={15} weight="semibold" style={{ flex: 1 }}>
            {e.title}
            {e.variant ? ` · ${e.variant}` : ''}
          </Text>
        </Pressable>
      ))}
    </Screen>
  );
}
