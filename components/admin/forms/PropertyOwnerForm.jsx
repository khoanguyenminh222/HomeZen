'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { propertyInfoSchema } from '@/lib/validations/propertyInfo';

// Extend schema for user account fields
const createFormSchema = (isEdit) => {
    const baseSchema = propertyInfoSchema.extend({
        username: z.string()
            .min(3, 'Username tối thiểu 3 ký tự')
            .max(50, 'Username tối đa 50 ký tự')
            .regex(/^[a-zA-Z0-9_]+$/, 'Username chỉ chứa chữ, số và gạch dưới'),
        // Password is optional in edit mode
        password: isEdit
            ? z.string().optional()
            : z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    });

    return baseSchema;
};

export default function PropertyOwnerForm({
    defaultValues,
    onSubmit,
    onCancel,
    isEdit = false,
    isPropertyEditOnly = false // Flag for property-only edit (no username/password fields)
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Prepare default values
    const initialValues = {
        username: defaultValues?.username || '',
        password: '',
        // Support both direct properties and nested propertyInfo structure
        name: defaultValues?.propertyName || defaultValues?.name || defaultValues?.propertyInfo?.name || '',
        address: defaultValues?.propertyAddress || defaultValues?.address || defaultValues?.propertyInfo?.address || '',
        phone: defaultValues?.phone || defaultValues?.propertyInfo?.phone || '',
        ownerName: defaultValues?.ownerName || defaultValues?.propertyInfo?.ownerName || '',
        email: defaultValues?.email || defaultValues?.propertyInfo?.email || '',
        maxElectricMeter: defaultValues?.maxElectricMeter || defaultValues?.propertyInfo?.maxElectricMeter || 999999,
        maxWaterMeter: defaultValues?.maxWaterMeter || defaultValues?.propertyInfo?.maxWaterMeter || 99999,
    };

    const form = useForm({
        resolver: zodResolver(createFormSchema(isEdit)),
        defaultValues: initialValues,
    });

    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            // Map back to API expected format if needed
            const submitData = {
                ...values,
                propertyName: values.name, // API expects propertyName usually
                propertyAddress: values.address, // API expects propertyAddress usually
            };

            await onSubmit(submitData);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    {/* User Account Fields - Hide if property edit only */}
                    {!isPropertyEditOnly && (
                        <>
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={isEdit} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {(!isEdit) && (
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mật khẩu <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </>
                    )}

                    {/* Property Info Fields */}
                    <FormField
                        control={form.control}
                        name="name" // Mapped to propertyName
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên nhà trọ <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="address" // Mapped to propertyAddress
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Địa chỉ <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Số điện thoại <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên chủ nhà <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="maxElectricMeter"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Max Đồng hồ điện</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="maxWaterMeter"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Max Đồng hồ nước</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Hủy
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
