'use client';

import React from 'react';
import { DailyTodoList } from './DailyTodoList';

export function TasksOverview() {
  return (
    <div className="w-full h-full max-w-4xl mx-auto px-2 sm:px-6 py-6 pb-28 md:pb-28 animate-in fade-in duration-200">
      <DailyTodoList />
    </div>
  );
}
