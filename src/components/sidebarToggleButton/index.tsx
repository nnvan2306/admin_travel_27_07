import React from 'react';
import { Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

interface SidebarToggleButtonProps {
  collapsed: boolean;
  onToggle: () => void;
}

const SidebarToggleButton: React.FC<SidebarToggleButtonProps> = ({ collapsed, onToggle }) => {
  return (
    <Button type="primary" onClick={onToggle} style={{ marginBottom: 16 }}>
      {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
    </Button>
  );
};

export default SidebarToggleButton;
