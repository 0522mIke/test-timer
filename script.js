 // タイマー状態管理
        const timerState = {
            remainingTime: 0,
            totalTime: 0,
            isRunning: false,
            interval: null,
            notifications: {
                '10min': false,
                '5min': false,
                '1min': false,
                '10sec': false
            }
        };

        // 要素の取得
        const timerDisplay = document.getElementById('timerDisplay');
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const minutesInput = document.getElementById('minutes');

        // 初期化
        function initTimer() {
            updateStats();
            updateDisplay();
        }

        // プリセット時間設定
        function setPresetTime(minutes) {
              document.getElementById('minutes').value = minutes;
              document.getElementById('seconds').value = 0;
              if (!timerState.isRunning) {
                  resetTimer();
              }
          }

        // タイマー開始
        function startTimer() {
            if (!timerState.isRunning) {
              const minutes = parseInt(document.getElementById('minutes').value) || 0;
              const seconds = parseInt(document.getElementById('seconds').value) || 0;
              const totalSeconds = minutes * 60 + seconds;
              
              if (totalSeconds <= 0) {
                  alert('正しい時間を入力してください');
                  return;
              }
              
              timerState.remainingTime = totalSeconds;
              timerState.totalTime = totalSeconds;
              timerState.notifications['10min'] = false;
              timerState.notifications['5min'] = false;
              timerState.notifications['1min'] = false;
              timerState.notifications['10sec'] = false;
          }

            timerState.isRunning = true;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            minutesInput.disabled = true;

            timerState.interval = setInterval(() => {
                timerState.remainingTime--;
                updateDisplay();
                checkNotifications();

                if (timerState.remainingTime <= 0) {
                    finishTimer();
                }
            }, 1000);
        }

        // タイマー一時停止
        function pauseTimer() {
            timerState.isRunning = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            clearInterval(timerState.interval);
        }

        // タイマーリセット
        function resetTimer() {
              timerState.isRunning = false;
              timerState.remainingTime = 0;
              timerState.notifications['10min'] = false;
              timerState.notifications['5min'] = false;
              timerState.notifications['1min'] = false;
              timerState.notifications['10sec'] = false;
              
              clearInterval(timerState.interval);
              
              startBtn.disabled = false;
              pauseBtn.disabled = true;
              document.getElementById('minutes').disabled = false;
              document.getElementById('seconds').disabled = false;
              
              updateDisplay();
          }

        // タイマー終了
        function finishTimer() {
            timerState.isRunning = false;
            clearInterval(timerState.interval);
            
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            minutesInput.disabled = false;
            
            // 完了通知
            if (document.getElementById('notifyFinish').checked) {
                playAlarm();
                setTimeout(() => {
                    speakText('終了しました');
                }, 1000);
                setTimeout(() => {
                    alert('⏰ 時間終了です！\nお疲れ様でした！');
                }, 2000);
            }
            
            // 統計更新
            updateSessionStats();
            updateDisplay();
        }

        // 表示更新
        function updateDisplay() {
            const minutes = Math.floor(timerState.remainingTime / 60);
            const seconds = timerState.remainingTime % 60;
            
            timerDisplay.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // 色の変更
            timerDisplay.className = 'timer-display';
            if (timerState.isRunning) {
                if (timerState.remainingTime <= 300) { // 5分以下
                    timerDisplay.classList.add('danger');
                } else if (timerState.remainingTime <= 600) { // 10分以下
                    timerDisplay.classList.add('warning');
                } else {
                    timerDisplay.classList.add('running');
                }
            }
        }

        // 通知チェック
        function checkNotifications() {
            // 10分前通知
            if (timerState.remainingTime === 600 && !timerState.notifications['10min']) {
                if (document.getElementById('notify10min').checked) {
                    timerState.notifications['10min'] = true;
                    playNotificationSound();
                    speakText('10分前です');
                    showNotification('⏰ 残り10分です');
                }
            }
            
            // 5分前通知
            if (timerState.remainingTime === 300 && !timerState.notifications['5min']) {
                if (document.getElementById('notify5min').checked) {
                    timerState.notifications['5min'] = true;
                    playNotificationSound();
                    speakText('5分前です');
                    showNotification('⏰ 残り5分です');
                }
            }
            
            // 1分前通知
            if (timerState.remainingTime === 60 && !timerState.notifications['1min']) {
                if (document.getElementById('notify1min').checked) {
                    timerState.notifications['1min'] = true;
                    playNotificationSound();
                    speakText('1分前です');
                    showNotification('⏰ 残り1分です');
                }
            }
            
            // 10秒前通知
            if (timerState.remainingTime === 10 && !timerState.notifications['10sec']) {
                if (document.getElementById('notify10sec').checked) {
                    timerState.notifications['10sec'] = true;
                    playNotificationSound();
                    speakText('10秒前');
                    showNotification('⏰ 残り10秒です');
                }
            }
        }

        // 通知表示
        function showNotification(message) {
            // ブラウザ通知をサポートしている場合
            if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification(message);
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification(message);
                        }
                    });
                }
            }
        }

        // 音声合成で通知
        function speakText(text) {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ja-JP';
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 0.8;
                speechSynthesis.speak(utterance);
            }
        }

        // 通知音（短いビープ音）
        function playNotificationSound() {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }

        // アラーム音（終了時の長い音）
        function playAlarm() {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 複数の音を重ねてアラーム音を作成
            const frequencies = [800, 1000, 1200];
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'square';
                
                const startTime = audioContext.currentTime + (index * 0.1);
                gainNode.gain.setValueAtTime(0.2, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.8);
            });
        }

        // セッション統計更新
        function updateSessionStats() {
            const currentCount = parseInt(sessionStorage.getItem('sessionCount') || '0');
            const currentTotalTime = parseInt(sessionStorage.getItem('totalTime') || '0');
            
            const newCount = currentCount + 1;
            const newTotalTime = currentTotalTime + Math.ceil(timerState.totalTime / 60);
            
            sessionStorage.setItem('sessionCount', newCount.toString());
            sessionStorage.setItem('totalTime', newTotalTime.toString());
            
            updateStats();
        }

        // 統計表示更新
        function updateStats() {
            const sessionCount = parseInt(sessionStorage.getItem('sessionCount') || '0');
            const totalTime = parseInt(sessionStorage.getItem('totalTime') || '0');
            const avgTime = sessionCount > 0 ? Math.round(totalTime / sessionCount) : 0;
            
            document.getElementById('sessionCount').textContent = `${sessionCount}回`;
            document.getElementById('totalTime').textContent = `${totalTime}分`;
            document.getElementById('avgTime').textContent = `${avgTime}分`;
        }

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (timerState.isRunning) {
                    pauseTimer();
                } else {
                    startTimer();
                }
            } else if (e.code === 'Escape') {
                resetTimer();
            }
        });

        // 初期化実行
        initTimer();
        
        // ブラウザ通知の許可を要求
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }