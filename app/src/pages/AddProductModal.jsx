import React from 'react';
import { Modal, Form, Input, Button, InputNumber, Space, Toast } from 'antd-mobile';
import { AddOutline, MinusCircleOutline } from 'antd-mobile-icons';
import { db } from '../db';

const AddProductModal = ({ visible, onClose }) => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      // Filter out empty attribute key-value pairs
      const filteredAttributes = values.attributes
        ? values.attributes.filter(attr => attr.key && attr.value)
        : [];

      await db.products.add({
        name: values.name,
        price: parseFloat(values.price),
        stock: parseInt(values.stock, 10),
        description: values.description,
        attributes: filteredAttributes,
        createdAt: new Date(),
      });
      form.resetFields();
      Toast.show({
        icon: 'success',
        content: '产品添加成功',
      });
      onClose();
    } catch (error) {
      console.error('Failed to add product:', error);
      Toast.show({
        icon: 'fail',
        content: '产品添加失败',
      });
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

          <Form.List name="attributes">
            {({ add, remove, fields }) => {
              return (
                <>
                  {fields.map((field, index) => {
                    return (
                      <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item
                          {...field}
                          label={index === 0 ? '子属性' : ''} // Only show label for the first item
                          name={[field.name, 'key']}
                          rules={[{ required: true, message: '请输入属性名称' }]}
                          style={{ flex: 1 }}
                        >
                          <Input placeholder="属性名称 (如: 颜色)" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          label={index === 0 ? '属性值' : ''} // Only show label for the first item
                          name={[field.name, 'value']}
                          rules={[{ required: true, message: '请输入属性值' }]}
                          style={{ flex: 1 }}
                        >
                          <Input placeholder="属性值 (如: 红色)" />
                        </Form.Item>
                        <MinusCircleOutline onClick={() => remove(field.name)} />
                      </Space>
                    )
                  })}
                  <Button
                    onClick={() => add()}
                    block
                    // color="primary" // Consider a subtle color or outline for this button
                    fill='outline'
                    size='small'
                    icon={<AddOutline />}
                  >
                    添加子属性
                  </Button>
                </>
              )
            }}
          </Form.List>
        </Form>
      }
    />
  );
};

export default AddProductModal;
