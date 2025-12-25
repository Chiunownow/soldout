import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Toast } from 'antd-mobile';
import { AddOutline, MinusCircleOutline } from 'antd-mobile-icons';
import { db } from '../db';
import './ManualForm.css';

const AddProductModal = ({ visible, onClose }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState([]);

  useEffect(() => {
    if (visible) {
      setName('');
      setPrice('');
      setStock('');
      setDescription('');
      setAttributes([]);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!name || !price || !stock) {
      Toast.show({ content: '请填写产品名称、价格和库存' });
      return;
    }
    try {
      const filteredAttributes = attributes.filter(attr => attr.key && attr.value);
      await db.products.add({
        name,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        description,
        attributes: filteredAttributes,
        createdAt: new Date(),
      });
      Toast.show({ icon: 'success', content: '产品添加成功' });
      onClose();
    } catch (error) {
      console.error('Failed to add product:', error);
      Toast.show({ icon: 'fail', content: '产品添加失败' });
    }
  };

  const addAttributeField = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const removeAttributeField = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="添加新产品"
      content={
        <div className="manual-form">
          <div className="form-item">
            <label>产品名称</label>
            <Input placeholder="例如：T恤" value={name} onChange={setName} />
          </div>
          <div className="form-item">
            <label>销售价格</label>
            <Input placeholder="例如：99.00" type="number" value={price} onChange={setPrice} />
          </div>
          <div className="form-item">
            <label>初始库存</label>
            <Input placeholder="例如：100" type="number" value={stock} onChange={setStock} />
          </div>
          <div className="form-item">
            <label>文字描述</label>
            <textarea
              className="manual-textarea"
              placeholder="可选"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="form-item">
            <label>子属性</label>
            {attributes.map((attr, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, width: '100%' }}>
                <Input
                  placeholder="属性名称 (如: 颜色)"
                  value={attr.key}
                  onChange={val => handleAttributeChange(index, 'key', val)}
                  style={{ marginRight: 8 }}
                />
                <Input
                  placeholder="属性值 (如: 红色)"
                  value={attr.value}
                  onChange={val => handleAttributeChange(index, 'value', val)}
                />
                <MinusCircleOutline data-testid="remove-attribute-btn" onClick={() => removeAttributeField(index)} style={{ marginLeft: 8, flexShrink: 0 }} />
              </div>
            ))}
            <Button onClick={addAttributeField} block fill="outline" size="small">
              <AddOutline /> 添加子属性
            </Button>
          </div>
        </div>
      }
      actions={[
        {
          key: 'submit',
          text: '提交',
          primary: true,
          onClick: handleSubmit,
        },
      ]}
    />
  );
};

export default AddProductModal;
