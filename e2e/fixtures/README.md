# E2E Test Fixtures

이 디렉토리에는 E2E 테스트를 위한 픽스처 파일들이 포함되어 있습니다.

## SSH 테스트 키

### test_host_rsa_key
- **용도**: Mock SSH 서버의 호스트 키
- **타입**: RSA 2048bit
- **설명**: 테스트 전용 SSH 서버가 사용하는 프라이빗 키입니다.

### test_host_rsa_key.pub
- **용도**: 위 키의 공개 키
- **설명**: 호스트 키 검증에 사용됩니다.

**주의**: 이 키들은 테스트 전용이며 실제 서버에서는 절대 사용하지 마세요!

## 파일 목록

- `ssh-server.ts`: Mock SSH 서버 구현
- `test_host_rsa_key`: SSH 호스트 프라이빗 키 (테스트용)
- `test_host_rsa_key.pub`: SSH 호스트 공개 키 (테스트용)
- `.gitkeep`: Git 디렉토리 추적용
