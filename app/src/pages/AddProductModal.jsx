import React from 'react';
import { Modal, Form, Input, Button, InputNumber } from 'antd-mobile';
import { db } from '../db';

const AddProductModal = ({ visible, onClose }) => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      await db.products.add({
        name: values.name,
        price: parseFloat(values.price),
        stock: parseInt(values.stock, 10),
        description: values.description,
        attributes: [], // Will implement attributes later
        createdAt: new Date(),
      });
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="添加新产品"
      content={
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary">
              提交
            </Button>
          }
        >
          <Form.Item
            name="name"
            label="产品名称"
            rules={[{ required: true, message: '请输入产品名称' }]}
          >
            <Input placeholder="例如：T恤" />
          </Form.Item>
          <Form.Item
            name="price"
            label="销售价格"
            rules={[{ required: true, message: '请输入销售价格' }]}
          >
            <InputNumber placeholder="例如：99.00" min={0} />
          </Form.Item>
          <Form.Item
            name="stock"
            label="初始库存"
            rules={[{ required: true, message: '请输入初始库存' }]}
          >
            <InputNumber placeholder="例如：100" min={0} precision={0} />
          </Form.Item>
          <Form.Item name="description" label="文字描述">
            <Input.TextArea placeholder="可选" />
          </Form.Item>
        </Form>
      }
    />
  );
};

export default AddProductModal;
