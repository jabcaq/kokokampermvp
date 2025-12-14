import { useEffect, useState } from 'react';
import { currentEnvironment } from '@/integrations/supabase/environmentClient';

export function EnvironmentBadge() {
  const [env, setEnv] = useState(currentEnvironment);

  useEffect(() => {
    const handleEnvChange = (e: CustomEvent) => {
      setEnv(e.detail?.name || 'production');
      window.location.reload();
    };
    
    window.addEventListener('lovasync:env-changed', handleEnvChange as EventListener);
    return () => window.removeEventListener('lovasync:env-changed', handleEnvChange as EventListener);
  }, []);

  if (env === 'production') return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      padding: '6px 12px',
      background: env === 'development' ? '#3b82f6' : '#f59e0b',
      color: 'white',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
    }}>
      {env}
    </div>
  );
}
