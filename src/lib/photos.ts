/**
 * 촬영한 사진을 앱 문서 폴더로 옮겨 보관한다 (SPEC 7.3: 이의제기 대응을 위해 보관).
 * 카메라가 준 주소는 임시 캐시라 기기가 지울 수 있다. 웹이나 실패 시에는 원래 주소를 그대로 쓴다.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export function keepPhoto(uri: string | undefined): string | undefined {
  if (!uri || Platform.OS === 'web' || uri.startsWith(Paths.document.uri)) return uri;
  try {
    const dir = new Directory(Paths.document, 'photos');
    if (!dir.exists) dir.create({ intermediates: true });
    const src = new File(uri);
    const dest = new File(dir, `${Date.now()}-${src.name}`);
    src.copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}
