import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Toast } from 'antd-mobile';
import { AddOutline, MinusCircleOutline } from 'antd-mobile-icons';
import { db } from '../db';

const EditProductModal = ({ visible, onClose, product }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && product) {
      form.setFieldsValue(product);
    } else {
      form.resetFields();
    }
  }, [visible, product, form]);

  const onFinish = async (values) => {
    try {
      // Filter out empty attribute key-value pairs
      const filteredAttributes = values.attributes
        ? values.attributes.filter(attr => attr && attr.key && attr.value)
        : [];

      await db.products.update(product.id, {
        name: values.name,
        price: parseFloat(values.price),
        stock: parseInt(values.stock, 10),
        description: values.description,
        attributes: filteredAttributes,
      });
      Toast.show({
        icon: 'success',
        content: '产品更新成功',
      });
      onClose();
    } catch (error) {
      console.error('Failed to update product:', error);
      Toast.show({
        icon: 'fail',
        content: '产品更新失败',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="编辑产品"
      content={
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary">
              保存更改
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
            <Input placeholder="例如：99.00" />
          </Form.Item>
          <Form.Item
            name="stock"
            label="当前库存"
            rules={[{ required: true, message: '请输入当前库存' }]}
          >
            <Input placeholder="例如：100" />
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
                      <Space key={field.key} style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
                        <Form.Item
                          {...field}
                          label={index === 0 ? '子属性' : ''}
                          name={[field.name, 'key']}
                          rules={[{ required: true, message: '请输入属性名称' }]}
                          style={{ flex: 1, marginRight: '8px' }}
                        >
                          <Input placeholder="属性名称 (如: 颜色)" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          label={index === 0 ? '属性值' : ''}
                          name={[field.name, 'value']}
                          rules={[{ required: true, message: '请输入属性值' }]}
                          style={{ flex: 1 }}
                        >
                          <Input placeholder="属性值 (如: 红色)" />
                        </Form.Item>
                        <MinusCircleOutline onClick={() => remove(field.name)} style={{ marginLeft: '8px', flexShrink: 0 }} />
                      </Space >
                    )
                  })}
                  <Button
                    onClick={() => add()}
                    block
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

export default EditProductModal;
