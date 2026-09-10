'use client';

import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { StudyRoom } from '../../types';
import { X, Users, Plus, Hash, Lock, Globe, Check, Sparkles } from 'lucide-react';

interface RoomSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoomSelectorModal({ isOpen, onClose }: RoomSelectorModalProps) {
  const { rooms, currentRoomId, switchRoom, createRoom } = useRoom();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<StudyRoom['category']>('general');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createRoom({
      name: name.trim(),
      description: description.trim() || 'Collaborative study space',
      category,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : ['Study', 'Focus'],
      isPrivate,
      passcode: isPrivate ? passcode : undefined,
      maxMembers: 50,
      createdBy: 'user',
    });

    setIsCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Study Rooms & Lounges</h3>
              <p className="text-xs text-slate-400">Join a virtual study hall or create a private room</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Room Form */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="my-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Create New Study Room</h4>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Room Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Late Night Hackers 🌙"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Short focus guidelines..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as StudyRoom['category'])}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="general">General Focus</option>
                  <option value="stem">STEM & Coding</option>
                  <option value="medical">Medical / MCAT</option>
                  <option value="pomodoro">Pomodoro Sprints</option>
                  <option value="language">Language Learning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="Silent, Math, 24/7"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Room</span>
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full my-4 py-2.5 px-4 rounded-xl border border-dashed border-emerald-500/50 hover:border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Study Room</span>
          </button>
        )}

        {/* Room List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {rooms.map(room => {
            const isSelected = room.id === currentRoomId;
            return (
              <div
                key={room.id}
                onClick={() => {
                  switchRoom(room.id);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{room.name}</span>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{room.memberCount} members</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-2">{room.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {room.tags.map(t => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/60 text-slate-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
