/**
 * src/App.jsx
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { ConfigProvider, theme, Form, InputNumber, TimePicker, Button, message, Card, Typography, Modal } from 'antd';
import dayjs from 'dayjs';
import locale from 'antd/locale/zh_CN';
import { ExclamationCircleFilled } from '@ant-design/icons';
import moneyImage from './assets/money.png'; // 导入人民币图片

const { ipcRenderer } = window.require('electron'); 
const { Title, Text } = Typography;
const { confirm } = Modal;

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
    WebkitAppRegion: 'no-drag', // 关键：取消拖拽，让鼠标事件生效
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

  // 计算人民币张数（按100元面值计算）
  const moneyCount = useMemo(() => Math.max(1, Math.floor(earned / 100)), [earned]);

  // 渲染人民币扇形
  const renderMoneyFan = () => {
    const moneyWidth = 160; 
    const moneyHeight = 75;

    // 少于4张：平铺展示，从上到下排列
    if (moneyCount < 3) {
      const spacing = 20; // 人民币之间的间距，减小间距
      
      return (
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          top: '-100px',
        }}>
          {Array.from({ length: moneyCount }).map((_, index) => (
            <img 
              key={index}
              src={moneyImage}
              alt="money"
              style={{
                width: `${moneyWidth}px`,
                height: `${moneyHeight}px`,
                marginBottom: index < moneyCount - 1 ? `${spacing}px` : '0',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      );
    }

    // 多张扇形展开：从上到下堆叠，编号从大到小，以左上角为圆心逆时针旋转
    const totalAngle = 120; // 总旋转角度
    const anglePerMoney = totalAngle / moneyCount; // 每张人民币对应的角度

    return (
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}>
        {Array.from({ length: moneyCount }).map((_, index) => {
          // 编号从 moneyCount 到 1（从上到下，上层的编号大）
          const number = moneyCount - index;
          // 逆时针旋转角度：number * anglePerMoney，逆时针用负值
          const angle =  (number * anglePerMoney) - 180;
          
          return (
            <img 
              key={index}
              src={moneyImage}
              alt="money"
              style={{
                position: 'absolute',
                width: `${moneyWidth}px`,
                height: `${moneyHeight}px`,
                // 以左上角为旋转中心
                transformOrigin: 'left top',
                // 所有人民币的左上角重叠在中心点
                top: '270px',
                left: '50%',
                transform: `rotate(${angle}deg)`,
                transition: 'all 0.3s ease',
                // zIndex: 编号越大越在上层
                zIndex: number,
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div 
      style={{
        ...styles.floatingContainer,
      }}
    >
      {/* 人民币展示区域 - 在窗口顶部，向上展开 */}
      <div style={{
        width: '380px', // 配合窗口宽度400px，留20px边距
        height: '400px', // 人民币向上展开的高度
        position: 'absolute',
        top: '0', // 顶部对齐
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: isHovered ? 1 : 0,
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease',
      }}>
        {renderMoneyFan()}
      </div>

      {/* 收入卡片 - 在窗口底部，分区域控制拖拽 */}
      <div 
        style={{
          ...styles.contentCard,
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          WebkitAppRegion: 'drag', // 默认可拖拽
        }}
      >
        {/* 标题区域 - 可拖拽 */}
        <div style={{
          ...styles.label,
          cursor: 'move',
          padding: '5px 0',
        }}>
          今日入账
        </div>
        
        {/* 数字区域 - 不可拖拽（响应hover） */}
        <div 
          style={{
            ...styles.money,
            WebkitAppRegion: 'no-drag', // 数字区域禁止拖拽，允许hover
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          ¥{earned.toFixed(2)}
        </div>
        
        <button 
          onClick={() => ipcRenderer.send('open-settings')}
          style={{
            ...styles.settingsBtn,
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateX(-50%) translateY(-8px)' : 'translateX(-50%) translateY(-10px)',
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

  useEffect(() => {
    form.setFieldsValue({
      salary: initialConfig.salary,
      workDays: initialConfig.workDays,
      startTime: dayjs(initialConfig.startTime, 'HH:mm'),
      endTime: dayjs(initialConfig.endTime, 'HH:mm'),
    });
  }, [initialConfig, form]);

  const onFinish = (values) => {
    const newConfig = {
      salary: values.salary,
      workDays: values.workDays,
      startTime: values.startTime.format('HH:mm'),
      endTime: values.endTime.format('HH:mm'),
    };

    localStorage.setItem('dayday-config', JSON.stringify(newConfig));
    ipcRenderer.send('settings-updated');
    
    // 使用 Modal.success 提供更优雅的反馈
    Modal.success({
      title: '保存成功',
      content: '配置已更新，收入计算已实时生效！',
      okText: '知道了',
      centered: true,
      onOk() {
        // 用户点击确认后，再用淡出动画关闭窗口
        setTimeout(() => {
          ipcRenderer.send('close-settings');
        }, 200);
      },
    });
  };
  
  // 退出应用逻辑
  const handleQuit = () => {
    confirm({
      title: '确认退出?',
      icon: <ExclamationCircleFilled />,
      content: '退出后将无法看到实时收入，确定要离开吗？',
      okText: '残忍退出',
      okType: 'danger',
      cancelText: '继续使用',
      onOk() {
        ipcRenderer.send('app-quit');
      },
      onCancel() {},
    });
  };

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        algorithm: theme.darkAlgorithm, 
        token: {
          colorPrimary: '#FFD700', 
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
          💰 实时收入
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
          </Form>
        </Card>

        {/* 底部操作按钮区 */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Button 
            type="primary" 
            size="large" 
            block 
            onClick={() => form.submit()} 
            style={{ height: 48, fontWeight: 'bold', fontSize: 16 }}
          >
            保存配置
          </Button>
          
          <Button 
            danger 
            size="large" 
            block 
            onClick={handleQuit}
            style={{ height: 48, fontWeight: 'bold', fontSize: 16 }}
          >
            退出应用
          </Button>
        </div>

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
