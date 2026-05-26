import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import styles from './LoginPage.module.css';

const { Title } = Typography;

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const response = await axiosInstance.post('/auth/login', {
                email: values.email,
                password: values.password,
            });
            
            const accessToken = response.data.accessToken || response.data.token;
            
            if (accessToken) {
                login(accessToken);
                message.success('Login successful');
                navigate('/dashboard');
            } else {
                throw new Error('No access token received from server');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to login. Please try again.';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <div className={styles.logoArea}>
                    <div className={styles.logoIcon}>J</div>
                    <Title level={3} className={styles.title}>Log in to your account</Title>
                </div>
                
                <Form
                    name="login_form"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please input your email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input placeholder="Enter your email" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password placeholder="Enter your password" />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" loading={loading} className={styles.submitBtn} block>
                            Log in
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
