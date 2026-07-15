import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActionToast,
  Toast,
  TOAST_ANIMATIONS,
  TOAST_MODES,
  TOAST_POSITIONS,
} from '@sekizlipenguen/react-native-popup-confirm-toast';

const BRAND = '#D6001F';
const SUCCESS = '#2E7D32';
const BOTTOM_OFFSET = Platform.OS === 'ios' ? 81 : 96;

const POSITION_CASES = [
  [TOAST_POSITIONS.top, 'Üst'],
  [TOAST_POSITIONS.bottom, 'Alt'],
  [TOAST_POSITIONS.center, 'Orta'],
  [TOAST_POSITIONS.topLeft, 'Sol üst'],
  [TOAST_POSITIONS.topRight, 'Sağ üst'],
  [TOAST_POSITIONS.bottomLeft, 'Sol alt'],
  [TOAST_POSITIONS.bottomRight, 'Sağ alt'],
];

const ANIMATION_CASES = [
  [TOAST_ANIMATIONS.spring, 'Yay'],
  [TOAST_ANIMATIONS.slide, 'Kaydır'],
  [TOAST_ANIMATIONS.fade, 'Soluklaş'],
  [TOAST_ANIMATIONS.fadeSlide, 'Soluk + kaydır'],
  [TOAST_ANIMATIONS.none, 'Anında'],
];

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function DemoButton({label, onPress, tone = 'dark', disabled = false}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.82}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        tone === 'brand' && styles.buttonBrand,
        tone === 'success' && styles.buttonSuccess,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Section({title, description, children}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      <View style={styles.buttonRow}>{children}</View>
    </View>
  );
}

/**
 * Git-only ActionToast test screen.
 *
 * Add this component to a development-only navigation route. The application
 * root must already be wrapped with the package's <Root> component.
 */
export default function ActionToastPlayground() {
  const [tourRunning, setTourRunning] = useState(false);
  const sequenceRef = useRef(0);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);
  const timersRef = useRef(new Set());

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cancelledRef.current = true;
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
      ActionToast.clear();
    };
  }, []);

  const schedule = (callback, delay) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      if (mountedRef.current) {
        callback();
      }
    }, delay);
    timersRef.current.add(timer);
  };

  const show = (label, config = {}) => {
    sequenceRef.current += 1;
    return ActionToast.show({
      duration: 3500,
      position: TOAST_POSITIONS.bottom,
      bottomOffset: BOTTOM_OFFSET,
      ...config,
      message: config.message || `${label} #${sequenceRef.current}`,
    });
  };

  const showPosition = (position, label) => {
    const isBottom = String(position).toLowerCase().includes('bottom');
    show(label, {
      type: 'info',
      title: label,
      position,
      offset: 24,
      bottomOffset: isBottom ? BOTTOM_OFFSET : 24,
      message: `Konum: ${label}`,
    });
  };

  const showStack = () => {
    for (let index = 0; index < 5; index += 1) {
      schedule(() => {
        show('Üst üste', {
          type: 'success',
          title: `Stack ${index + 1}`,
          message: `Bildirim ${index + 1} / 5 — ekranda en fazla 3`,
          mode: TOAST_MODES.stack,
          maxVisible: 3,
          backgroundColor: SUCCESS,
          duration: 4000,
        });
      }, index * 140);
    }
  };

  const showQueue = () => {
    for (let index = 0; index < 4; index += 1) {
      schedule(() => {
        show('Sırayla', {
          type: 'info',
          title: `Queue ${index + 1}`,
          message: `Sıra ${index + 1} / 4`,
          mode: TOAST_MODES.queue,
          duration: 1800,
        });
      }, index * 80);
    }
  };

  const showIdReplacement = () => {
    const id = 'playground-replace';
    show('Aynı id', {
      id,
      type: 'info',
      title: 'İlk içerik',
      message: 'Bir saniye sonra aynı kart güncellenecek.',
      duration: 5000,
    });
    schedule(() => {
      show('Aynı id', {
        id,
        type: 'success',
        title: 'Kart güncellendi',
        message: 'Yeni kart eklenmedi; mevcut id değiştirildi.',
        backgroundColor: SUCCESS,
        duration: 3500,
      });
    }, 1000);
  };

  const runVisualTour = async () => {
    if (tourRunning) {
      return;
    }

    cancelledRef.current = false;
    setTourRunning(true);
    ActionToast.clear();
    await wait(200);

    const showAndWait = async (config, delay = 850) => {
      if (cancelledRef.current) {
        return false;
      }
      ActionToast.show({
        duration: Math.max(450, delay - 100),
        ...config,
      });
      await wait(delay);
      return !cancelledRef.current;
    };

    try {
      for (const [position, label] of POSITION_CASES) {
        const isBottom = String(position).toLowerCase().includes('bottom');
        const shouldContinue = await showAndWait({
          type: position === TOAST_POSITIONS.center ? 'warning' : 'info',
          title: label,
          message: `Konum: ${label}`,
          position,
          offset: 24,
          bottomOffset: isBottom ? BOTTOM_OFFSET : 24,
        });
        if (!shouldContinue) {
          return;
        }
      }

      ActionToast.clear();
      await wait(200);

      for (let index = 0; index < 3; index += 1) {
        ActionToast.show({
          type: 'success',
          title: `Stack ${index + 1}`,
          message: 'Üç kart aynı anda görünmeli.',
          mode: TOAST_MODES.stack,
          maxVisible: 3,
          backgroundColor: SUCCESS,
          bottomOffset: BOTTOM_OFFSET,
          duration: 1800,
        });
      }
      await wait(1100);
      if (cancelledRef.current) {
        return;
      }
      ActionToast.clear();
      await wait(200);
      if (cancelledRef.current) {
        return;
      }

      for (let index = 0; index < 3; index += 1) {
        ActionToast.show({
          type: 'info',
          title: `Queue ${index + 1}`,
          message: 'Her seferinde yalnızca bir kart görünmeli.',
          mode: TOAST_MODES.queue,
          bottomOffset: BOTTOM_OFFSET,
          duration: 650,
        });
      }
      await wait(2200);
      if (cancelledRef.current) {
        return;
      }

      for (const [animation, label] of ANIMATION_CASES) {
        const shouldContinue = await showAndWait({
          type: 'warning',
          title: label,
          message: `Animasyon: ${label}`,
          animation,
          position: TOAST_POSITIONS.bottom,
          bottomOffset: BOTTOM_OFFSET,
        }, 700);
        if (!shouldContinue) {
          return;
        }
      }

      Toast.show({
        title: 'Eski API',
        text: 'Toast.show çağrısı ActionToast kartına yönlendirildi.',
        backgroundColor: '#702C91',
        timing: 1100,
        position: 'top',
        icon: '✓',
      });
      await wait(1250);

      if (mountedRef.current && !cancelledRef.current) {
        Alert.alert(
          'Görsel tur tamamlandı',
          'Konumlar, stack, queue, animasyonlar ve eski Toast.show uyumluluğu çalıştırıldı.',
        );
      }
    } finally {
      ActionToast.clear();
      if (mountedRef.current) {
        setTourRunning(false);
      }
    }
  };

  const stopVisualTour = () => {
    cancelledRef.current = true;
    ActionToast.clear();
    setTourRunning(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>ActionToast Playground</Text>
      <Text style={styles.subtitle}>
        Tüm public API davranışlarını uygulamanın gerçek ekran katmanında gözle kontrol edin.
      </Text>

      <View style={styles.tourCard}>
        <Text style={styles.tourTitle}>Otomatik görsel tur</Text>
        <Text style={styles.tourDescription}>
          Yedi konum, stack, queue, beş animasyon ve eski Toast.show uyumluluğunu sırayla açar.
        </Text>
        <View style={styles.buttonRow}>
          <DemoButton
            label={tourRunning ? 'Tur çalışıyor…' : 'Turu başlat'}
            tone="success"
            disabled={tourRunning}
            onPress={runVisualTour}
          />
          <DemoButton label="Durdur / temizle" tone="brand" onPress={stopVisualTour}/>
        </View>
      </View>

      <Section
        title="Kuyruk davranışı"
        description="Stack aynı anda en fazla üç kart; queue her seferinde tek kart gösterir."
      >
        <DemoButton label="Üst üste 5" tone="brand" onPress={showStack}/>
        <DemoButton label="Sırayla 4" onPress={showQueue}/>
        <DemoButton label="Hepsini kapat" onPress={() => ActionToast.clear()}/>
      </Section>

      <Section title="Bildirim tipi">
        <DemoButton
          label="Başarılı"
          onPress={() => show('Başarılı', {
            type: 'success',
            title: 'Başarılı',
            backgroundColor: SUCCESS,
          })}
        />
        <DemoButton
          label="Hata"
          onPress={() => show('Hata', {type: 'error', title: 'Hata'})}
        />
        <DemoButton
          label="Uyarı"
          onPress={() => show('Uyarı', {type: 'warning', title: 'Uyarı'})}
        />
        <DemoButton
          label="Bilgi"
          onPress={() => show('Bilgi', {type: 'info', title: 'Bilgi'})}
        />
        <DemoButton
          label="Yükleniyor"
          onPress={() => show('Yükleniyor', {
            type: 'loading',
            title: 'Yükleniyor',
            message: 'Kalıcıdır; × ile kapatın.',
            duration: 0,
          })}
        />
      </Section>

      <Section title="Ekran konumu">
        {POSITION_CASES.map(([position, label]) => (
          <DemoButton
            key={position}
            label={label}
            onPress={() => showPosition(position, label)}
          />
        ))}
      </Section>

      <Section title="Giriş animasyonu">
        {ANIMATION_CASES.map(([animation, label]) => (
          <DemoButton
            key={animation}
            label={label}
            onPress={() => show(label, {
              type: 'warning',
              title: label,
              animation,
            })}
          />
        ))}
      </Section>

      <Section title="Etkileşim ve özel durumlar">
        <DemoButton
          label="Sepet CTA"
          tone="brand"
          onPress={() => ActionToast.show({
            message: 'Ürün sepete eklendi.',
            duration: 4000,
            bottomOffset: BOTTOM_OFFSET,
            action: {
              node: <Text style={styles.actionIcon}>🛒</Text>,
              backgroundColor: BRAND,
              accessibilityLabel: 'Sepete git',
              onPress: () => Alert.alert('CTA', 'Sepet aksiyonu çalıştı.'),
            },
          })}
        />
        <DemoButton
          label="Karta bas / kapat"
          onPress={() => show('Tıklanabilir', {
            type: 'success',
            title: 'Karta basın',
            message: 'Kart kapanır ve callback çalışır.',
            backgroundColor: SUCCESS,
            pressDismiss: true,
            onPress: () => Alert.alert('Kart', 'Kart callback’i çalıştı.'),
          })}
        />
        <DemoButton
          label="Kalıcı"
          onPress={() => show('Kalıcı', {
            type: 'warning',
            title: 'Kalıcı bildirim',
            message: 'Otomatik kapanmaz.',
            duration: 0,
          })}
        />
        <DemoButton label="Aynı id güncelle" onPress={showIdReplacement}/>
        <DemoButton
          label="Eski Toast.show"
          tone="success"
          onPress={() => Toast.show({
            title: 'Eski API',
            text: 'Yeni ActionToast kartına yönlendirildi.',
            backgroundColor: '#702C91',
            timing: 3500,
            position: 'top',
            icon: '✓',
          })}
        />
      </Section>

      <Text style={styles.footer}>
        Bu ekran yalnızca geliştirme/test içindir. Üretim navigation ağacına eklemeyin.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },
  title: {
    color: '#171717',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#60646C',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 18,
  },
  tourCard: {
    backgroundColor: '#171717',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  tourTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  tourDescription: {
    color: '#C9CCD1',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 12,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    color: '#232323',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionDescription: {
    color: '#747880',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#33363B',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginRight: 7,
    marginBottom: 7,
  },
  buttonBrand: {
    backgroundColor: BRAND,
  },
  buttonSuccess: {
    backgroundColor: SUCCESS,
  },
  buttonDisabled: {
    opacity: 0.48,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionIcon: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  footer: {
    color: '#7B7F86',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
});
