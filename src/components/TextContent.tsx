'use client';

import React from 'react';

interface TextContentProps {
  title: string;
  body: string;
}

export default function TextContent({ title, body }: TextContentProps) {
  return (
    <div className="mb-6 px-4 md:px-8 max-w-4xl mx-auto text-center">
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold text-content-text mb-3 font-serif">
          {title}
        </h2>
      )}
      {body && (
        <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
          {body}
        </p>
      )}
    </div>
  );
}
