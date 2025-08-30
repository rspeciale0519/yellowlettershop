'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormData as AddRecordFormData } from './types';

type FieldKey = keyof AddRecordFormData;

interface BasicInfoFormProps {
  formData: Readonly<AddRecordFormData>;
  errors: Partial<Record<FieldKey, string>>;
  onInputChange: (field: FieldKey, value: string) => void;
}

export function BasicInfoForm({
  formData,
  errors,
  onInputChange,
}: BasicInfoFormProps) {
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={(e) => onInputChange("firstName", e.target.value)}
              className="mt-1"
              placeholder="Enter first name"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={(e) => onInputChange("lastName", e.target.value)}
              className="mt-1"
              placeholder="Enter last name"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange("email", e.target.value)}
              className="mt-1"
              placeholder="Enter email address"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onInputChange("phone", e.target.value)}
              className="mt-1"
              placeholder="Enter phone number"
              autoComplete="tel"
              inputMode="tel"
              pattern="^\\+?[0-9\\s().-]{7,20}$"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="text-sm text-destructive mt-1">
                {errors.phone}
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={(e) => onInputChange("address", e.target.value)}
              className="mt-1"
              placeholder="Enter street address"
              autoComplete="address-line1"
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? "address-error" : undefined}
            />
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={(e) => onInputChange("city", e.target.value)}
                className="mt-1"
                placeholder="Enter city"
                autoComplete="address-level2"
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? "city-error" : undefined}
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={(e) => onInputChange("state", e.target.value.toUpperCase())}
                  className="mt-1"
                  placeholder="e.g., CA"
                  maxLength={2}
                  pattern="^[A-Za-z]{2}$"
                  title="Use the 2-letter state code (e.g., CA, NY)"
                  autoComplete="address-level1"
                  aria-invalid={!!errors.state}
                  aria-describedby={errors.state ? "state-error" : undefined}
                />
                {errors.state && (
                  <p id="state-error" className="text-sm text-destructive mt-1">
                    {errors.state}
                  </p>
                )}
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              className='mt-1'
              placeholder='Enter email address'
            />
            {errors.email && (
              <p className='text-sm text-destructive mt-1'>{errors.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor='phone'>Phone</Label>
            <Input
              id='phone'
              type='tel'
              value={formData.phone}
              onChange={(e) => onInputChange('phone', e.target.value)}
              className='mt-1'
              placeholder='Enter phone number'
            />
            {errors.phone && (
              <p className='text-sm text-destructive mt-1'>{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      <div className='border rounded-md p-4'>
        <h4 className='font-medium mb-4'>Address Information</h4>
        <div className='grid grid-cols-1 gap-4'>
          <div>
            <Label htmlFor='address'>Address</Label>
            <Input
              id='address'
              value={formData.address}
              onChange={(e) => onInputChange('address', e.target.value)}
              className='mt-1'
              placeholder='Enter street address'
            />
            {errors.address && (
              <p className='text-sm text-destructive mt-1'>{errors.address}</p>
            )}
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='city'>City</Label>
              <Input
                id='city'
                value={formData.city}
                onChange={(e) => onInputChange('city', e.target.value)}
                className='mt-1'
                placeholder='Enter city'
              />
              {errors.city && (
                <p className='text-sm text-destructive mt-1'>{errors.city}</p>
              )}
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='state'>State</Label>
                <Input
                  id='state'
                  value={formData.state}
                  onChange={(e) =>
                    onInputChange('state', e.target.value.toUpperCase())
                  }
                  className='mt-1'
                  placeholder='e.g., CA'
                  maxLength={2}
                />
                {errors.state && (
                  <p className='text-sm text-destructive mt-1'>
                    {errors.state}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='zipCode'>Zip Code</Label>
                <Input
                  id='zipCode'
                  value={formData.zipCode}
                  onChange={(e) => onInputChange('zipCode', e.target.value)}
                  className='mt-1'
                  placeholder='e.g., 90210'
                  maxLength={10}
                />
                {errors.zipCode && (
                  <p className='text-sm text-destructive mt-1'>
                    {errors.zipCode}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
