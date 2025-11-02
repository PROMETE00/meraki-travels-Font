// components/ui/Button.tsx
'use client';
import React from 'react';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'ghost' };
export default function Button({ variant='primary', className='', ...props }: Props){
  const base = 'rounded-xl px-4 py-2 text-sm font-semibold';
  const v = variant === 'primary' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-white/5 hover:bg-white/10';
  return <button className={`${base} ${v} ${className}`} {...props} />;
}