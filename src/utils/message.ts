import { message, Button } from 'antd';

export const success = (content: string) => {
  messageApi.open({
    type: 'success',
    content: content,
  });
};
export const error  = (content: string) => {
  messageApi.open({
    type: 'error ',
    content: content,
  });
};

export const warning = (content: string) => {
  messageApi.open({
    type: 'warning',
    content: content,
  });};