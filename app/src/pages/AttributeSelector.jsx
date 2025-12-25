import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Picker } from 'antd-mobile';

const AttributeSelector = ({ visible, product, onConfirm, onClose }) => {
  const [form] = Form.useForm();
  const [pickerColumns, setPickerColumns] = useState([]);

  useEffect(() => {
    if (product && product.attributes) {
      // For simplicity, this POC will only handle the first attribute.
      // A full implementation would need to generate a picker/selector for each attribute key.
      const firstAttribute = product.attributes[0];
      if (firstAttribute) {
        // This assumes the value is a comma-separated string like "Red,Blue,Green"
        // In a real app, the data structure might be better, e.g., an array.
        const options = firstAttribute.value.split(',').map(v => ({ label: v, value: v }));
        setPickerColumns([{
            key: firstAttribute.key,
            options: options,
        }]);
      }
    }
  }, [product]);

  const onFinish = (values) => {
    // `values` will be like { attribute_Color: "Red" }
    // We need to transform it back to the standard format.
    const selectedAttributes = Object.keys(values).map(formKey => {
        const key = formKey.replace('attribute_', '');
        return { key: key, value: values[formKey] };
    });
    onConfirm(product, selectedAttributes);
    form.resetFields();
    onClose();
  };

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`选择 ${product.name} 的属性`}
      content={
        <Form
          form={form}
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary">
              确定
            </Button>
          }
        >
          {pickerColumns.map(col => (
             <Form.Item
                key={col.key}
                name={`attribute_${col.key}`}
                label={col.key}
                trigger='onConfirm'
                onClick={(e, pickerRef) => {
                    pickerRef.current?.open()
                }}
             >
                <Picker columns={[col.options]}>
                    {value =>
                        (value && value.length > 0)
                        ? value[0].label
                        : '请选择'
                    }
                </Picker>
            </Form.Item>
          ))}
        </Form>
      }
    />
  );
};

export default AttributeSelector;
