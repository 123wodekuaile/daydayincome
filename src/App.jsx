/**
 * src/App.jsx
 */
import { useState, useEffect, useRef } from 'react';
import { ConfigProvider, theme, Form, InputNumber, TimePicker, Button, message, Card, Typography } from 'antd';
import dayjs from 'dayjs';
import locale from 'antd/locale/zh_CN';

const { ipcRenderer } = window.require('electron'); 
const { Title, Text } = Typography;

// --- 样式定义 ---
const styles = {
  // 悬浮窗容器
  floatingContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    // 允许拖拽
    WebkitAppRegion: 'drag', 
    userSelect: 'none',
    overflow: 'visible', // 允许按钮超出
  },
  // 核心数字卡片
  contentCard: {
    background: 'rgba(0, 0, 0, 0.75)', 
    backdropFilter: 'blur(12px)', 
    padding: '15px 25px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    textAlign: 'center',
    color: '#4caf50',
    position: 'relative',
    cursor: 'default',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    minWidth: '180px',
  },
  money: {
    fontSize: '2.2rem',
    fontWeight: '800',
    fontFamily: '"SF Mono", "Roboto Mono", monospace',
    color: '#FFD700', // 金色
    textShadow: '0 0 15px rgba(255, 215, 0, 0.4)', // 增加金色光晕
    letterSpacing: '-1px',
    margin: 0,
    lineHeight: 1,
  },
  label: {
    fontSize: '0.8rem', 
    color: '#aaa',
    marginBottom: '5px',
    letterSpacing: '1px',
    fontWeight: 'bold',
  },
  // 设置按钮
  settingsBtn: {
    position: 'absolute',
    bottom: '-28px', 
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#333',
    color: '#eee',
    border: '1px solid #444',
    borderTop: 'none',
    padding: '6px 16px',
    borderRadius: '0 0 10px 10px',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    WebkitAppRegion: 'no-drag', // 必须设置，否则无法点击
    zIndex: -1,
  },
};

const useConfig = () => {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('dayday-config');
    return saved ? JSON.parse(saved) : {
      salary: 20000,
      workDays: 22,
      startTime: '09:30',
      endTime: '18:30'
    };
  });

  useEffect(() => {
    const handleRefresh = () => {
      const saved = localStorage.getItem('dayday-config');
      if (saved) setConfig(JSON.parse(saved));
    };
    ipcRenderer.on('refresh-data', handleRefresh);
    return () => ipcRenderer.removeListener('refresh-data', handleRefresh);
  }, []);

  return [config, setConfig];
};

const FloatingWindow = ({ config }) => {
  const [earned, setEarned] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  useEffect(() => {
    const calculate = () => {
      const cfg = configRef.current;
      const now = new Date();
      
      const [sH, sM] = cfg.startTime.split(':').map(Number);
      const [eH, eM] = cfg.endTime.split(':').map(Number);
      
      const start = new Date(); start.setHours(sH, sM, 0, 0);
      const end = new Date(); end.setHours(eH, eM, 0, 0);

      if (now < start) return setEarned(0);
      
      const dailySalary = cfg.salary / cfg.workDays;
      if (now > end) return setEarned(dailySalary);

      const totalMs = end - start;
      const elapsedMs = now - start;
      
      if (totalMs <= 0) return setEarned(0);

      const moneyPerMs = dailySalary / totalMs;
      setEarned(elapsedMs * moneyPerMs);
    };

    calculate();
    const timer = setInterval(calculate, 50); 
    return () => clearInterval(timer);
  }, []); 

  return (
    <div 
      style={styles.floatingContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.contentCard}>
        <div style={styles.label}>今日入账</div>
        <div style={styles.money}>¥{earned.toFixed(2)}</div>
        
        <button 
          onClick={() => ipcRenderer.send('open-settings')}
          style={{
            ...styles.settingsBtn,
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-10px)',
          }}
        >
          ⚙️ 设置
        </button>
      </div>
    </div>
  );
};

const SettingsWindow = ({ config: initialConfig }) => {
  const [form] = Form.useForm();

  // 初始化表单数据
  useEffect(() => {
    form.setFieldsValue({
      salary: initialConfig.salary,
      workDays: initialConfig.workDays,
      // 将字符串 "09:30" 转为 dayjs 对象
      startTime: dayjs(initialConfig.startTime, 'HH:mm'),
      endTime: dayjs(initialConfig.endTime, 'HH:mm'),
    });
  }, [initialConfig, form]);

  const onFinish = (values) => {
    // 转换回存储格式
    const newConfig = {
      salary: values.salary,
      workDays: values.workDays,
      startTime: values.startTime.format('HH:mm'),
      endTime: values.endTime.format('HH:mm'),
    };

    localStorage.setItem('dayday-config', JSON.stringify(newConfig));
    ipcRenderer.send('settings-updated');
    message.success('配置已保存，实时生效！');
  };

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        algorithm: theme.darkAlgorithm, // 启用深色模式
        token: {
          colorPrimary: '#FFD700', // 主色调
          borderRadius: 8,
        },
        components: {
          Card: {
            colorBgContainer: '#1f1f1f',
          }
        }
      }}
    >
      <div style={{ 
        padding: '24px', 
        minHeight: '100vh', 
        background: '#141414', 
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        <Title level={3} style={{ color: '#FFD700', marginBottom: 24, textAlign: 'center', marginTop: 0 }}>
          💰 天天赚钱
        </Title>
        
        <Card bordered={false}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            size="large"
          >
            <Form.Item 
              label="月薪 (¥)" 
              name="salary"
              rules={[{ required: true, message: '请输入月薪' }]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\¥\s?|(,*)/g, '')}
                placeholder="请输入您的月薪"
              />
            </Form.Item>

            <Form.Item 
              label="月工作天数" 
              name="workDays"
              rules={[{ required: true, message: '请输入天数' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} max={31} suffix="天" placeholder="例如: 22" />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item 
                label="上班时间" 
                name="startTime"
                rules={[{ required: true }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="09:30" />
              </Form.Item>

              <Form.Item 
                label="下班时间" 
                name="endTime"
                rules={[{ required: true }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="18:30" />
              </Form.Item>
            </div>

            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block size="large" style={{ fontWeight: 'bold', height: '48px' }}>
                保存配置
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <div style={{ 
          marginTop: 'auto', 
          textAlign: 'center', 
          color: '#666',
          fontSize: '12px',
          padding: '16px'
        }}>
          快捷键 <Text code style={{ color: '#888' }}>Cmd+Shift+I</Text> 快速隐藏
        </div>
      </div>
    </ConfigProvider>
  );
};

function App() {
  const [config, setConfig] = useConfig();
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route.includes('settings')) {
    return <SettingsWindow config={config} />;
  }

  return <FloatingWindow config={config} />;
}

export default App;
