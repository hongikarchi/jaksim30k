import { useLocalSearchParams } from 'expo-router';

import { Screen, Text } from '../../../components';
import { entryKey, galleryEntries } from '../../../dev/gallery';

/** 갤러리 한 화면: /dev/gallery/19 또는 /dev/gallery/12-첫약속 */
export default function GalleryItem() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const e = galleryEntries.find((x) => entryKey(x) === decodeURIComponent(key ?? ''));
  if (!e)
    return (
      <Screen>
        <Text>갤러리에 없는 화면이에요: {key}</Text>
      </Screen>
    );
  return e.render();
}
