import React from 'react';
import NewChatIcon from './icons/NewChatIcon';

const Sidebar = ({ chats, activeChatId, onSelectChat, onNewChat, isOpen }) => {
  return (
    <div
      className={`absolute top-0 left-0 h-full bg-[#171717] text-white w-64 transform transition-transform duration-300 ease-in-out z-20 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4 flex flex-col h-full">
        <button
          onClick={onNewChat}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors w-full text-left"
        >
          <NewChatIcon className="w-6 h-6" />
          <span className="font-semibold">New Chat</span>
        </button>
        <div className="mt-4 flex-1 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-400 px-3">History</h2>
          <ul className="mt-2 space-y-1">
            {chats.map((chat) => (
              <li key={chat.id}>
                <button
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg truncate transition-colors text-sm ${
                    activeChatId === chat.id ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  {chat.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
