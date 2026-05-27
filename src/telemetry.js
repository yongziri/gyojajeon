// ════════════════════════════════════════════════════════════
//  telemetry.js — 교사용 실시간 대시보드를 위한 진행도 발행
//
//  · MQTT(WebSocket)로 학생의 게임 진행도를 broker에 발행한다.
//  · 게임은 MQTT 없이도 100% 동작한다 — 연결 실패는 조용히 무시.
//  · 교사는 dashboard.html 로 같은 broker·교실코드를 구독해 본다.
//
//  토픽:  aralsea/<교실코드>/student/<참가ID>
// ════════════════════════════════════════════════════════════
(function () {
  // 공개 MQTT broker (WebSocket Secure). 별도 설치 불필요.
  const BROKER = 'wss://broker.emqx.io:8084/mqtt';

  let client = null;
  let connected = false;
  let myId = null;

  // 참가 ID — PC마다 고정 (localStorage)
  function getId() {
    if (myId) return myId;
    try {
      myId = localStorage.getItem('aral_id');
      if (!myId) {
        myId = 'AR-' + Math.floor(1000 + Math.random() * 9000);
        localStorage.setItem('aral_id', myId);
      }
    } catch (e) {
      myId = 'AR-' + Math.floor(1000 + Math.random() * 9000);
    }
    return myId;
  }

  // 화면 상단 입력값 — 참가번호/이름
  function getName() {
    const el = document.getElementById('cfgName');
    const v = el && el.value ? el.value.trim() : '';
    return v || getId();
  }

  // 교실 코드 (학생·교사가 같아야 연결됨)
  function getRoom() {
    const el = document.getElementById('cfgRoom');
    const v = el && el.value ? el.value.trim() : '';
    return v || 'aralsea-1';
  }

  function topicFor(room) {
    return 'aralsea/' + room + '/student/' + getId();
  }

  const Telemetry = {
    // 게임 시작 시 한 번 호출 — broker 연결 시도
    init() {
      if (typeof mqtt === 'undefined') return;   // 라이브러리 없음 → 무시
      try {
        const room = getRoom();
        client = mqtt.connect(BROKER, {
          clientId: 'aral-game-' + getId() + '-' + Date.now(),
          connectTimeout: 6000,
          reconnectPeriod: 10000,
          clean: true,
          // 비정상 종료 시 broker가 대신 "오프라인" 발행 (Last Will)
          will: {
            topic: topicFor(room),
            payload: JSON.stringify({ id: getId(), online: false, ts: Date.now() }),
            qos: 0, retain: true
          }
        });
        client.on('connect', () => { connected = true; });
        client.on('error', () => { /* 무시 */ });
        client.on('close', () => { connected = false; });
        client.on('offline', () => { connected = false; });
      } catch (e) { /* 무시 — 게임은 정상 진행 */ }
    },

    // 진행도 스냅샷 발행 (retain — 늦게 접속한 대시보드도 즉시 봄)
    update(state) {
      if (!client || !connected) return;
      try {
        const msg = Object.assign({
          id: getId(), name: getName(), online: true, ts: Date.now()
        }, state || {});
        client.publish(topicFor(getRoom()), JSON.stringify(msg),
          { qos: 0, retain: true });
      } catch (e) { /* 무시 */ }
    },

    isConnected() { return connected; }
  };

  window.Telemetry = Telemetry;
})();
