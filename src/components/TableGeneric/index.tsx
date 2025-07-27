
import { Table, Dropdown, Space } from 'antd';
import { BsThreeDots } from "react-icons/bs";
import type { ColumnsType } from 'antd/es/table';

export type TableAction = {
  key: string;
  label: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export interface TableGenericProps<T> {
  data: T[];
  columns: ColumnsType<T>;
  loading?: boolean;
  rowKey?: string;
  contextHolder?: React.ReactNode;
  getActions?: (record: T) => TableAction[];
}

export default function TableGeneric<T extends { id: number }>({
  data,
  columns,
  loading = false,
  rowKey = 'id',
  contextHolder,
  getActions,
}: TableGenericProps<T>) {
  const mergedColumns: ColumnsType<T> = [
    ...columns,
    ...(getActions
      ? [{
        title: 'Action',
        key: 'action',
        render: (_: any, record: T) => (
          <Dropdown
            menu={{
              items: getActions(record).map(action => ({
                key: action.key,
                label: (
                  <span
                    onClick={action.disabled ? undefined : action.onClick}
                    style={{ color: action.disabled ? '#bfbfbf' : undefined }}
                  >
                    {action.label}
                  </span>
                ),
                disabled: action.disabled,
                danger: action.danger,
              })),
            }}
            trigger={['click']}
          >
            <a onClick={e => e.preventDefault()} className="w-full block">
              <Space>
                <div className="w-full flex justify-center px-3">
                  <BsThreeDots />
                </div>
              </Space>
            </a>
          </Dropdown>
        ),
      }]
      : [])
  ];

  return (
    <>
      {contextHolder}
      <Table<T>
        rowKey={rowKey}
        columns={mergedColumns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
        className='shadow-lg'
      />
    </>
  );
}
